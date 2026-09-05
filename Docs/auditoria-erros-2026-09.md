# Auditoria de erros — StudyWeb (2026-09-05)

Auditoria completa do sistema (backend Spring Boot + frontend React), feita por 8 revisões
independentes cobrindo cada módulo do backend (`usuario`, `deck`/`material`,
`flashcard`/`revisao`, `quiz`/`ia`, `dashboard`/`compartilhamento`/`config`) e do frontend
(`api`/`context`/`utils`, `pages`, `components`). Cada achado foi verificado com um cenário
concreto de falha — nada de estilo ou preferência de formatação.

Não estão aqui os bugs de cadastro/login/recuperação de conta já corrigidos nesta mesma sessão
(fluxo de verificação de e-mail, token de 10min + limpeza de contas não verificadas, link
clicável nos e-mails, bug de `key` duplicada em `Layout.tsx`, sticky da margem na Início,
redesign das telas de auth).

**Legenda de esforço:** 🟢 pequeno (< 1h) · 🟡 médio (1 dia) · 🔴 grande (vários dias / decisão de arquitetura)

---

## Resumo executivo

| Área | Crítico | Alto | Médio | Baixo |
|---|---|---|---|---|
| Backend — usuario/conta | – | – | 3 | – |
| Backend — deck/material | 1 | 1 | 2 | 2 |
| Backend — flashcard/revisão | – | 2 | 2 | – |
| Backend — quiz/IA | – | 2 | 1 | – |
| Backend — dashboard/compartilhamento/config | – | – | 2 | 1 |
| Frontend — api/context/utils | – | 1 | 2 | 2 |
| Frontend — pages | – | 1 | 2 | – |
| Frontend — components | – | 1 | 3 | 1 |
| **Total** | **1** | **8** | **17** | **6** |

**Achado estrutural mais importante:** vários bugs do frontend (achados F1, F5, F6, F7) têm a
**mesma causa raiz** — nenhuma página remonta os componentes de aba ao trocar de deck (falta
`key={deckId}`), e nenhuma função de `api/*.ts` suporta cancelamento. Uma única correção
(Fix #F0 abaixo) resolve a maior parte deles de uma vez.

---

## 1. Backend

### B1 — [🔴 Crítico] Excluir um deck não apaga os arquivos físicos dos PDFs em disco
**Arquivo:** `deck/DeckService.java` (`excluir`), contraste com `material/MaterialOrigemService.java` (`excluirArquivoFisico`)

`DeckService.excluir()` só chama `deckRepository.delete(deck)`. A cascata do JPA/banco apaga as
linhas de `material_origem`, mas nada apaga o arquivo em `uploads/{deckId}/{uuid}.pdf` — essa
limpeza só existe no endpoint individual `DELETE /api/materiais/{id}`.

**Cenário:** usuário sobe um PDF de 10MB, depois exclui o deck inteiro. O registro some do banco,
o arquivo fica no disco para sempre (RN29/RNF07 quebradas). Repetido ao longo do tempo, vaza
espaço em disco sem limite. O teste `DeckExclusaoCascataTest` só confere o banco, não o disco.

**Fix:** em `DeckService.excluir()`, antes de `deckRepository.delete(deck)`, iterar
`deck.getMateriais()` e apagar cada arquivo físico (reaproveitar a lógica de
`excluirArquivoFisico`, movendo-a para um serviço compartilhado se necessário).

---

### B2 — [🟡 Alto] PDF corrompido pode causar 500 + arquivo órfão em vez do fluxo de erro já implementado
**Arquivo:** `material/PdfTextExtractorService.java:20-33`

O `catch` só cobre `IOException`. PDFBox lança exceções não-checked
(`IllegalArgumentException`, `NullPointerException`) para PDFs com estrutura corrompida que não
se encaixam em `IOException`. Isso escapa do `catch`, reverte a transação inteira (incluindo o
`INSERT` de `MaterialOrigem` já feito) e cai no handler genérico → 500, com o arquivo já salvo em
disco virando órfão.

**Fix:** trocar `catch (IOException e)` por `catch (IOException | RuntimeException e)` (ou
`Exception`), preservando a conversão para `ExtracaoTextoException` — assim cai no fluxo RN07
(status `ERRO`) já existente, em vez de 500.

---

### B3 — [🟡 Médio] Nome de arquivo muito longo derruba o upload com 500 + arquivo órfão
**Arquivo:** `material/MaterialOrigemService.java:98-117` (`validarArquivo`)

A coluna `nome_arquivo` é `varchar(255)`, mas `validarArquivo` nunca checa o tamanho de
`arquivo.getOriginalFilename()`. Um nome de arquivo > 255 caracteres passa a validação, o arquivo
físico é salvo, e o `INSERT` falha com `DataIntegrityViolationException` sem handler específico
→ 500 + arquivo órfão.

**Fix:** validar `nomeOriginal.length() > 255` em `validarArquivo`, antes de salvar o arquivo em
disco.

---

### B4 — [🟢 Médio/baixo] N+1 ao listar decks
**Arquivo:** `deck/DeckService.java:51-58` (`listar`)

Para cada deck do usuário, uma query `COUNT` separada (`flashcardRepository.countByDeckId`) é
disparada — 1+N queries em vez de uma agregada.

**Fix:** substituir por uma consulta agregada (`GROUP BY deck_id`) que devolva
`Map<Long, Long>` de uma vez para todos os decks do usuário.

---

### B5 — [🟢 Baixo] Sem paginação nem limite de quantidade de materiais por deck
**Arquivos:** `deck/DeckController.java`, `material/MaterialOrigemController.java`,
`material/MaterialOrigemService.java` (`enviarPdf`)

RN06 limita o tamanho de cada PDF (15MB) mas não a *quantidade* por deck, e as listagens não
paginam. Não é uma violação de spec (o contrato atual não exige paginação), mas é um ponto de
crescimento sem limite se o TCC evoluir para uso real. Tratar como melhoria, não bug — decidir
se vale a pena para o escopo do projeto.

---

### B6 — [🟡 Alto] Job de lembrete diário aborta silenciosamente no primeiro e-mail que falhar
**Arquivo:** `revisao/LembreteRevisaoService.java:40`

```java
lembretes.forEach(this::enviarEmail);
```

Se `enviarEmail` lançar (endereço inválido, timeout SMTP), a exceção propaga e interrompe o
processamento de **todos os usuários seguintes** naquela execução do cron — sem log de erro por
usuário. Viola RN39 ("o sistema envia... a cada usuário com pendência").

**Fix:** envolver cada envio individualmente em try/catch, logando erro por usuário sem
interromper o loop:
```java
lembretes.forEach(l -> {
    try { enviarEmail(l); }
    catch (Exception e) { log.error("Falha ao enviar lembrete: email={}", l.email(), e); }
});
```

---

### B7 — [🟡 Alto] N+1 no job de lembrete diário (roda para todos os usuários, todo dia)
**Arquivo:** `revisao/LembreteRevisaoDadosService.java:32-58`, query em
`RevisaoFlashcardRepository.java:72-86`

A JPQL não faz `JOIN FETCH` de `deck`/`deck.usuario` (ambos `LAZY`), mas o código acessa
`f.getDeck().getUsuario().getId()` e `f.getDeck().getTitulo()` — cada deck/usuário distinto
dispara uma query lazy extra. Com 500 flashcards pendentes em 120 decks de 40 usuários, isso é
~160 queries extras por execução do cron, todo dia.

**Fix:** adicionar `JOIN FETCH f.deck d JOIN FETCH d.usuario` nas queries de
`RevisaoFlashcardRepository` que acessam esses campos.

---

### B8 — [🟡 Médio] Ordenar a fila de estudo dispara uma query por comparação
**Arquivo:** `revisao/RevisaoService.java:56-57, 93-97`

`Comparator.comparing(this::proximaRevisaoOuMaisAntiga)` reavalia o extractor (que faz uma query)
a cada comparação do sort — O(n log n) queries em vez de O(n). Um deck com 100 flashcards
pendentes gera dezenas a centenas de queries só para montar a fila de estudo.

**Fix:** buscar todas as revisões relevantes de uma vez (`findByFlashcardIdIn`, já existe),
montar um `Map<Long, LocalDate>` e ordenar em memória usando esse mapa.

---

### B9 — [🟡 Médio] Sem lock: avaliações concorrentes do mesmo flashcard corrompem o estado do SM-2
**Arquivo:** `revisao/RevisaoService.java:67-91` (`avaliarResposta`)

Lê o último estado, calcula em memória, insere um novo registro — sem lock pessimista, sem
`@Version`, sem constraint de unicidade. Duas requisições quase simultâneas (duplo clique, retry
automático do frontend) para o mesmo flashcard leem o mesmo estado anterior e calculam
independentemente — o resultado final depende de qual `INSERT` tem timestamp mais recente por
acaso, não da ordem real de avaliação. Corrompe silenciosamente o SM-2 (RN09).

**Fix:** serializar leitura+cálculo+escrita por flashcard (lock pessimista na leitura, ou travar
a linha do `Flashcard` antes de calcular o novo estado, dentro da mesma transação).

---

### B10 — [🟡 Alto] Retry de geração de prova não cobre falhas reais de infraestrutura da API Gemini
**Arquivo:** `ia/ProvaGenerationService.java:55` (`gerarComRetry`)

`GeminiClient.gerarConteudo()` lança sempre `GeracaoFlashcardsException` para timeout, rate
limit (429), chave inválida (403) ou erro de rede. `gerarComRetry` só captura
`GeracaoProvaException` (classe irmã, sem relação de herança) — então o retry de até 2 tentativas
só funciona para JSON malformado, nunca para o tipo de falha mais comum na prática (rede/cota).
`ProvaGenerationServiceTest` só testa retry para JSON malformado, nunca para falha de infra.

**Fix:** unificar as exceções de infraestrutura do `GeminiClient` numa exceção comum que os três
services (`FlashcardGenerationService`, `ProvaGenerationService`, e os já cientes
`RecomendacaoEstudoService`/`ExplicacaoService`, ver `Docs/extensao-recomendacao-foco-estudo.md`
§3) capturem igualmente antes de decidir se tentam de novo.

---

### B11 — [🟡 Alto] Dois endpoints que chamam a IA Gemini não têm rate limit
**Arquivo:** `config/RateLimitingFilter.java:48-58` (`REGRAS`)

Cobre `/gerar-flashcards`, `/quizzes` e `/provas`, mas **não** cobre
`POST /api/flashcards/{id}/explicacao` (UC14) nem `POST /api/decks/{id}/recomendacao-estudo`
(UC13) — ambos chamam `geminiClient.gerarConteudo`. Um usuário pode chamar qualquer um dos dois
em loop sem limite algum, esgotando a cota gratuita ou gerando custo real sem controle.

**Fix:** adicionar duas `Regra` novas em `REGRAS`, mesmo limite dos demais endpoints de IA
(ex.: 10/min por usuário).

---

### B12 — [🟢 Médio] N+1 no detalhe de tentativa de prova
**Arquivo:** `quiz/TentativaQuizRepository.java:25-40`, consumido em `quiz/QuizService.java:264-275`

`buscarDetalheDoUsuario` faz `JOIN FETCH` de `quiz` e `respostas`, mas não de
`respostas.questao` (comentário no repositório justifica errado, dizendo que não há N+1 porque a
tentativa é única — mas a *coleção* de respostas não é). Uma prova com 5-20 questões dispara uma
query extra por questão ao abrir o detalhe (`GET /api/usuario/provas/{id}`).

**Fix:** segunda query em lote (`SELECT ... FROM RespostaTentativaQuiz rq JOIN FETCH rq.questao
WHERE rq.tentativa.id = :id`, já que Hibernate não permite duas coleções `List` no fetch da
mesma query) ou configurar `hibernate.default_batch_fetch_size`.

---

### B13 — [🟡 Médio] Rate limiting por IP vira global atrás de qualquer proxy reverso
**Arquivo:** `config/RateLimitingFilter.java:87-95` (`resolverChaveCliente`)

As regras de login/cadastro/esqueci-senha (as que mais importam contra força bruta) usam
`request.getRemoteAddr()` sem ler `X-Forwarded-For` de um proxy confiável. Hoje não é explorável
(o backend não está atrás de proxy no `docker-compose.yml` atual), mas assim que um
TLS-termination/CDN entrar na frente, todo request passa a chegar com o mesmo IP (o do proxy) —
o limite "10 logins/min" vira um balde único compartilhado por *todos* os usuários, virando DoS
trivial contra login para todo mundo.

**Fix:** documentar essa dependência agora; quando o deploy evoluir para trás de proxy, configurar
`server.forward-headers-strategy=framework` restrito a uma lista de proxies confiáveis.

---

### B14 — [🟢 Baixo] Mapa de rate limiting cresce sem limite
**Arquivo:** `config/RateLimitingFilter.java:62`

`janelasPorChave` nunca remove entradas antigas — cada IP/usuário distinto fica para sempre em
memória. Baixo risco para o escopo do TCC; só relevante se o processo rodar por muito tempo.

---

### B15 — [🟢 Médio/baixo] Enumeração de deck IDs por diferença 403 vs 404
**Arquivo:** `deck/DeckService.java:92-102` (`buscarDeckDoUsuarioAutenticado`)

Distingue de propósito 403 ("existe mas não é seu") de 404 ("não existe") — ao contrário do
cuidado já tomado no lado público (`CompartilhamentoDeckService`, que unifica em 404 "para
evitar enumeração"). Um usuário autenticado pode incrementar `deckId` e mapear quais IDs existem
no sistema (de qualquer usuário), sem ver conteúdo. Baixo impacto, mas inconsistente com a
decisão já tomada no lado público.

**Fix (opcional):** unificar para 404 também quando "existe mas não é seu", ou documentar
conscientemente o trade-off.

---

### B16 — [🟡 Médio] Exportação de dados (LGPD/RN31) não inclui as respostas por questão das tentativas
**Arquivo:** `usuario/ExportacaoDadosService.java:44-51,80`, `usuario/TentativaExportadaDTO.java`

`RespostaTentativaQuiz` guarda por questão a alternativa escolhida e se acertou (dado exigido por
RN36), mas `ExportacaoDadosService` nunca busca essa entidade — `TentativaExportadaDTO` só tem
`id`, `dataTentativa`, `pontuacao`. O endpoint de portabilidade LGPD
(`GET /api/usuario/exportar-dados`) não devolve o detalhe das respostas. `QuizExportadoDTO`/
`QuestaoExportadaDTO` também omitem `origem`/`estilo`/`explicacao`.

**Fix:** injetar `RespostaTentativaQuizRepository`, buscar em lote por `tentativaId IN (...)`
(mesmo padrão já usado no service), adicionar `List<RespostaExportadaDTO>` em
`TentativaExportadaDTO`.

---

### B17 — [🟡 Médio] Token JWT de conta já excluída gera 500 em vez de erro tratado
**Arquivo:** `usuario/UsuarioService.java:135-139` (`buscarUsuarioAutenticado`),
replicado em `usuario/ExportacaoDadosService.java:55-57`

RN32 prevê explicitamente que tokens continuam válidos após a exclusão da conta. Quando isso
acontece, o código lança `IllegalStateException` (não é `NegocioException`, sem handler
dedicado) → cai no handler genérico → 500 com log em nível ERROR, para um cenário esperado e
documentado. Afeta `GET/PUT /api/usuario/perfil`, `PUT /api/usuario/senha`,
`DELETE /api/usuario/conta`, `GET /api/usuario/exportar-dados`.

**Fix:** trocar por uma exceção de negócio (`RecursoNaoEncontradoException` ou nova
`UsuarioNaoEncontradoException`, 401/404), logada em INFO/WARN.

---

### B18 — [🟡 Médio] Corrida no cadastro/atualização de perfil gera 500 em vez de 409
**Arquivo:** `usuario/UsuarioService.java:37-63` (`cadastrar`), `:76-94` (`atualizarPerfil`)

Padrão "check-then-act" sem lock: duas requisições concorrentes com o mesmo e-mail/nomeUsuario
(duplo clique, duas abas) podem passar a checagem antes de qualquer commit; a segunda `save()`
falha no banco com `DataIntegrityViolationException`, sem handler → 500 em vez do 409 já mapeado
para `EmailJaCadastradoException`/`NomeUsuarioJaCadastradoException`.

**Fix:** adicionar `@ExceptionHandler(DataIntegrityViolationException.class)` em
`TratamentoErrosGlobal` (409, mensagem genérica), ou try/catch nos dois métodos convertendo para
as exceções de negócio já existentes.

---

## 2. Frontend

### F0 — [🟡 Médio, mas resolve 4 achados de uma vez] Trocar de deck rápido não remonta as abas — dados de um deck vazam para outro
**Arquivo:** `pages/DeckDetalhePage.tsx:83` (o `<Tabs>` que envolve todas as 5 abas)

Nenhum componente de aba (`FlashcardsTab`, `MateriaisTab`, `EstudarTab`, `QuizTab`,
`DashboardTab`) é remontado ao navegar entre `/decks/A` e `/decks/B` (mesma rota, param
diferente) — nenhum tem `useEffect` reagindo à mudança de `deckId` para resetar/cancelar. Isso é
a causa raiz de F1, F5 e parte de F6/F7 abaixo.

**Cenário:** usuário está na aba "Estudar" do deck A, navega rápido pro deck B sem trocar de
aba. Se a resposta do deck A chegar depois da do deck B, `setFila` do deck A sobrescreve a fila
correta do deck B — usuário avalia flashcards do deck errado. O mesmo vale para
`FlashcardsTab`, `MateriaisTab`, `DashboardTab` (+ `DashboardEvolucao`/`DashboardTopicos`/
`DashboardAtividade`), e o quiz de um deck continua visível ao trocar para outro deck
(`QuizTab`, achado F5).

**Fix (recomendado, mesmo padrão já usado em `Layout.tsx`):** adicionar `key={deckId}` no
`<Tabs>` (ou num wrapper em volta dele) em `DeckDetalhePage.tsx` — força remontagem completa de
todas as abas ao trocar de deck, resetando estado e descartando qualquer resposta em voo de
forma implícita. Resolve F1 (parcialmente — NovaProvaPage é uma página diferente, não afetada
por este fix) e F5 por completo, e a maior parte de F6.

**Fix complementar (mais robusto, mas maior escopo):** adicionar suporte a `AbortSignal` nas
funções `GET` de `api/*.ts` (nenhuma aceita hoje) e usar `AbortController` nos componentes que
fazem polling (`MateriaisTab`) ou trocam de parâmetro sem trocar de deck (ex.: filtro de período
em `DashboardEvolucao`, que `key={deckId}` sozinho não cobre). Ver F6 para o caso específico de
`DashboardEvolucao`/`Topicos`/`Atividade` com o filtro de período, que não é resolvido por
`key={deckId}`.

---

### F1 — [🟡 Alto] NovaProvaPage: sem estado de erro/retry ao falhar `listarDecks`
**Arquivo:** `pages/NovaProvaPage.tsx:45-51, 213-230`

Só mostra um `toast.error` transitório; sem `erroCarregamento` nem botão "Tentar novamente" como
em todas as outras páginas do projeto. Se a chamada falhar, o card "1. Escolha o deck" fica com
skeleton pra sempre, sem forma de tentar de novo além de recarregar a página inteira.

**Fix:** adicionar `erroCarregamento` + bloco de erro com botão "Tentar novamente", igual ao
padrão das demais páginas (`DeckDetalhePage`, `DecksPage`, etc.).

---

### F1b — [🟡 Médio] NovaProvaPage: condição de corrida ao trocar de deck rapidamente
**Arquivo:** `pages/NovaProvaPage.tsx:57-70`

`aoEscolherDeck` chama `listarFlashcards(id)` sem verificar se o deck selecionado ainda é o
mesmo quando a resposta chega. Trocar de deck duas vezes rápido pode deixar `flashcards` de um
deck com `deckId` de outro na tela.

**Fix:** guardar a requisição mais recente (`useRef` com o id pedido) e ignorar a resposta se o
id não bater mais com o selecionado atual.

---

### F1c — [🟡 Médio] NovaProvaPage: flashcards somem silenciosamente se a busca falhar
**Arquivo:** `pages/NovaProvaPage.tsx:63-69, 239-267`

Mesma causa raiz de F1 — se `listarFlashcards` falhar, nem a mensagem "deck sem flashcards" nem
a lista aparecem, só o cabeçalho do card "2. Escolha os flashcards" fica vazio. Corrigir junto
com F1.

---

### F2 — [🟡 Médio] `SugestaoFlashcard` não tem o campo `topico` exigido por RN17 — dado é descartado
**Arquivo:** `api/materialApi.ts:15-18`, `components/RevisaoSugestoesFlashcards.tsx:52-55`

O contrato documenta `{ pergunta, resposta, topico }` na resposta de geração de flashcards via
IA; o tipo do frontend omite `topico`, e o componente de revisão desestrutura só
`{ pergunta, resposta }` — o dado nunca é lido nem reenviado, mesmo vindo do backend.

**Fix:** adicionar `topico: string` a `SugestaoFlashcard`, propagar em
`SugestaoParaConfirmar` e exibir no componente de revisão.

---

### F3 — [🟢 Médio] `estudoApi.ts`: parâmetro `incluirTodos` fora do contrato + comentário cita RN errada
**Arquivo:** `api/estudoApi.ts:20-30`, `components/EstudarTab.tsx:36,56-75,163`

`contrato-api.md` documenta `GET /api/decks/{id}/fila-estudo` sem query params; o frontend manda
`incluirTodos` (usado pelo botão "Revisar mesmo assim") que não está documentado em lugar
nenhum — se o backend não suportar, o botão parece "não fazer nada". O comentário cita RN22, que
é sobre unicidade de nomeUsuario, sem relação com fila de estudo.

**Fix:** confirmar se o backend de fato suporta `incluirTodos` e documentar em
`contrato-api.md`/`regras-de-negocio.md` (ou remover o parâmetro se não suportar); corrigir a
citação de RN nos dois comentários.

---

### F4 — [🟢 Baixo] Tipo de resposta do upload de material não bate com o contrato (sobra `criadoEm`)
**Arquivo:** `api/materialApi.ts:8-13,26-35`, `components/MaterialItem.tsx:81`

O contrato documenta a resposta do `POST` sem `criadoEm`, mas o frontend tipa como `Material`
(que exige `criadoEm`) e renderiza `new Date(material.criadoEm)` imediatamente — se o backend
realmente não devolver esse campo, aparece "Invalid Date" até o próximo poll de status.

**Fix:** criar um tipo `MaterialCriado` sem `criadoEm` para a resposta do POST; usar
`new Date()` local como fallback ao inserir o item otimisticamente na lista.

---

### F4b — [🟢 Baixo] Duplicação do tipo `{ mensagem: string }`
**Arquivo:** `api/authApi.ts:47-49` (`MensagemResponse`), `api/usuarioApi.ts:36-38`
(`MensagemResposta`)

Mesmo formato, dois nomes diferentes em arquivos diferentes. Centralizar em um tipo
compartilhado.

---

### F5 — [🟡 Alto] QuizTab: estado do quiz não reseta ao trocar de deck
**Arquivo:** `components/QuizTab.tsx`

Resolvido pelo fix F0 (`key={deckId}` em `DeckDetalhePage`). Sem isso, o quiz do deck anterior
continua visível e uma resposta pode ser registrada contra o quiz errado
(`responderTentativa(quiz.id, ...)` usando o id do deck anterior).

---

### F6 — [🟡 Médio] Race condition sistêmica ao trocar de deck/período nas abas de dashboard
**Arquivos:** `components/FlashcardsTab.tsx`, `MateriaisTab.tsx`, `EstudarTab.tsx`,
`DashboardTab.tsx`, `DashboardEvolucao.tsx`, `DashboardTopicos.tsx`, `DashboardAtividade.tsx`

Maior parte resolvida pelo fix F0. **Exceção:** `DashboardEvolucao` (e os outros dois filtrados
por período) trocam de dado ao mudar o filtro de período (7/30/90 dias) **dentro do mesmo
deck** — `key={deckId}` não cobre esse caso, porque o deck não mudou. Clicar "7 dias" e depois
"90 dias" rápido pode deixar a resposta antiga sobrescrever a nova.

**Fix:** para esse caso específico, usar `AbortController` ou uma ref de "período mais recente"
dentro do próprio `DashboardEvolucao`/`Topicos`/`Atividade`, já que remontar por período inteiro
perderia a transição suave do gráfico.

---

### F7 — [🟡 Médio] CompartilharDeckDialog reseta e refaz fetch a cada re-render do pai
**Arquivo:** `components/CompartilharDeckDialog.tsx:41-62`,
`pages/DeckDetalhePage.tsx:78-81`

`DeckDetalhePage` passa um objeto literal novo (`{ id: deckId, titulo: deck.titulo }`) a cada
render; o `useEffect` do diálogo depende da referência de `deck` inteira, não de `deck?.id`.
Trocar de aba com o diálogo aberto reseta o link exibido e refaz a busca sem necessidade.

**Fix:** trocar a dependência do `useEffect`/`useCallback` no diálogo de `deck` para `deck?.id`.

---

### F8 — [🟡 Médio] FlashcardEstudoCard: contrato de `key` documentado mas violado em uma página
**Arquivo:** `components/FlashcardEstudoCard.tsx:27-29` (comentário),
`pages/DeckCompartilhadoPage.tsx:80-88` (consumo sem `key`)

O componente exige `key={flashcardId}` do pai para não vazar estado de explicação entre
flashcards — `EstudarTab` respeita, `DeckCompartilhadoPage` (a página pública, UC29) não. Nessa
página, a explicação de um flashcard continua visível ao navegar para o próximo, com o badge de
"ancorada no material" incorreto (sensível pois RN19 exige indicar isso corretamente por
flashcard).

**Fix:** adicionar `key={deck.flashcards[indiceAtual].id}` na chamada de
`FlashcardEstudoCard` em `DeckCompartilhadoPage.tsx`.

---

### F9 — [🟢 Baixo] MateriaisTab: polling pode chamar `setState` após unmount
**Arquivo:** `components/MateriaisTab.tsx:56-71`

`clearInterval` no cleanup impede só ticks futuros, não uma chamada já em voo quando o
componente desmonta. Baixo impacto em React 18 (sem warning visível), mas é trabalho
desperdiçado.

**Fix:** flag `cancelado` (ou `AbortController`) capturada no cleanup do `useEffect`.

---

## 3. Ordem sugerida de execução

1. **B1** (arquivo órfão ao excluir deck) e **B9** (corrupção silenciosa do SM-2) — únicos dois
   que causam perda/corrupção de dado real, não só erro de UX.
2. **B6, B7** (job de lembrete falha silenciosamente / N+1 diário) e **B11** (endpoints de IA
   sem rate limit, risco de custo) — impacto operacional direto.
3. **F0** (`key={deckId}`) — um fix pequeno que resolve F5 e a maior parte de F6 de uma vez.
4. **B2, B3** (uploads que derrubam com 500 + arquivo órfão), **B17, B18** (500 em vez de erro
   tratado), **B10** (retry que não funciona pro caso real).
5. Resto dos achados médios/baixos (N+1s de performance, F1/F1b/F1c da NovaProvaPage, F2/F3/F4
   de tipos/contrato, F7/F8/F9), pela ordem que fizer mais sentido junto com o que você já
   estiver mexendo em cada área.

---

*Gerado por auditoria automatizada em 2026-09-05. Cada achado foi verificado individualmente
por um agente dedicado à sua área, mas vale sua própria checagem antes de corrigir — em caso de
dúvida sobre uma RN específica, o documento fonte é sempre `Docs/regras-de-negocio.md`.*
