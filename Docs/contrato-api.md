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
| GET | `/api/decks/{id}/materiais` | — | `200` — `[ { id, nomeArquivo, statusProcessamento, criadoEm } ]`, mais recentes primeiro | `401` · `403` · `404` |

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
| POST | `/api/quizzes/{id}/tentativas` | `{ respostas: [ { questaoId, alternativaEscolhida } ] }` | `201` — `{ pontuacao, acertos, total, questoes: [ { questaoId, enunciado, alternativas, respostaCorreta, alternativaEscolhida, correta, explicacao } ] }` (RN15: todas as questões; `questoes` revela a revisão completa, só disponível depois de respondida) | `400` (respostas incompletas — RN15) · `401` · `403` · `404` |

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

## Dashboard Avançado (UC15)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| GET | `/api/decks/{id}/dashboard/evolucao?dias={7\|30\|90}` | — | `200` — `{ pontos: [ { data, mediaQualidade, totalRevisoes } ] }` | `400` · `401` · `403` · `404` |
| GET | `/api/decks/{id}/dashboard/topicos` | — | `200` — `{ topicos: [ { topico, totalFlashcards, percentualDominado, percentualEmRisco } ] }` (sem tópico → "Sem categoria") | `401` · `403` · `404` |
| GET | `/api/decks/{id}/dashboard/atividade` | — | `200` — `{ flashcardsMaisRevisados: [...], revisoesPorDiaSemana: [...] }` (top 5) | `401` · `403` · `404` |

## Prova Personalizada (UC16 — substituído por UC27 abaixo)

~~`POST /api/decks/{id}/quizzes/personalizado`, sem request body, priorizando tópicos em risco~~ — substituído pelo endpoint de UC27, que recebe os flashcards escolhidos e o estilo.

## Provas Personalizadas por Seleção de Flashcards (UC27/UC28)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/decks/{id}/provas` | `{ flashcardIds: [...], estilo: "ENEM" \| "VESTIBULAR" \| "GERAL" }` | `201` — mesmo formato de `QuizResponseDTO` (`{ id, titulo, questoes: [...] }`, sem expor `respostaCorreta`) | `400` (`flashcardIds` vazio, ou flashcard não pertence ao deck — RN01) · `401` · `403` · `404` · `502` (falha na IA) |
| GET | `/api/usuario/provas` | — | `200` — `[ { tentativaId, quizId, titulo, origem, estilo, dataTentativa, pontuacao, acertos, total } ]`, mais recentes primeiro (RN36) | `401` |
| GET | `/api/usuario/provas/{tentativaId}` | — | `200` — `{ tentativaId, quizId, titulo, origem, estilo, dataTentativa, pontuacao, questoes: [ { questaoId, enunciado, alternativas, respostaCorreta, alternativaEscolhida, correta, explicacao } ] }` (RN36) | `401` · `403` (RN01) · `404` |

`GET /api/quizzes/{id}` e `POST /api/quizzes/{id}/tentativas` (já existentes, seção "Quiz") funcionam sem alteração para provas personalizadas — o quiz gerado por `POST /api/decks/{id}/provas` é respondido pelo mesmo `POST /api/quizzes/{id}/tentativas`.

## Conta e Perfil (UC17, UC19)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/auth/cadastro` (**) | `{ nome, nomeUsuario, email, senha }` | `201` — `{ id, nome, nomeUsuario, email, papel, criadoEm }` | `400` · `409` (e-mail ou nomeUsuario duplicado — RN02/RN22) |
| GET | `/api/usuario/perfil` | — | `200` — `{ id, nome, nomeUsuario, email, papel, criadoEm }` | `401` |
| PUT | `/api/usuario/perfil` | `{ nome, nomeUsuario }` | `200` — perfil atualizado | `400` · `401` · `409` (nomeUsuario em uso) |

## Recuperação de Senha (UC18)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/auth/esqueci-senha` (**) | `{ email }` | `200` — mensagem genérica (RN24) | `400` |
| POST | `/api/auth/redefinir-senha` (**) | `{ token, novaSenha }` | `200` — senha redefinida | `400` (token inválido/expirado/usado) |

## Dashboard Geral Consolidado (UC20)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| GET | `/api/usuario/dashboard-geral` | — | `200` — `{ totalDecks, totalFlashcards, percentualDominadoGeral, percentualEmRiscoGeral, totalTentativasQuiz, pontuacaoMediaQuiz, streakDias, decks: [...] }` (RN25) | `401` |

## Verificação de E-mail (UC21)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/auth/verificar-email` (**) | `{ token }` | `200` — mensagem de sucesso | `400` (token inválido/expirado/usado) |
| POST | `/api/auth/reenviar-verificacao` (**) | `{ email }` | `200` — mensagem genérica (RN26) | `400` |

`POST /api/auth/login` ganha um novo erro possível: `403` quando `emailVerificado=false` (RN26).

## Exclusão de Material (UC22)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| DELETE | `/api/materiais/{id}` | — | `204` | `401` · `403` (RN01) · `404` |

## Troca de Senha Autenticado (UC26)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| PUT | `/api/usuario/senha` | `{ senhaAtual, novaSenha }` | `200` — senha alterada | `400` (senha atual incorreta ou nova fora da política RN27) · `401` |

## Exportação de Dados — LGPD (UC24)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| GET | `/api/usuario/exportar-dados` | — | `200` — `{ perfil, decks: [...] }` (RN31, estrutura completa) | `401` |

## Exclusão de Conta — LGPD (UC25)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| DELETE | `/api/usuario/conta` | `{ senha }` | `204` | `401` (senha incorreta) |

`POST /api/auth/cadastro` ganha o campo `termosAceitos: boolean` (obrigatório `true`, RN30).

## Compartilhamento de Deck (UC29)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| GET | `/api/decks/{id}/compartilhamento` | — | `200` — `{ ativo, token, criadoEm }` (RN37/RN38) | `401` · `403` (RN01) · `404` |
| POST | `/api/decks/{id}/compartilhamento` | — | `200` — `{ ativo: true, token, criadoEm }` (gera/regenera o token — RN38) | `401` · `403` (RN01) · `404` |
| DELETE | `/api/decks/{id}/compartilhamento` | — | `204` (desativa o link — RN38) | `401` · `403` (RN01) · `404` (nenhum link existente) |
| GET | `/api/compartilhamentos/{token}` (\*\*) | — | `200` — `{ titulo, descricao, flashcards: [...] }` (RN37, somente leitura) | `404` (token inválido ou desativado) |

(\*\*) Endpoint público — não exige JWT (RNF03, exceção documentada em `docs/regras-de-negocio.md`, RN37).

## Lembrete de Revisão (UC30)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/usuario/lembrete-revisao/teste` | — | `200` — `{ mensagem }` (envia para o próprio e-mail, mesmo sem pendências — RN39) | `401` · `429` (limite de 3/min) |

O job automático diário (RN39) não é um endpoint — roda internamente (`@Scheduled`, cron configurável via `app.lembrete-revisao.cron`).
