# Auditoria de Coerência e Vazamento de Informação — StudyWeb (2026-09-21)

Auditoria feita a partir de `Docs/spec-auditoria-sistema.md`, cobrindo as 8 categorias da spec
(vazamento de informação/enumeration, coerência frontend↔backend, terminologia, estados
vazios/erro, controle de acesso, segredos/config, documentação desatualizada, copy técnico
demais). Rodada em 5 revisões independentes por módulo — `usuario`; `deck`/`material`/`colecao`;
`flashcard`/`revisao`/`prontidao`; `quiz`/`ia`; `dashboard`/`compartilhamento`/`config` + frontend
geral/landing/README — cruzando backend (`src/main/java/com/tcc/plataformaestudos/`), frontend
(`frontend/src/`) e a documentação em `Docs/`.

**Legenda de severidade:** 🔴 Crítico (vaza segurança: enumeration, controle de acesso quebrado) ·
🟡 Importante (confunde o usuário ou perde oportunidade de comunicar valor) · 🟢 Nice-to-have
(cosmético/terminológico).

---

## Resumo executivo

| Módulo | Crítico | Importante | Nice-to-have |
|---|---|---|---|
| usuario (auth/conta) | 1 | 2 | 3 |
| deck / material / colecao | 2 | 2 | 1 |
| flashcard / revisao / prontidao | 1 | 2 | 2 |
| quiz / ia | – | 2 | 4 |
| dashboard / compartilhamento / config / frontend geral | – | 1 | 1 |
| **Total** | **4** | **9** | **11** |

**Achado estrutural mais importante:** o sistema tinha um padrão de segurança anti-enumeração
(RN01/B15 — "sempre 404, nunca 403 quando o recurso existe mas não é do usuário") aplicado
corretamente em `deck` e `colecao`, mas **deliberadamente não estendido** a `material`,
`flashcard` e `quiz`/`tentativa` — o próprio `Docs/contrato-api.md:5` documentava essa exceção.
Três agentes independentes, sem saber uns dos outros, encontraram o mesmo padrão de oráculo de
enumeração em módulos diferentes (achados C1, C3, N7 abaixo).

> **Atualização (2026-09-21):** todos os 24 achados desta auditoria foram endereçados — os 4
> críticos (C1-C4, incluindo N7), os 9 importantes (I1-I9) e os 10 nice-to-have restantes
> (N2-N11). N1 não precisou de mudança de código (o próprio achado já dizia ser opcional/
> informativo, sem ação necessária). Ver "Status: RESOLVIDO" em cada achado abaixo para o que foi
> feito especificamente.

---

## 🔴 Críticos

### C1 — Enumeration oracle: `material` distingue 403 de 404, ao contrário do padrão já aplicado em `deck`/`colecao`
**Categoria 5 — Permissões e controle de acesso**
**Local:** [MaterialOrigemService.java:209-219](src/main/java/com/tcc/plataformaestudos/material/MaterialOrigemService.java#L209-L219) (`buscarMaterialDoUsuarioAutenticado`) + [AcessoNegadoException.java](src/main/java/com/tcc/plataformaestudos/config/AcessoNegadoException.java) + [apiError.ts:10-16](frontend/src/api/apiError.ts#L10-L16) + [MaterialItem.tsx:51-56,66-71](frontend/src/components/MaterialItem.tsx#L51-L56)

`DeckService.buscarDeckDoUsuarioAutenticado` e `ColecaoService.buscarColecaoDoUsuarioAutenticado`
têm comentários explícitos (achado B15 da auditoria anterior) dizendo "sempre 404, nunca 403" para
não permitir enumerar IDs de recursos de outros usuários. `MaterialOrigemService` faz o oposto:
quando o material existe mas pertence a outro usuário, lança `AcessoNegadoException` → HTTP 403
("Você não tem permissão para acessar este material"); só quando o material realmente não existe
retorna 404. O frontend repassa essa mensagem crua via toast — um usuário autenticado testando IDs
de outra pessoa vê a confirmação de que aquele ID existe.

**Por que importa:** é exatamente o exemplo citado na spec de auditoria ("você não tem permissão
para acessar o pedido #4521" confirma existência). Permite enumerar por força bruta quais IDs de
material existem, e contradiz uma decisão de segurança já tomada e documentada nos módulos irmãos
deste mesmo sistema.

**Sugestão:** aplicar o mesmo padrão de `buscarDeckDoUsuarioAutenticado` em
`MaterialOrigemService`: sempre lançar `RecursoNaoEncontradoException` (404), removendo a
distinção 403 vs 404.

**Status: RESOLVIDO.** `buscarMaterialDoUsuarioAutenticado` agora sempre lança
`RecursoNaoEncontradoException` (404), sem checar `existsById`/`AcessoNegadoException` — mesmo
padrão de `DeckService.buscarDeckDoUsuarioAutenticado` (B15).

---

### C2 — `Docs/contrato-api.md` institucionaliza a mesma inconsistência 403/404
**Categoria 3/5 — Terminologia/controle de acesso**
**Local:** [contrato-api.md:5, 42-43, 176](Docs/contrato-api.md#L5)

O contrato declara explicitamente que rotas escopadas por `deckId` respondem sempre 404 (anti-
enumeração, cita B15), "exceto" as rotas de material/flashcard/quiz/tentativa, que "continuam
distinguindo 403/404 normalmente". As linhas 42-43 e 176 documentam 403 como resposta válida para
`GET`/`DELETE /api/materiais/{id}`.

**Por que importa:** confirma que C1 e C3 não são descuidos isolados — é uma decisão de design
aplicada de forma seletiva por tipo de recurso, sem justificativa técnica aparente, e que se
estende também a `quiz`/`tentativa` (ver N7).

**Sugestão:** revisar a decisão documentada em `contrato-api.md:5` — estender o padrão 404-sempre
(B15) para todos os recursos aninhados por dono (material, flashcard, quiz, tentativa), e
atualizar o contrato de acordo.

**Status: RESOLVIDO parcialmente.** `contrato-api.md` atualizado: a regra geral (linha 5) e as
rotas de `material` e `flashcard` (incluindo `gerar-flashcards` e `explicacao`, que reusam as
mesmas buscas) agora documentam só `404`, refletindo C1/C3. `quiz`/`tentativa` (N7) seguem
documentados com `403`/`404` — permanecem como exceção em aberto, citada explicitamente na regra
geral.

---

### C3 — Enumeration oracle: `flashcard` também distingue 403 de 404
**Categoria 5 — Permissões e controle de acesso**
**Local:** [FlashcardService.java:119-129](src/main/java/com/tcc/plataformaestudos/flashcard/FlashcardService.java#L119-L129) + [RevisaoService.java:69](src/main/java/com/tcc/plataformaestudos/revisao/RevisaoService.java#L69) + [apiError.ts:1-15](frontend/src/api/apiError.ts#L1-L15)

Mesmo padrão de C1: `buscarFlashcardDoUsuarioAutenticado` lança 403 ("Você não tem permissão para
acessar este flashcard") quando o flashcard existe mas é de outro usuário, usado também por
`RevisaoService.avaliarResposta` e pelos endpoints `PUT`/`DELETE /api/flashcards/{id}`. RN01
("Docs/regras-de-negocio.md:52") diz que um usuário só pode acessar seus próprios flashcards — a
mesma regra que já vale para decks, mas não é aplicada da mesma forma aqui.

**Por que importa:** oráculo de enumeração real, ativamente evitado no resto do código (decks,
coleções, tokens de compartilhamento via RN37) — a exceção em flashcards não tem justificativa de
produto aparente.

**Sugestão:** alinhar `buscarFlashcardDoUsuarioAutenticado` ao padrão de `DeckService` — sempre
404, removendo a checagem `existsById` + `AcessoNegadoException`.

**Status: RESOLVIDO.** `buscarFlashcardDoUsuarioAutenticado` agora sempre lança
`RecursoNaoEncontradoException` (404) — mesmo padrão de C1. `RevisaoService.avaliarResposta`
reusa esse método, então a correção se propaga automaticamente para o fluxo de revisão.

---

### C4 — Timing oracle assimétrico em login, esqueci-senha e reenvio de verificação
**Categoria 1 — Vazamento de informação sensível**
**Local:** [UsuarioService.java:166-178](src/main/java/com/tcc/plataformaestudos/usuario/UsuarioService.java#L166-L178) (`autenticar`) + [PasswordResetService.java:47-70](src/main/java/com/tcc/plataformaestudos/usuario/PasswordResetService.java#L47-L70) (`solicitarRedefinicao`) + [VerificacaoEmailService.java:75-81](src/main/java/com/tcc/plataformaestudos/usuario/VerificacaoEmailService.java#L75-L81) (`reenviarVerificacao`)

Nos três fluxos, "e-mail não existe" faz early-return imediato; "e-mail existe" faz trabalho
significativamente mais pesado antes de responder — BCrypt (`passwordEncoder.matches`, ~100ms+) só
roda quando o usuário é encontrado; geração de UUID + gravação de token + envio de e-mail só
acontece quando o e-mail existe (e, no reenvio, só quando ainda não verificado). Três variações de
tempo de resposta para a mesma mensagem HTTP genérica.

**Por que importa:** as mensagens desses três endpoints foram deliberadamente escritas para não
confirmar existência de conta (RN24, RN26). A diferença de tempo de resposta reabre exatamente o
canal que essas mensagens genéricas foram desenhadas para fechar — um atacante com algumas
amostras consegue distinguir estatisticamente e-mails cadastrados de não cadastrados, incluindo no
fluxo de recuperação de senha.

**Sugestão:** igualar o custo dos dois caminhos — computar um hash BCrypt "dummy" quando o usuário
não é encontrado em `autenticar`; sempre gerar UUID e simular o envio de e-mail (para destinatário
descartado) em `solicitarRedefinicao`/`reenviarVerificacao`, mantendo volume de trabalho constante.

**Status: RESOLVIDO.** `UsuarioService` agora compara sempre contra um hash BCrypt (real, de uma
senha aleatória descartada, gerado uma vez na inicialização) mesmo quando o e-mail não existe.
`PasswordResetService.solicitarRedefinicao` e `VerificacaoEmailService.reenviarVerificacao` agora
sempre chamam `emailService.enviarEmail` — para o destinatário real quando há algo genuíno a
enviar, ou para um endereço descartado interno (`timing-dummy@plataformaestudos.local`, nunca o
e-mail informado pelo cliente) nos demais casos — equalizando o custo de rede, que é o componente
dominante do tempo de resposta. A gravação do token no banco continua condicional (não dá para
inserir uma linha de `token_redefinicao_senha`/`token_verificacao_email` sem um `usuario_id` válido
— FK `NOT NULL`), então uma pequena assimetria de uma única escrita no banco permanece; é um custo
bem menor que o round-trip de rede do envio de e-mail que dominava o timing original.

---

## 🟡 Importantes

### I1 — Cadastro confirma existência de e-mail ("E-mail já cadastrado: {email}")
**Categoria 1 — Vazamento de informação sensível**
**Local:** [EmailJaCadastradoException.java:10](src/main/java/com/tcc/plataformaestudos/usuario/EmailJaCadastradoException.java#L10) + [UsuarioService.java:47-49](src/main/java/com/tcc/plataformaestudos/usuario/UsuarioService.java#L47-L49) + [CadastroPage.tsx:88-89](frontend/src/pages/CadastroPage.tsx#L88-L89)

`POST /api/auth/cadastro` responde 409 com a mensagem literal "E-mail já cadastrado: <email>"
quando já existe conta (documentado como intencional em `contrato-api.md:24,146`). É um oráculo de
enumeração clássico no cadastro, destoando da filosofia aplicada com cuidado no resto do mesmo
módulo (RN24, RN26).

**Sugestão:** se for mantido, documentar como risco aceito consciente em `Docs/seguranca.md`
(mesmo estilo de outras decisões já registradas). Para fechar o gap, adotar o padrão de RN24:
responder sempre genérico e notificar o dono real do e-mail por e-mail.

**Status: RESOLVIDO.** Gap fechado (não apenas documentado): `POST /api/auth/cadastro` sempre
responde `201`, mesmo quando o e-mail já existe — nesse caso nada é persistido, `EmailJaCadastradoException`
foi removida (ficou sem uso) e o dono real da conta recebe um e-mail avisando da tentativa,
reaproveitando a mesma resposta sintética já usada pelo honeypot. `nomeUsuario` continua gerando
`409` normalmente — é identificador público (RN22), não um dado sensível.

### I2 — Expiração automática de conta não verificada nunca é comunicada
**Categoria 2 — Coerência frontend↔backend**
**Local:** [LimpezaContasNaoVerificadasService.java:14-46](src/main/java/com/tcc/plataformaestudos/usuario/LimpezaContasNaoVerificadasService.java#L14-L46) + [CadastroPage.tsx:86](frontend/src/pages/CadastroPage.tsx#L86) + `VerificarEmailPage.tsx`

RN26 apaga permanentemente uma conta cujo e-mail nunca foi confirmado assim que os tokens de
verificação expiram — nem o toast de sucesso do cadastro, nem a tela de verificação, nem o e-mail
transacional mencionam essa consequência (só "válido por 10 minutos").

**Sugestão:** avisar no toast de sucesso do cadastro e/ou na tela de verificação: "confirme em até
10 minutos — se não confirmar, sua conta expira e você pode se cadastrar novamente".

**Status: RESOLVIDO.** Aviso adicionado ao toast de sucesso do cadastro (`CadastroPage.tsx`) e ao
`CardDescription` do estado inicial de `VerificarEmailPage.tsx`.

### I3 — `contrato-api.md` descreve processamento assíncrono de PDF que não existe mais no código
**Categoria 7 — Documentação desatualizada**
**Local:** [contrato-api.md:41](Docs/contrato-api.md#L41) + [MaterialOrigemService.java:71-90](src/main/java/com/tcc/plataformaestudos/material/MaterialOrigemService.java#L71-L90) + [MateriaisTab.tsx:87-111](frontend/src/components/MateriaisTab.tsx#L87-L111)

O contrato documenta `POST /api/decks/{id}/materiais` respondendo com `statusProcessamento:
"PENDENTE"`, mas o service já processa a extração de texto de forma síncrona antes de responder —
a resposta real nunca traz `PENDENTE`. O próprio comentário em `MateriaisTab.tsx:87-90` já admite
a divergência e programa em torno dela (polling desnecessário).

**Sugestão:** atualizar o contrato para refletir que a extração é síncrona e a resposta já vem com
o status final.

**Status: RESOLVIDO.** `contrato-api.md` atualizado (linha 41) para refletir a extração síncrona.

### I4 — Status "Erro" no material não explica a causa nem dá próximo passo
**Categoria 4 — Estados vazios/erro/borda**
**Local:** [MaterialOrigemService.java:175-185](src/main/java/com/tcc/plataformaestudos/material/MaterialOrigemService.java#L175-L185) + `MaterialOrigemResponseDTO.java` + `MaterialStatusBadge.tsx` + `MaterialItem.tsx:73-131`

Quando a extração de texto falha (RN07 — PDF escaneado, corrompido, protegido), o backend só grava
`ERRO`, sem motivo. O frontend mostra só um badge "Erro" sem tooltip nem CTA.

**Sugestão:** persistir um motivo curto e amigável junto do status `ERRO` e exibi-lo no card/badge,
com sugestão de ação.

**Status: RESOLVIDO.** Novo campo `motivo_erro` (migration `V12__adicionar_motivo_erro_material.sql`)
persistido em `processarExtracaoTexto` com uma mensagem amigável fixa (não o detalhe técnico de
`ExtracaoTextoException`, que continua só no log), exposto em `MaterialOrigemResponseDTO.motivoErro`
e exibido em `MaterialItem.tsx` (texto abaixo do card) e como `title` do badge em
`MaterialStatusBadge.tsx`.

### I5 — Resultado do recálculo SM-2 é devolvido pelo backend mas descartado pelo frontend
**Categoria 2 — Coerência frontend↔backend**
**Local:** [estudoApi.ts:13-18,32-38](frontend/src/api/estudoApi.ts#L13-L18) + [EstudarTab.tsx:85-95](frontend/src/components/EstudarTab.tsx#L85-L95)

`POST /api/flashcards/{id}/revisoes` devolve `fatorFacilidade`, `intervaloDias`, `repeticoes`,
`proximaRevisao` — dados que tornariam tangível o diferencial "repetição espaçada de verdade"
anunciado na landing page. O frontend chama a função com `await` mas descarta o retorno; nenhuma
tela mostra a próxima data de revisão após avaliar um card.

**Sugestão:** capturar o retorno e mostrar algo como "Você vai rever este card em {intervaloDias}
dia(s)" no feedback que já existe após a avaliação.

**Status: RESOLVIDO.** `EstudarTab.tsx` captura o retorno de `avaliarRevisao` e mostra "Você vai
rever este card em X dia(s)" no feedback que já aparecia após a avaliação, sem expor termos
técnicos (SM-2, fator de facilidade).

### I6 — Cor do índice de prontidão geral não reflete o valor (sempre verde, mesmo em 0%)
**Categoria 4 — Estados vazios/erro/borda**
**Local:** [ProntidaoProvaCard.tsx:153](frontend/src/components/ProntidaoProvaCard.tsx#L153)

O app tem uma paleta de desempenho consistente (verde para bom, vermelho para risco), usada em
`DashboardTab.tsx` e `AvaliacaoRevisaoBotoes.tsx`. No card de Prontidão para Prova, o número geral
é sempre renderizado em `text-verde-lousa`, independente do valor — mesmo em 0%.

**Por que importa:** um estudante com prontidão real baixa vê o número na mesma cor que o resto do
produto usa para "está tudo bem" — justamente na tela cujo propósito é alertar sobre risco.

**Sugestão:** aplicar a mesma escala de cor por limiar (ex. o mesmo 75% usado no backend) ao número
de `prontidaoGeral`.

**Status: RESOLVIDO.** Nova função `corProntidaoGeral` em `ProntidaoProvaCard.tsx`, reaproveitando
os mesmos limiares/cores de `classificarPontuacao.ts` (verde-lousa ≥70, neutro 40-69,
vermelho-correção <40) em vez de uma escala nova.

### I7 — Política de Privacidade contradiz o recurso de compartilhamento público de deck
**Categoria 7 — Documentação desatualizada**
**Local:** [PoliticaDePrivacidadePage.tsx:34-36](frontend/src/pages/PoliticaDePrivacidadePage.tsx#L34-L36) + [DeckPublicoController.java:16-28](src/main/java/com/tcc/plataformaestudos/compartilhamento/DeckPublicoController.java#L16-L28) + [SecurityConfig.java:113-114](src/main/java/com/tcc/plataformaestudos/config/SecurityConfig.java#L113-L114) (`permitAll` em `GET /api/compartilhamentos/**`)

A Política de Privacidade afirma sem ressalva: "Seus dados são visíveis apenas para você — nenhum
outro usuário tem acesso ao seu conteúdo". Isso é falso assim que o usuário ativa o compartilhamento
de deck (funcionalidade vendida na landing page): o deck fica acessível via link público, sem
login, a qualquer pessoa.

**Sugestão:** adicionar ressalva no item de isolamento entre usuários mencionando o compartilhamento
opt-in e revogável.

**Status: RESOLVIDO.** Item 2 da Política de Privacidade atualizado com a ressalva sugerida.

### I8 — Mensagem de erro da IA repassada crua ao usuário ("Serviço de IA retornou status X")
**Categoria 8 — Copy técnico demais**
**Local:** [GeminiClient.java:59-62](src/main/java/com/tcc/plataformaestudos/ia/GeminiClient.java#L59-L62) + [TratamentoErrosGlobal.java:24-26](src/main/java/com/tcc/plataformaestudos/config/TratamentoErrosGlobal.java#L24-L26) + [apiError.ts:10-16](frontend/src/api/apiError.ts#L10-L16) + vários componentes (`MaterialItem.tsx:52`, `RevisaoSugestoesFlashcards.tsx:64`, `PerguntarTab.tsx:50-52`, etc.)

Quando a chamada ao Gemini falha (429, 403, 500), a mensagem "Serviço de IA retornou status X" é
exibida crua ao estudante via toast — jargão técnico e um mini-vazamento de arquitetura (confirma
dependência de um "serviço de IA" terceirizado e seu status code).

**Sugestão:** usar mensagem interna só no log; lançar exceção com mensagem amigável fixa por
categoria de falha, preservando o detalhe técnico apenas como causa/log.

**Status: RESOLVIDO.** `GeminiClient` agora lança `GeracaoConteudoIAException` sempre com a mesma
mensagem amigável fixa (`MENSAGEM_FALHA_IA`) para qualquer falha de infraestrutura (status HTTP,
E/S, interrupção, JSON malformado, resposta sem texto); o detalhe técnico continua só no `log.error`
já existente, nunca no campo `message` devolvido ao cliente.

### I9 — `Docs/integracao-ia.md` desatualizado: falta o 5º serviço que usa o retry unificado
**Categoria 7 — Documentação desatualizada**
**Local:** [integracao-ia.md:21](Docs/integracao-ia.md#L21) vs [PerguntaMaterialService.java:68-92](src/main/java/com/tcc/plataformaestudos/ia/PerguntaMaterialService.java#L68-L92)

O doc afirma que só quatro services compartilham o retry unificado (B10); `PerguntaMaterialService`
(implementado para UC32) replica o mesmo padrão mas nunca foi adicionado à lista.

**Sugestão:** atualizar a lista para incluir `PerguntaMaterialService` e `GeracaoRespostaMaterialException`.

**Status: RESOLVIDO.** `integracao-ia.md` atualizado (lista de services e de exceções).

---

## 🟢 Nice-to-have

- **N1 — Cat. 2** Validação de assinatura real do PDF (`%PDF-`) não é comunicada como
  diferencial/proteção. [MaterialOrigemService.java:143-159](src/main/java/com/tcc/plataformaestudos/material/MaterialOrigemService.java#L143-L159)
  **Status: sem ação necessária** — o próprio achado já classificava isso como opcional/copy de
  marketing, não um bug; nenhuma mudança de código foi feita.
- **N2 — Cat. 7** Comentário em `RevisaoService.java:47` cita "RN22" para a feature "Revisar mesmo
  assim", mas RN22 real é sobre unicidade de `nomeUsuario` — referência errada.
  **Status: RESOLVIDO** — comentário corrigido, sem citar RN22.
- **N3 — Cat. 3** Campo `nomeUsuario` em `LembreteRevisaoDTO.java:12` carrega na prática o "nome"
  de exibição, não o `nomeUsuario` (conceito reservado por RN22).
  **Status: RESOLVIDO** — campo renomeado para `nome`.
- **N4 — Cat. 2** Retry automático da IA (2 tentativas) nunca é comunicado ao usuário em nenhum dos
  5 fluxos de geração (`FlashcardGenerationService`, `ProvaGenerationService`, `ExplicacaoService`,
  `RecomendacaoEstudoService`, `PerguntaMaterialService`) — spinner estático sem indicar nova
  tentativa.
  **Status: RESOLVIDO** (com uma ressalva) — mesmo padrão de `MaterialItem.tsx` (texto muda após
  15s de loading) aplicado em `PerguntarTab.tsx`, `RecomendacaoEstudoCard.tsx`, `NovaProvaPage.tsx`
  e `FlashcardEstudoCard.tsx`. `RevisaoSugestoesFlashcards.tsx` foi deliberadamente excluído: seu
  único loading (`confirmando`) é `POST /flashcards/confirmar-sugestoes`, persistência pura sem
  chamada à IA — a geração já aconteceu antes, em `MaterialItem.tsx`; adicionar o aviso ali seria
  informação falsa.
- **N5 — Cat. 2/4** Rate limit de IA (10 req/min por usuário, `RateLimitingFilter.java:74-83`) só é
  comunicado reativamente, depois de estourado.
  **Status: RESOLVIDO** — nota "Limitado a 10 [gerações/perguntas] por minuto" adicionada perto do
  botão de ação nos mesmos 4 componentes do N4 (mesma exclusão de `RevisaoSugestoesFlashcards.tsx`,
  pelo mesmo motivo).
- **N6 — Cat. 4** Copy "Isso pode levar até 15 segundos" (`MaterialItem.tsx:128`) não reflete o
  timeout real (120s) nem o efeito do retry.
  **Status: RESOLVIDO** — após 15s de loading, o texto passa a "Ainda gerando, pode levar um pouco
  mais que o normal...".
- **N7 — Cat. 5** `QuizService.java:208-218,182-191` também distingue 403 de 404 (mesmo padrão de
  C1/C3) — rebaixado a nice-to-have porque é decisão documentada no contrato, mas recomenda-se
  avaliar junto da correção de C1/C2/C3.
  **Status: RESOLVIDO** — `buscarQuizDoUsuarioAutenticado` e `buscarDetalheTentativa` agora sempre
  404, mesmo padrão de C1/C3; `contrato-api.md` atualizado (regra geral + rotas de quiz/tentativa).
- **N8 — Cat. 6** `frontend/nginx.conf.template` não define nenhum header de segurança (CSP,
  X-Frame-Options, Referrer-Policy, `X-Content-Type-Options`), enquanto `SecurityConfig.java:100-106`
  os configura explicitamente só para a API — o JWT em `localStorage` (sem `httpOnly`) roda sem
  essa camada de defesa em profundidade.
  **Status: RESOLVIDO** — CSP (compatível com Google Fonts e o widget VLibras), X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy e Permissions-Policy adicionados ao nginx.
- **N9 — Cat. 8** Mensagens técnicas de `TokenVerificacaoInvalidoException`/
  `TokenRedefinicaoInvalidoException` sobrepõem o fallback amigável já escrito no frontend
  (`VerificarEmailPage.tsx:44`, `RedefinirSenhaPage.tsx:69`).
  **Status: RESOLVIDO** — mensagens do backend reescritas em linguagem humana ("link", não "token").
- **N10 — Cat. 3** Campo `mensagem` (PT, sucesso) vs `message` (EN, erro) inconsistente entre
  `MensagemResponseDTO.java` e `ErrorResponseDTO.java`.
  **Status: RESOLVIDO** — `MensagemResponseDTO` padronizado para `message` (alinhado a
  `ErrorResponseDTO`, que já era consumido amplamente pelo frontend via `apiError.ts`); direção
  escolhida pelo menor raio de impacto — ver nota no relatório.
- **N11 — Cat. 7** Comentário em `PerfilPage.tsx:24-25` descreve um comportamento de erro de campo
  para conflito de `nomeUsuario` que a implementação real (`:87-89`) não faz (só toast genérico).
  **Status: RESOLVIDO** — implementado o comportamento que o comentário já descrevia (409 de
  `nomeUsuario` agora vira erro do campo, não só toast), em vez de só corrigir o texto do comentário.

---

## Pontos fortes observados (sem achados, registrados para contexto)

- RN09-RN12 (SM-2) e RN40 (prontidão) batem exatamente com a implementação — nenhuma divergência de
  fórmula.
- Landing page já comunica bem o diferencial "ciência da memória, SM-2, 100% algorítmico" — Categoria
  2 bem resolvida no marketing, mesmo com a lacuna de UX pós-avaliação (I5).
- Escala de avaliação 0-5 humanizada na UI de estudo ("Não lembrei/Errei/Quase/Com esforço/Bom/Fácil"),
  sem jargão técnico exposto — bom exemplo de Categoria 8 bem resolvida.
- `TratamentoErrosGlobal.java` sanitiza bem erros inesperados (500 genérico, sem stack trace).
- Chave da API Gemini nunca hardcoded; nenhum log imprime a URL com `?key=...`.
- Todos os endpoints de `ia`/`quiz` exigem autenticação; RN01 é aplicada via
  `buscarXxxDoUsuarioAutenticado` de forma consistente (apesar da falha 403/404 em C1/C3/N7).
- CORS restrito (não é `*`), rate limiting por rota crítica com mensagem amigável.
- LGPD (exportar/excluir dados) implementado e comunicado no perfil e na landing.
- Estados vazios/erro bem tratados na maior parte dos componentes (skeleton + retry).

---

## Ordem sugerida de correção (histórico — todas as etapas concluídas em 2026-09-21)

1. ~~**C1 + C2 + C3 + N7** juntas — mesma decisão de segurança mal aplicada; padrão 404-sempre de
   `deck`/`colecao` estendido a `material`, `flashcard`, `quiz` e `tentativa`, `contrato-api.md`
   atualizado.~~ **RESOLVIDO.**
2. ~~**C4** — timing oracle em login/esqueci-senha/reenvio de verificação.~~ **RESOLVIDO.**
3. ~~**I1, I7** — decisões de produto/copy que precisavam de uma escolha consciente.~~
   **RESOLVIDO** — ambas fecharam o gap em vez de só documentar o risco aceito (I1: cadastro nunca
   mais confirma e-mail duplicado; I7: ressalva de compartilhamento adicionada à Política de
   Privacidade).
4. ~~Demais importantes (I2-I6, I8, I9).~~ **RESOLVIDO.**
5. ~~Nice-to-haves (N2-N11; N1 não precisava de ação).~~ **RESOLVIDO.**

Nenhum gap confirmado em aberto no escopo desta auditoria.
