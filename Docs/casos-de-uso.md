# Casos de Uso — Especificação Detalhada

## UC01 — Cadastrar-se / Fazer login

- **Ator:** Estudante
- **Objetivo:** Criar conta ou autenticar-se para acesso exclusivo aos próprios dados.
- **Pré-condições:** Para login, cadastro prévio existente.
- **Pós-condições:** Token JWT válido emitido.
- **Fluxo principal:**
  1. Estudante acessa cadastro/login.
  2. Informa nome/e-mail/senha (cadastro) ou e-mail/senha (login).
  3. Sistema valida os dados.
  4. Sistema cria o usuário ou autentica.
  5. Sistema retorna token JWT.
  6. Estudante é redirecionado à lista de decks.
- **Alternativos:** A2 — e-mail já cadastrado → erro (RN02).
- **Exceções:** E1 — credenciais inválidas → erro genérico, sem revelar se o e-mail existe (RNF03).
- **Regras relacionadas:** RN02

## UC02 — Criar / gerenciar deck

- **Ator:** Estudante
- **Objetivo:** Organizar conteúdo de estudo em decks temáticos.
- **Pré-condições:** Usuário autenticado.
- **Pós-condições:** Deck criado/editado/removido, vinculado ao usuário.
- **Fluxo principal:**
  1. Estudante acessa "Meus decks".
  2. Seleciona "Novo deck", informa título e descrição.
  3. Sistema valida (título obrigatório).
  4. Sistema cria o deck vinculado ao usuário autenticado.
  5. Deck exibido na lista.
- **Alternativos:** A1 — editar título/descrição; A2 — excluir deck (cascata, RN13).
- **Exceções:** E1 — título vazio → bloqueia envio.
- **Regras relacionadas:** RN03, RN13

## UC03 — Enviar PDF de estudo

- **Ator:** Estudante
- **Objetivo:** Disponibilizar um PDF como base para geração automática de flashcards.
- **Pré-condições:** Usuário autenticado; deck já criado.
- **Pós-condições:** `MaterialOrigem` criado com status inicial `PENDENTE`.
- **Fluxo principal:**
  1. Estudante seleciona "Enviar PDF" em um deck.
  2. Seleciona o arquivo.
  3. Sistema valida formato (.pdf) e tamanho máximo (RN06).
  4. Sistema armazena o arquivo e cria `MaterialOrigem` (status `PENDENTE`).
  5. Sistema extrai o texto do PDF.
  6. Sucesso → status `PROCESSADO`, segue para UC04.
- **Exceções:**
  - E1 — arquivo inválido/excede tamanho → rejeitado (RN06).
  - E2 — falha na extração de texto → status `ERRO`, IA não é chamada (RN07).
- **Regras relacionadas:** RN06, RN07

## UC04 — Gerar flashcards via IA

- **Ator:** Estudante (fluxo disparado a partir de UC03)
- **Objetivo:** Gerar sugestões de flashcards a partir do texto extraído, via IA externa.
- **Pré-condições:** `MaterialOrigem` com status `PROCESSADO` e texto extraído disponível.
- **Pós-condições:** Lista de flashcards sugeridos (não persistidos) apresentada para revisão.
- **Fluxo principal:**
  1. Sistema monta prompt estruturado, limitando a N flashcards (RN08).
  2. Sistema envia requisição ao serviço de IA.
  3. IA retorna JSON com sugestões.
  4. Sistema valida o formato do JSON.
  5. Sistema registra o uso da API em log (RN16).
  6. Sistema apresenta as sugestões para revisão (UC05).
- **Exceções:**
  - E1 — JSON inválido/mal formatado → retry ou erro amigável, log de erro (RN16).
  - E2 — serviço de IA indisponível/timeout → informa o estudante; `MaterialOrigem` continua `PROCESSADO` para nova tentativa.
- **Regras relacionadas:** RN08, RN16

## UC05 — Criar/editar flashcard

- **Ator:** Estudante
- **Objetivo:** Criar flashcards manualmente e revisar/editar sugestões da IA antes de confirmar.
- **Pré-condições:** Usuário autenticado; deck existente.
- **Pós-condições:** Flashcard(s) persistido(s) com `origem` = MANUAL ou IA.
- **Fluxo principal:**
  1. Manual: informa pergunta e resposta, confirma.
  2. Sugestões da IA: sistema lista cada sugestão com opções aceitar/editar/descartar.
  3. Estudante decide, sugestão a sugestão.
  4. Sistema persiste apenas os aceitos, com `origem = "IA"`.
  5. Estudante pode editar/excluir qualquer flashcard salvo depois.
- **Alternativos:** A1 — editar flashcard existente; A2 — excluir (confirmação).
- **Exceções:** E1 — pergunta/resposta vazias → bloqueia salvamento.
- **Regras relacionadas:** RN04, RN05

## UC06 — Registrar mnemônico

- **Ator:** Estudante
- **Objetivo:** Adicionar texto de apoio a um flashcard.
- **Pré-condições:** Flashcard existente.
- **Pós-condições:** Campo `mnemonico` atualizado.
- **Fluxo principal:** Abre flashcard → informa mnemônico → sistema salva e exibe nas próximas sessões.

## UC07 — Estudar deck (revisão)

- **Ator:** Estudante
- **Objetivo:** Apresentar flashcards pendentes de revisão no dia.
- **Pré-condições:** Deck com ao menos um flashcard.
- **Pós-condições:** Fila de estudo exibida, iniciando UC08.
- **Fluxo principal:**
  1. Estudante seleciona "Estudar" em um deck.
  2. Sistema consulta flashcards com `proxima_revisao <= hoje` (RN10).
  3. Sistema ordena (mais atrasados primeiro).
  4. Sistema apresenta o primeiro flashcard.
- **Alternativos:** A1 — fila vazia → informa que não há revisões pendentes.
- **Regras relacionadas:** RN10

## UC08 — Avaliar própria resposta (0-5)

- **Ator:** Estudante
- **Objetivo:** Coletar avaliação da própria resposta para alimentar o SM-2.
- **Pré-condições:** Flashcard em sessão de estudo (UC07).
- **Pós-condições:** Nova revisão registrada; UC09 executado (include).
- **Fluxo principal:**
  1. Estudante visualiza a pergunta.
  2. Vira o card, confere a resposta.
  3. Informa nota 0-5.
  4. Sistema aciona UC09.
  5. Sistema avança para o próximo flashcard ou finaliza a sessão.
- **Exceções:** E1 — nota fora de 0-5 → rejeitada.
- **Regras relacionadas:** RN09

## UC09 — Recalcular próxima revisão (SM-2)

- **Ator:** Sistema (incluído por UC08)
- **Objetivo:** Atualizar parâmetros de repetição espaçada segundo o algoritmo SM-2.
- **Pré-condições:** Qualidade (0-5) informada em UC08.
- **Pós-condições:** Registro `RevisaoFlashcard` criado com novos parâmetros.
- **Fluxo principal:**
  1. Recupera o último estado do flashcard (ou valores iniciais).
  2. Se qualidade < 3: `repeticoes = 0`, `intervalo_dias = 1` (RN11).
  3. Se qualidade >= 3: `repeticoes += 1`; intervalo = 1 dia (1ª rep.), 6 dias (2ª rep.), ou `intervalo anterior × EF` (demais).
  4. Recalcula EF: `EF' = EF + (0.1 - (5-qualidade) * (0.08 + (5-qualidade) * 0.02))`, mínimo 1.3 (RN12).
  5. `proxima_revisao = hoje + intervalo_dias`.
  6. Persiste o novo registro.
- **Regras relacionadas:** RN09, RN11, RN12

## UC10 — Responder quiz (extensão de escopo)

- **Ator:** Estudante
- **Objetivo:** Testar conhecimento via quiz de múltipla escolha gerado a partir do deck.
- **Pré-condições:** Quiz gerado para o deck.
- **Pós-condições:** Tentativa registrada com pontuação final.
- **Fluxo principal:**
  1. Estudante inicia o quiz.
  2. Sistema apresenta as questões.
  3. Estudante seleciona alternativas.
  4. Estudante confirma o envio.
  5. Sistema calcula pontuação e registra a tentativa.
- **Exceções:** E1 — envio incompleto → não registra pontuação até responder tudo (RN15).
- **Regras relacionadas:** RN15

## UC11 — Visualizar progresso/dashboard

- **Ator:** Estudante
- **Objetivo:** Acompanhar desempenho de estudo por deck.
- **Pré-condições:** Usuário com deck e histórico mínimo de revisões.
- **Pós-condições:** Métricas de progresso exibidas.
- **Fluxo principal:**
  1. Estudante acessa o dashboard de um deck.
  2. Sistema calcula % dominado e % em risco (RN14).
  3. Sistema exibe as métricas.
- **Regras relacionadas:** RN14
