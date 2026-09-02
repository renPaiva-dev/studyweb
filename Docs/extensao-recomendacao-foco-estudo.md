# Extensão de Escopo — Recomendação de Foco de Estudo (UC13/RN18)

RN18 e UC13 já estão fechados em `regras-de-negocio.md` e `casos-de-uso.md`
(reproduzidos abaixo só por conveniência de leitura — não são alterados por
este documento). O que falta, e é o objeto desta spec, é o detalhamento
técnico que RN18 deixa em aberto — igual ao que `DashboardService` já fez
para o critério de "em risco" da RN14 (ver `estaEmRisco`, cujo javadoc
começa com "RN14 não define o cálculo exato") — e o plano de implementação.
Reaproveita 100% da infraestrutura de IA já existente (`GeminiClient`) e a
projeção de tópicos já existente no dashboard — sem tabela nova, sem
persistência, sem dependência nova.

## 0. RN18 e UC13 (referência, já existentes)

> **RN18** — A recomendação de foco de estudo é gerada sob demanda (não
> persistida). O sistema identifica o(s) tópico(s) com maior concentração de
> flashcards "em risco" (critério de RN14) e, havendo dados suficientes,
> gera uma sugestão textual curta via IA. Sem dados suficientes, retorna
> mensagem padrão sem chamar a IA.

> **UC13 — Obter recomendação de foco de estudo**
> Ator: Estudante · Pré-condições: deck existente, pertencente ao usuário
> autenticado · Pós-condições: recomendação retornada (não persistida).
> Fluxo: aplica RN01 → agrega flashcards em risco por tópico → se houver
> tópico(s) com concentração significativa, monta prompt com os dados
> agregados e chama a IA → retorna recomendação + tópico de foco.
> A1 (sem dados suficientes) → mensagem padrão, sem chamar a IA.
> E1 (falha na IA) → mensagem de erro amigável (502).

Contrato já existente (`contrato-api.md`, sem alteração):

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/decks/{id}/recomendacao-estudo` | — | `200` — `{ recomendacao, topicoFoco, baseadoEmDados }` | `401` · `403` (RN01) · `404` · `502` (falha na IA) |

`baseadoEmDados: false` ⇒ `topicoFoco: null` e `recomendacao` é a mensagem
padrão (sem chamar a IA).

## 1. Decisões técnicas (RN18 não define — precisam ser fixadas em código, como RN14 já fez para "em risco")

RN18 usa dois termos que não têm cálculo explícito em nenhum RN: **"maior
concentração"** e **"dados suficientes"**. Decisão adotada, a documentar no
javadoc do service (mesmo padrão do `DashboardService`):

- **Concentração de um tópico** = contagem **absoluta** de flashcards em
  risco naquele tópico (mesmo critério de `estaEmRisco`/RN14), não o
  percentual. Motivo: um tópico com 1 flashcard 100% em risco é menos
  prioritário para o estudo do que um tópico com 8 flashcards em risco de
  um total de 20 — a ação recomendada ("foque neste tópico") tem mais
  impacto quanto mais cartões frágeis existirem ali, independente do
  tamanho do tópico.
- **Tópico vencedor** = maior contagem absoluta; empate é resolvido pelo
  maior percentual em risco do tópico; empate residual, pela ordem
  alfabética do nome do tópico (só para determinismo/teste — não é um
  requisito de negócio).
- **"Sem categoria"** (grupo de flashcards com `topico = null`, mesmo rótulo
  do dashboard) **nunca é elegível** como tópico de foco — recomendar
  "estude mais 'Sem categoria'" não é uma ação útil para o estudante. Ele é
  excluído do agrupamento antes de escolher o vencedor.
- **Dados suficientes** = o tópico vencedor (excluindo "Sem categoria") tem
  pelo menos `LIMIAR_MINIMO_FLASHCARDS_EM_RISCO` flashcards em risco.
  Valor adotado: **3** (mesmo espírito do "ex.: 15" da RN08 — um número de
  exemplo, ajustável, não uma constante de negócio fechada). Abaixo disso
  (ou se não houver nenhum tópico elegível): `baseadoEmDados: false`,
  mensagem padrão, **sem chamar a IA** (RN18, RNF07 — custo de cota).

## 2. Reuso de infraestrutura — e um pequeno refactor necessário

`DashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(deckId)` já
traz exatamente o necessário: tópico + última revisão de cada flashcard do
deck, numa única query, sem N+1 (usada hoje por
`DashboardService.obterDetalhamentoPorTopico`, UC15/RN20). Este novo service
deve **reaproveitar essa mesma query** — não criar uma nova.

O único obstáculo é que o critério de "em risco" (RN14) está implementado
como método **privado** de `DashboardService`
(`estaEmRisco(Integer, LocalDate)`), e `boas-praticas-backend.md` §3 exige
um ponto único por regra de negócio — duplicar esse `if` num novo service
violaria isso na primeira alteração futura do critério.

**Refactor mínimo, antes do novo código:** extrair `estaDominado` e
`estaEmRisco` de `DashboardService` para métodos `public static` numa nova
classe `com.tcc.plataformaestudos.dashboard.CriterioDesempenhoFlashcard`
(mesmos parâmetros, mesmo corpo, mesmo javadoc — são funções puras, não
usam `this`). `DashboardService` passa a chamar
`CriterioDesempenhoFlashcard.estaEmRisco(...)` / `.estaDominado(...)` nos
mesmos 5 pontos onde já chama hoje. Comportamento idêntico — os testes
existentes de `DashboardServiceTest` continuam passando sem alteração.
`RecomendacaoEstudoService` (novo, pacote `ia`) injeta `DashboardRepository`
diretamente (é uma interface `Repository` pública, sem motivo para não
reaproveitar) e chama `CriterioDesempenhoFlashcard.estaEmRisco(...)`.

## 3. Nota técnica sobre `GeminiClient` (dívida pré-existente, não introduzida por esta spec)

`GeminiClient.gerarConteudo(...)` lança `GeracaoFlashcardsException`
diretamente em qualquer falha de infraestrutura (status HTTP ≠ 200, erro de
I/O, resposta sem texto) — está *hardcoded* para essa exceção específica,
mesmo sendo reaproveitado por `ProvaGenerationService` (que só embrulha em
`GeracaoProvaException` o erro de **parse do JSON**, não o de infra — ou
seja, hoje uma falha de rede na geração de prova já escapa como
`GeracaoFlashcardsException`, um bug pequeno e pré-existente, fora do
escopo desta spec). O novo `RecomendacaoEstudoService` **vai herdar o mesmo
comportamento**: uma falha de infraestrutura do Gemini chega como
`GeracaoFlashcardsException`, não como a exceção nova deste service. Como
ambas mapeiam para 502 via `NegocioException`, o comportamento observável
no contrato de API (502) continua correto — é só a mensagem/log que fica
menos precisa. Documentar essa limitação no código (comentário), não tentar
consertar o `GeminiClient` dentro desta tarefa (mudaria comportamento de
duas features já prontas e testadas sem necessidade).

## 4. Modelo de dados

Nenhuma tabela ou coluna nova — RN18 é explícita: recomendação é gerada sob
demanda, não persistida.

## 5. Novas classes (pacote `com.tcc.plataformaestudos.ia`, ao lado de `FlashcardGenerationService`/`ProvaGenerationService`)

- **`RecomendacaoEstudoResponseDTO`** — `record(String recomendacao, String topicoFoco, boolean baseadoEmDados)`.
- **`GeracaoRecomendacaoException`** — igual a `GeracaoProvaException` (estende `NegocioException`, `HttpStatus.BAD_GATEWAY`), lançada só na etapa de interpretar a resposta da IA (ver nota técnica acima).
- **`RecomendacaoEstudoService`**:
  - `RecomendacaoEstudoResponseDTO gerarRecomendacao(Long deckId)`
  - Aplica RN01 via `deckService.buscarDeckDoUsuarioAutenticado(deckId)`.
  - Busca `dashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(deckId)`.
  - Agrupa por tópico (excluindo `topico == null`), conta em-risco por
    grupo via `CriterioDesempenhoFlashcard.estaEmRisco`.
  - Escolhe o vencedor pelos critérios da seção 1. Se não houver vencedor
    elegível (nenhum tópico real, ou o máximo é `< LIMIAR_MINIMO_FLASHCARDS_EM_RISCO`):
    retorna `new RecomendacaoEstudoResponseDTO(MENSAGEM_PADRAO, null, false)`
    **sem** chamar `geminiClient`.
  - Caso contrário, monta o prompt (seção 6) com o tópico vencedor e as
    perguntas (não as respostas) dos flashcards em risco daquele tópico, e
    chama `geminiClient.gerarConteudo(prompt)` com o mesmo padrão de retry
    (`MAXIMO_TENTATIVAS = 2`) de `FlashcardGenerationService`/
    `ProvaGenerationService`.
  - Log da chamada (RN16, mesmo padrão): início, tentativa, sucesso/falha,
    e se `baseadoEmDados` foi `true` ou `false` (isso não é dado sensível).
  - Retorna `new RecomendacaoEstudoResponseDTO(textoDaIA, topicoVencedor, true)`.
- **`RecomendacaoEstudoController`** (ou método no controller de dashboard
  do deck, se preferir agrupar por recurso `/api/decks/{id}/...` — mas o
  padrão do projeto até aqui é um controller fino por feature de IA, ver
  `GeracaoFlashcardsController`; manter consistência):
  ```java
  @PostMapping("/api/decks/{id}/recomendacao-estudo")
  public ResponseEntity<RecomendacaoEstudoResponseDTO> recomendar(@PathVariable("id") Long id) {
      return ResponseEntity.ok(recomendacaoEstudoService.gerarRecomendacao(id));
  }
  ```

## 6. Design do prompt

```
Você é um assistente de estudos. Um estudante está com dificuldade no
tópico "%s": %d de %d flashcards desse tópico estão marcados como "em
risco" (respostas recentes fracas ou revisão muito atrasada).

Perguntas dos flashcards em risco desse tópico:
%s

Em até 2 frases, escreva uma recomendação curta, direta e motivadora de
como o estudante deve focar seus próximos estudos nesse tópico. Não
repita as perguntas, não dê a resposta de nenhuma delas. Responda em
texto simples, sem markdown, sem aspas ao redor de toda a resposta.
```

Diferente de `FlashcardGenerationService`/`ProvaGenerationService`, a
resposta da IA aqui **não é JSON** — é texto livre curto (mesmo padrão de
`ExplicacaoService`, se/quando UC14 for implementado: usar
`GeminiClient.gerarConteudo` e devolver o texto bruto, sem
`objectMapper.readValue`). Ainda assim, validar que a resposta não veio
vazia/em branco antes de devolver (`GeracaoRecomendacaoException` se vier
vazia, mesmo padrão de "sugestão vazia" das outras duas).

Perguntas limitadas a, no máximo, 10 no prompt (evita prompt gigante em
tópicos com muitos flashcards em risco — trunca, não precisa mencionar o
truncamento na resposta).

## 7. Testes unitários (`RecomendacaoEstudoServiceTest`, mock de `DashboardRepository`/`GeminiClient`/`DeckService`)

- Tópico com ≥ `LIMIAR_MINIMO_FLASHCARDS_EM_RISCO` flashcards em risco →
  chama a IA, retorna `baseadoEmDados=true` e o `topicoFoco` correto.
- Nenhum flashcard em risco, ou todos abaixo do limiar → `baseadoEmDados=false`,
  mensagem padrão, `verifyNoInteractions(geminiClient)`.
- Todos os flashcards em risco estão em "Sem categoria" (`topico=null`) →
  tratado como dados insuficientes (não vira tópico de foco).
- Dois tópicos empatados em contagem absoluta → desempate pelo percentual,
  depois pelo nome (determinismo do teste).
- RN01: deck de outro usuário → `AcessoNegadoException`/403 (via
  `deckService.buscarDeckDoUsuarioAutenticado`, mock lançando a exceção —
  mesmo padrão dos demais services).
- Falha da IA (`GeracaoRecomendacaoException` ou o `GeracaoFlashcardsException`
  vindo do mock de `geminiClient`, ver seção 3) → propaga como 502.
- Resposta da IA vazia/em branco → `GeracaoRecomendacaoException`.
- **RN08/RN05 não se aplicam aqui** (não é geração de flashcards) — não
  precisa de teste de regressão cruzado, mas o teste de "sem dados
  suficientes" já cobre o equivalente para RN18 (mensagem padrão, sem IA).

## 8. Prompt de implementação (para uma futura sessão)

```
Leia Docs/regras-de-negocio.md (RN18), Docs/casos-de-uso.md (UC13),
Docs/contrato-api.md (seção "Recomendação de Foco de Estudo") e
Docs/extensao-recomendacao-foco-estudo.md (spec completa) antes de
continuar. Não altere nenhum comportamento existente — os testes de
DashboardServiceTest, FlashcardGenerationServiceTest e
ProvaGenerationServiceTest (se existir) devem continuar passando sem
alteração de asserção.

1. Extraia `estaDominado`/`estaEmRisco` de DashboardService para uma nova
   classe pública com métodos static, com o nome
   com.tcc.plataformaestudos.dashboard.CriterioDesempenhoFlashcard
   (mesmo corpo e javadoc de hoje). Atualize DashboardService para chamar
   os métodos static nos 5 pontos onde hoje chama os privados. Rode
   DashboardServiceTest para confirmar que nada mudou.

2. Crie, no pacote com.tcc.plataformaestudos.ia:
   - RecomendacaoEstudoResponseDTO (record)
   - GeracaoRecomendacaoException (igual a GeracaoProvaException, 502)
   - RecomendacaoEstudoService, conforme seção 5 desta spec — reaproveite
     DashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard e
     CriterioDesempenhoFlashcard.estaEmRisco. RN01 via
     DeckService.buscarDeckDoUsuarioAutenticado. Constante
     LIMIAR_MINIMO_FLASHCARDS_EM_RISCO = 3 (nomeada, comentário
     explicando que é um valor de exemplo, RN18/RN08-style).

3. Crie RecomendacaoEstudoController com
   POST /api/decks/{id}/recomendacao-estudo, retornando
   RecomendacaoEstudoResponseDTO (200), seguindo exatamente
   Docs/contrato-api.md.

4. Log da chamada à IA (RN16), mesmo padrão de FlashcardGenerationService.

5. Testes unitários conforme seção 7 desta spec. Mock de
   DashboardRepository, GeminiClient e DeckService — sem chamar IA nem
   banco reais.

Siga Docs/boas-praticas-backend.md em tudo. Não implemente frontend nesta
tarefa (fica para um prompt seguinte).
```

## 9. Teste manual

1. Deck com um tópico tendo ≥3 flashcards em risco (respostas recentes com
   qualidade < 3, ou `proximaRevisao` vencida há mais de 7 dias) → `POST
   /api/decks/{id}/recomendacao-estudo` → `baseadoEmDados: true`,
   `topicoFoco` é o tópico esperado, `recomendacao` é um texto curto
   coerente (não JSON, não vazio).
2. Deck sem nenhum flashcard em risco (ou recém-criado) → mesma chamada →
   `baseadoEmDados: false`, `topicoFoco: null`, mensagem padrão, e
   confirmar nos logs que a API do Gemini **não** foi chamada.
3. RN01: usuário B chama no deck do usuário A → 403.

## 10. Como isso reforça a narrativa do TCC

Mesmo argumento de defesa de UC14/UC27: a IA não é usada como "oráculo
genérico" a cada clique — só é acionada quando há sinal real e suficiente
nos dados do próprio estudante (RN18, RNF07), e a resposta é sempre
ancorada nesse sinal (contagem real de flashcards em risco por tópico, não
um prompt vazio pedindo "me dê uma dica de estudo"). Reforça também o
princípio de RN01 (sempre escopado ao usuário) e o de reuso de
infraestrutura já validada (mesma query do dashboard, mesmo cliente HTTP do
Gemini) em vez de duplicar código para uma funcionalidade nova — coerente
com a arquitetura em camadas já defendida nas demais seções do TCC.
