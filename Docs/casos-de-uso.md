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

## UC12 — Classificar tópico do flashcard (incluído por UC04)

- **Ator:** Sistema (incluído no fluxo de UC04)
- **Objetivo:** Atribuir um tópico curto a cada flashcard sugerido pela IA, permitindo agregações futuras (dashboard, recomendação).
- **Pré-condições:** Fluxo de UC04 em andamento (texto extraído já disponível).
- **Pós-condições:** Cada sugestão retornada inclui o campo `topico`.
- **Fluxo principal:** O prompt de UC04 é ajustado para pedir também um campo `topico` por sugestão, no mesmo JSON de resposta — não é uma chamada adicional à IA.
- **Regras relacionadas:** RN17

## UC13 — Obter recomendação de foco de estudo

- **Ator:** Estudante
- **Objetivo:** Fornecer uma sugestão textual curta indicando em qual tópico o estudante deveria focar, com base no desempenho real registrado.
- **Pré-condições:** Deck existente, pertencente ao usuário autenticado.
- **Pós-condições:** Recomendação retornada (não persistida).
- **Fluxo principal:**
  1. Estudante solicita a recomendação.
  2. Sistema aplica RN01.
  3. Sistema agrega os flashcards em risco por tópico.
  4. Se houver tópico(s) com concentração significativa, monta prompt com esses dados agregados e chama a IA.
  5. Sistema retorna a recomendação textual e o tópico de foco.
- **Fluxos alternativos:** A1 — sem dados suficientes → mensagem padrão, sem chamar a IA.
- **Fluxos de exceção:** E1 — falha na API de IA → mensagem de erro amigável.
- **Regras relacionadas:** RN18

## UC14 — Solicitar explicação de um flashcard

- **Ator:** Estudante
- **Objetivo:** Obter uma explicação alternativa/mais detalhada de um flashcard, ancorada no material original quando disponível.
- **Pré-condições:** Flashcard existente, pertencente a um deck do usuário autenticado.
- **Pós-condições:** Explicação retornada (não persistida).
- **Fluxo principal:**
  1. Estudante solicita explicação de um flashcard (ex.: durante UC08).
  2. Sistema aplica RN01.
  3. Sistema verifica se há material de origem disponível no deck.
  4. Se houver texto extraído, monta prompt com pergunta, resposta e o texto do material, pedindo explicação ancorada nele.
  5. Se não houver, gera explicação sem ancoragem, sinalizando isso.
  6. Sistema retorna a explicação.
- **Fluxos de exceção:** E1 — falha na API de IA → mensagem de erro amigável.
- **Regras relacionadas:** RN19

## UC15 — Visualizar evolução detalhada do dashboard (extensão de UC11)

- **Ator:** Estudante
- **Objetivo:** Entender a evolução do próprio desempenho ao longo do tempo e por tópico, além do retrato agregado de UC11.
- **Pré-condições:** Deck existente, pertencente ao usuário autenticado.
- **Pós-condições:** Dados de evolução, por tópico e de atividade exibidos.
- **Fluxo principal:**
  1. Estudante acessa a visão detalhada do dashboard, opcionalmente escolhendo um período (7/30/90 dias).
  2. Sistema aplica RN01.
  3. Sistema calcula a evolução temporal (média de qualidade por dia).
  4. Sistema calcula o detalhamento por tópico (RN17).
  5. Sistema calcula os flashcards mais revisados e a distribuição por dia da semana.
- **Regras relacionadas:** RN20

## UC16 — Gerar prova personalizada via IA (substituído por UC27)

- **Ator:** Estudante
- **Objetivo:** ~~Obter uma avaliação de múltipla escolha focada nos tópicos de pior desempenho real~~ — substituído por UC27: o usuário escolhe manualmente os flashcards e o estilo, em vez de o sistema detectar tópicos em risco automaticamente.
- **Regras relacionadas:** RN21 (substituída por RN35)

## UC27 — Gerar prova personalizada por seleção de flashcards e estilo

- **Ator:** Estudante
- **Objetivo:** Obter uma avaliação de múltipla escolha inédita, sobre o tema de flashcards escolhidos pelo próprio estudante, no estilo de prova de sua preferência (ENEM, Vestibular ou Conhecimentos Gerais).
- **Pré-condições:** Deck com ao menos um flashcard.
- **Pós-condições:** Quiz criado e persistido (reaproveitando Quiz/QuestaoQuiz, origem=IA_PERSONALIZADA), com questões geradas por IA.
- **Fluxo principal:**
  1. Estudante acessa a aba "Provas" e escolhe "Nova prova".
  2. Estudante seleciona um deck, um ou mais flashcards desse deck, e um estilo de prova.
  3. Sistema aplica RN01 (deck e flashcards pertencem ao usuário autenticado).
  4. Sistema monta prompt pedindo questões originais sobre o tema dos flashcards escolhidos, no estilo pedido, cada uma com uma explicação da resposta correta.
  5. Sistema valida e persiste as questões geradas.
  6. Estudante responde pelo endpoint já existente de UC10 (`POST /api/quizzes/{id}/tentativas`), que passa a devolver também a revisão questão a questão (RN36).
- **Fluxos alternativos:** A1 — nenhum flashcard selecionado → 400, sem chamar a IA.
- **Fluxos de exceção:** E1 — flashcard selecionado não pertence ao deck informado → 400. E2 — falha na IA/JSON malformado → 502.
- **Regras relacionadas:** RN35, RN15

## UC28 — Consultar histórico de provas

- **Ator:** Estudante
- **Objetivo:** Revisar o desempenho em provas já respondidas, questão a questão.
- **Pré-condições:** Ao menos uma tentativa de quiz/prova registrada.
- **Fluxo principal:**
  1. Estudante acessa a aba "Provas".
  2. Sistema lista as tentativas do estudante, mais recentes primeiro (RN01: só as do próprio usuário).
  3. Estudante abre uma tentativa específica.
  4. Sistema exibe cada questão com o que foi respondido, se acertou, a resposta correta e a explicação.
- **Regras relacionadas:** RN36, RN01

## UC29 — Compartilhar deck via link público

- **Ator:** Estudante (dono do deck)
- **Objetivo:** Permitir que qualquer pessoa, mesmo sem conta, visualize os flashcards de um deck através de um link, sem poder editá-lo ou duplicá-lo.
- **Pré-condições:** Deck pertence ao usuário autenticado (RN01).
- **Fluxo principal:**
  1. Estudante abre um deck e escolhe "Compartilhar".
  2. Sistema gera um token único e devolve o link público correspondente.
  3. Estudante envia o link para quem quiser.
  4. Qualquer pessoa que acesse o link vê o título, a descrição e os flashcards do deck, em modo somente leitura, sem precisar autenticar (RN37).
- **Fluxos alternativos:** A1 — deck já possui um link ativo → sistema devolve o mesmo status; gerar novamente regenera o token, invalidando o anterior (RN38). A2 — dono desativa o compartilhamento → o link deixa de funcionar imediatamente.
- **Fluxos de exceção:** E1 — token inexistente ou desativado → 404, sem distinguir os dois casos.
- **Regras relacionadas:** RN37, RN38, RN01

## UC17 — Cadastro com nome de usuário (extensão de UC01)

- **Ator:** Estudante
- **Objetivo:** Registrar-se com identidade pública própria (nomeUsuario), além do e-mail.
- **Fluxo principal:** Mesmo fluxo de UC01, com o campo `nomeUsuario` adicional, validado quanto a formato e unicidade (RN22).
- **Fluxos de exceção:** E2 — nome de usuário já em uso → 409.
- **Regras relacionadas:** RN22, RN23

## UC18 — Esqueci/Redefinir senha

- **Ator:** Estudante
- **Objetivo:** Recuperar acesso à conta em caso de esquecimento de senha.
- **Fluxo principal:**
  1. Estudante informa o e-mail.
  2. Sistema gera token de uso único (1h), se o e-mail existir.
  3. Sistema envia por e-mail (ou loga em modo desenvolvimento).
  4. Sistema responde com mensagem genérica, independente de o e-mail existir (RN24).
  5. Estudante informa token + nova senha.
  6. Sistema valida o token e atualiza a senha.
- **Fluxos de exceção:** E1 — token inválido/expirado/usado → 400.
- **Regras relacionadas:** RN24

## UC19 — Editar perfil

- **Ator:** Estudante
- **Objetivo:** Atualizar nome de exibição e/ou nome de usuário.
- **Fluxo principal:** Estudante edita nome e/ou nomeUsuario; sistema valida unicidade (RN22) e persiste.
- **Fluxos de exceção:** E1 — novo nomeUsuario já em uso → 409.
- **Regras relacionadas:** RN22

## UC20 — Visualizar dashboard geral consolidado

- **Ator:** Estudante
- **Objetivo:** Ter uma visão única de todo o progresso no sistema, não limitada a um deck específico.
- **Fluxo principal:**
  1. Estudante acessa o dashboard geral.
  2. Sistema agrega dados de todos os decks do usuário.
  3. Sistema calcula o streak de dias consecutivos de estudo.
  4. Sistema exibe ranking de decks por desempenho.
- **Regras relacionadas:** RN25

## UC21 — Verificar e-mail de cadastro

- **Ator:** Estudante
- **Objetivo:** Confirmar a posse real do e-mail informado no cadastro.
- **Fluxo principal:**
  1. Ao se cadastrar, sistema gera token de verificação (24h) e envia por e-mail (ou loga em dev).
  2. Estudante acessa o link/token.
  3. Sistema valida e marca `emailVerificado=true`.
  4. Estudante pode logar normalmente.
- **Fluxos alternativos:** A1 — login antes de verificar → 403, com opção de reenviar token.
- **Fluxos de exceção:** E1 — token inválido/expirado → mensagem clara.
- **Regras relacionadas:** RN26

## UC22 — Excluir material de origem

- **Ator:** Estudante
- **Objetivo:** Remover um PDF enviado que não é mais necessário.
- **Fluxo principal:**
  1. Estudante seleciona excluir um material.
  2. Sistema pede confirmação (frontend).
  3. Sistema aplica RN01.
  4. Sistema remove registro e arquivo físico.
- **Regras relacionadas:** RN01, RN29

## UC23 — Aceitar termos de uso no cadastro (extensão de UC01/UC17)

- **Ator:** Estudante
- **Objetivo:** Formalizar o consentimento do usuário para tratamento de dados pessoais (LGPD).
- **Fluxo principal:** No cadastro, o estudante marca aceite dos termos antes de submeter; sistema rejeita sem essa marcação; ao aceitar, registra versão do termo e timestamp.
- **Regras relacionadas:** RN30

## UC24 — Exportar meus dados

- **Ator:** Estudante
- **Objetivo:** Obter cópia estruturada de todos os próprios dados (LGPD, acesso/portabilidade).
- **Fluxo principal:** Estudante solicita exportação; sistema monta objeto com perfil, decks, flashcards, revisões, quizzes e tentativas; retorna JSON completo.
- **Regras relacionadas:** RN31

## UC25 — Excluir conta permanentemente

- **Ator:** Estudante
- **Objetivo:** Exercer o direito ao esquecimento (LGPD).
- **Fluxo principal:**
  1. Estudante solicita exclusão da conta.
  2. Sistema exige confirmação (senha atual).
  3. Sistema valida a senha.
  4. Sistema remove permanentemente usuário e dados em cascata.
- **Fluxos de exceção:** E1 — senha incorreta → 401, nada excluído.
- **Regras relacionadas:** RN32

## UC26 — Trocar senha (autenticado)

- **Ator:** Estudante
- **Objetivo:** Alterar a própria senha por escolha, sem tê-la esquecido.
- **Fluxo principal:** Estudante informa senha atual e nova senha; sistema valida a atual e a força da nova (RN27); atualiza o hash.
- **Fluxos de exceção:** E1 — senha atual incorreta → erro claro.
- **Regras relacionadas:** RN33, RN27
