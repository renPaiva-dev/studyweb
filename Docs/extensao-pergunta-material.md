# Extensão de Escopo — Pergunta Livre sobre o Material do Deck (UC32/RN41)

Extensão da especificação já fechada. Reaproveita 100% da infraestrutura de
IA já existente (`GeminiClient`) — sem vector store, sem embeddings, sem
dependência nova. Mesmo RAG-lite de `Docs/extensao-explicacao-rag-lite.md`
(UC14/RN19), mas escopado ao deck inteiro em vez de um único flashcard: o
estudante faz uma pergunta livre ("por que X?", "me dá um exemplo de Y"),
não limitada ao par pergunta/resposta de um flashcard específico.

## 1. Nova Regra de Negócio

| Cód. | Descrição |
|---|---|
| RN41 | O estudante pode fazer uma pergunta livre sobre o conteúdo de um deck. A resposta é gerada via IA ancorada no texto extraído de todos os materiais processados (status `PROCESSADO`, com texto já extraído) daquele deck — nunca em conhecimento genérico do modelo, mesmo espírito de RN19. Diferente de RN19 (que pode responder sem ancoragem, já que o par pergunta/resposta do flashcard é contexto suficiente), aqui um deck sem nenhum material processado não pode ser consultado (erro 400) — sem material, não há o que responder. A resposta é gerada sob demanda, nunca persistida (mesmo espírito de RN18). |

## 2. Novo Caso de Uso

### UC32 — Perguntar sobre o material do deck

- **Ator:** Estudante
- **Objetivo:** Tirar uma dúvida livre sobre o conteúdo de um deck, sem se limitar à pergunta/resposta de um flashcard específico — o equivalente a "conversar com o material", mas ancorado e sem infraestrutura de chat com histórico persistido.
- **Pré-condições:** Deck existente, pertencente ao usuário autenticado (RN01); deck com ao menos um material processado (status `PROCESSADO`, com texto extraído).
- **Pós-condições:** Resposta retornada, nunca persistida (mesmo espírito de RN18) — cada pergunta é independente, sem memória de perguntas anteriores na mesma sessão.
- **Fluxo principal:**
  1. Estudante digita uma pergunta livre sobre um deck.
  2. Sistema aplica RN01.
  3. Sistema reúne o texto extraído de todos os materiais processados do deck.
  4. Sistema monta um prompt com a pergunta e esse texto como única fonte permitida, e chama a IA (RN41).
  5. Sistema retorna a resposta e quantos materiais foram usados como contexto.
- **Fluxos de exceção:** E1 — deck sem nenhum material processado → 400. E2 — falha na API de IA → 502 (com retry, mesmo padrão de UC13/UC14 após a correção de B10).
- **Regras relacionadas:** RN41, RN01, RN19 (mesmo princípio de ancoragem)

## 3. Modelo de dados

Nenhuma tabela ou coluna nova. Sem persistência de perguntas/respostas —
cada chamada é independente (RN41), então não há histórico de conversa
para guardar. Se um histórico persistido vier a ser desejado no futuro,
é uma extensão separada (nova tabela, decisão de retenção de dados sob a
ótica de LGPD/RN31).

## 4. Extensão do Contrato de API

### Pergunta sobre o Material do Deck (UC32)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/decks/{id}/perguntas` | `{ pergunta: string }` | `200` — `{ resposta: string, materiaisConsultados: number }` (RN41) | `400` (nenhum material processado no deck) · `401` · `404` (não existe ou não é seu — RN01) · `429` (limite de 10/min, mesmo padrão B11) · `502` (falha na IA, com retry — B10) |

## 5. Implementação

1. Pacote `com.tcc.plataformaestudos.ia` (ao lado de `ExplicacaoService`/`RecomendacaoEstudoService`):
   - `PerguntaMaterialRequestDTO(String pergunta)` — `@NotBlank`, `@Size(max = 1000)`.
   - `PerguntaMaterialResponseDTO(String resposta, int materiaisConsultados)`.
   - `MaterialNaoDisponivelException` (estende `NegocioException`, 400) — deck sem material processado.
   - `GeracaoRespostaMaterialException` (estende `GeracaoConteudoIAException`, 502) — mesmo papel de `GeracaoExplicacaoException`/`GeracaoRecomendacaoException`.
   - `PerguntaMaterialService`:
     - Aplica RN01 via `DeckService.buscarDeckDoUsuarioAutenticado` (já existente).
     - Busca todos os materiais do deck com status `PROCESSADO` e texto extraído não nulo (novo método em `MaterialOrigemRepository`). Vazio → `MaterialNaoDisponivelException`.
     - Monta o prompt com a pergunta e o texto de cada material (identificado pelo nome do arquivo), instruindo a IA a responder **somente** com base nesse texto e dizer explicitamente quando o material não cobre o ponto perguntado — nunca inventar.
     - Chama o `GeminiClient` com o mesmo padrão de retry (2 tentativas, captura `GeracaoConteudoIAException`) já usado em `ExplicacaoService`/`RecomendacaoEstudoService` (B10).
   - `PerguntaMaterialController` — `POST /api/decks/{id}/perguntas`.
2. `RateLimitingFilter`: nova `Regra("POST", "/api/decks/*/perguntas", 10, 60_000, true)`, mesmo limite dos demais endpoints de IA (B11).
3. Testes unitários cobrindo: resposta ancorada com materiais disponíveis (prompt contém o texto extraído, `materiaisConsultados` correto); deck sem material processado → `MaterialNaoDisponivelException`; RN01 (deck de outro usuário); falha da IA → retry e depois 502.

Siga `Docs/boas-praticas-backend.md`/`Docs/boas-praticas-frontend.md` em tudo.

## 6. Teste manual

1. Deck com ao menos um material processado → `POST /api/decks/{id}/perguntas` com uma pergunta cuja resposta está no material → confirma que a resposta cita conteúdo real do PDF, não genérico.
2. Mesma chamada com uma pergunta cuja resposta **não** está no material → confirma que a IA diz isso explicitamente, em vez de inventar.
3. Deck sem nenhum material processado → 400.
4. RN01: usuário B tenta chamar em deck do usuário A → 404.

## 7. Como isso reforça a narrativa do TCC

Fecha a comparação direta com o NotebookLM citada no posicionamento do
produto: onde UC14 ancora a explicação de um flashcard específico, UC32
generaliza para qualquer pergunta sobre o deck inteiro — "converse com o
seu material", mas com o mesmo cuidado de RAG-lite (resposta restrita ao
texto real enviado pelo aluno, sem alucinar) e sem carregar a complexidade
de um chat com histórico ou de um vector store, proporcional ao escopo de
um TCC. A ausência de persistência de histórico é uma decisão de escopo
documentada (§3), não uma limitação técnica.
