# Contrato da API REST

Convenções gerais:
- Todos os endpoints exigem `Authorization: Bearer {token}`, exceto os marcados com **(**)**.
- Toda rota que recebe `{id}` de um recurso pertencente a outro usuário retorna `403` (RN01).
- Formato padrão de erro:

```json
{
  "timestamp": "2026-08-22T14:32:10Z",
  "status": 400,
  "error": "Bad Request",
  "message": "O arquivo enviado excede o tamanho maximo de 15MB.",
  "path": "/api/decks/12/materiais"
}
```

## Autenticação (UC01)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/auth/cadastro` (**) | `{ nome, email, senha }` | `201` — `{ id, nome, email, criadoEm }` | `400` (dados inválidos) · `409` (e-mail já cadastrado — RN02) |
| POST | `/api/auth/login` (**) | `{ email, senha }` | `200` — `{ token, tipo: "Bearer", expiraEm }` | `401` (credenciais inválidas) |

## Decks (UC02)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| GET | `/api/decks` | — | `200` — `[ { id, titulo, descricao, criadoEm, totalFlashcards } ]` | `401` |
| POST | `/api/decks` | `{ titulo, descricao }` | `201` — `{ id, titulo, descricao, criadoEm }` | `400` (título vazio) · `401` |
| GET | `/api/decks/{id}` | — | `200` — `{ id, titulo, descricao, criadoEm, atualizadoEm }` | `401` · `403` (RN01) · `404` |
| PUT | `/api/decks/{id}` | `{ titulo, descricao }` | `200` — deck atualizado | `400` · `401` · `403` (RN01) · `404` |
| DELETE | `/api/decks/{id}` | — | `204` (exclusão em cascata — RN13) | `401` · `403` (RN01) · `404` |

## Upload de Material — PDF (UC03)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/decks/{id}/materiais` | `multipart/form-data` — campo `arquivo` (.pdf, máx. 15MB) | `201` — `{ id, nomeArquivo, statusProcessamento: "PENDENTE" }` | `400` (não é PDF/excede tamanho — RN06) · `401` · `403` · `404` |
| GET | `/api/materiais/{id}` | — | `200` — `{ id, nomeArquivo, statusProcessamento, criadoEm }` | `401` · `403` · `404` |

## Geração de Flashcards via IA (UC04/UC05)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/materiais/{id}/gerar-flashcards` | — (usa texto já extraído) | `200` — `{ sugestoes: [ { pergunta, resposta, topico } ] }` (máx. 15 — RN08; nada persistido ainda; topico ver RN17) | `400` (status ERRO/texto insuficiente — RN07) · `401` · `403` · `404` · `502` (falha no serviço de IA) |
| POST | `/api/decks/{id}/flashcards/confirmar-sugestoes` | `{ sugestoes: [ { pergunta, resposta, aceitar: true } ] }` | `201` — flashcards criados com `origem: "IA"` | `400` · `401` · `403` · `404` |

## Flashcards (UC05/UC06)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| GET | `/api/decks/{id}/flashcards` | — | `200` — `[ { id, pergunta, resposta, mnemonico, origem } ]` | `401` · `403` · `404` |
| POST | `/api/decks/{id}/flashcards` | `{ pergunta, resposta, mnemonico? }` | `201` — flashcard criado com `origem: "MANUAL"` | `400` (campos obrigatórios) · `401` · `403` · `404` |
| PUT | `/api/flashcards/{id}` | `{ pergunta, resposta, mnemonico? }` | `200` — flashcard atualizado | `400` · `401` · `403` (RN01) · `404` |
| DELETE | `/api/flashcards/{id}` | — | `204` (revisões associadas removidas em cascata) | `401` · `403` · `404` |

## Estudo com Repetição Espaçada (UC07/UC08/UC09)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| GET | `/api/decks/{id}/fila-estudo` | — | `200` — `[ { flashcardId, pergunta, resposta, mnemonico } ]` (RN10) | `401` · `403` · `404` |
| POST | `/api/flashcards/{id}/revisoes` | `{ qualidadeResposta: 0-5 }` | `201` — `{ fatorFacilidade, intervaloDias, repeticoes, proximaRevisao }` (SM-2 — RN09/RN11/RN12) | `400` (fora de 0-5) · `401` · `403` · `404` |

Exemplo completo:

```
// Request
POST /api/flashcards/57/revisoes
{ "qualidadeResposta": 4 }

// Response 201 Created
{
  "flashcardId": 57,
  "qualidadeResposta": 4,
  "fatorFacilidade": 2.60,
  "intervaloDias": 6,
  "repeticoes": 2,
  "proximaRevisao": "2026-08-28"
}
```

## Quiz — extensão de escopo (UC10)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/decks/{id}/quizzes` | — (a partir dos flashcards, opcionalmente via IA) | `201` — `{ id, titulo, questoes: [ { id, enunciado, alternativas } ] }` | `400` (flashcards insuficientes) · `401` · `403` · `404` |
| GET | `/api/quizzes/{id}` | — | `200` — `{ id, titulo, questoes: [...] }` (sem expor `resposta_correta`) | `401` · `403` · `404` |
| POST | `/api/quizzes/{id}/tentativas` | `{ respostas: [ { questaoId, alternativaEscolhida } ] }` | `201` — `{ pontuacao, acertos, total }` (RN15: todas as questões) | `400` (respostas incompletas — RN15) · `401` · `403` · `404` |

## Dashboard de Progresso (UC11)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| GET | `/api/decks/{id}/dashboard` | — | `200` — `{ totalFlashcards, percentualDominado, percentualEmRisco }` (RN14) | `401` · `403` · `404` |

## Recomendação de Foco de Estudo (UC13)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/decks/{id}/recomendacao-estudo` | — | `200` — `{ recomendacao, topicoFoco, baseadoEmDados }` (RN18) | `401` · `403` · `404` · `502` (falha na IA) |

`baseadoEmDados: false` indica mensagem padrão (sem chamada à IA), por falta de dados suficientes.

## Explicação de Flashcard (UC14)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/flashcards/{id}/explicacao` | — | `200` — `{ explicacao, ancoradaNoMaterial }` (RN19) | `401` · `403` (RN01) · `404` · `502` (falha na IA) |
