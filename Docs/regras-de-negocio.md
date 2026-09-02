# Requisitos e Regras de Negócio

## Atores

| Ator | Descrição |
|---|---|
| Estudante | Ator primário. Cria decks, envia PDFs, revisa sugestões da IA, estuda com repetição espaçada e acompanha progresso. |
| Serviço de IA (externo) | API de LLM (ex.: Gemini) acionada pelo backend para gerar flashcards a partir de texto. Não interage diretamente com o estudante. |
| Sistema (interno) | Processos automáticos do backend (recálculo SM-2, validação de JSON retornado pela IA). |

## Requisitos Funcionais (RF)

| Cód. | Descrição | Caso de uso |
|---|---|---|
| RF01 | Permitir cadastro de usuário com nome, e-mail e senha. | UC01 |
| RF02 | Permitir login com autenticação via JWT. | UC01 |
| RF03 | Permitir criar, listar, editar e excluir decks de estudo. | UC02 |
| RF04 | Permitir upload de um arquivo PDF vinculado a um deck. | UC03 |
| RF05 | Extrair o texto do PDF enviado e armazená-lo. | UC03 |
| RF06 | Gerar flashcards automaticamente a partir do texto extraído, via IA externa. | UC04 |
| RF07 | Exibir tela de revisão das sugestões da IA (aceitar/editar/descartar) antes de persistir. | UC04/UC05 |
| RF08 | Permitir criação e edição manual de flashcards. | UC05 |
| RF09 | Permitir associar um mnemônico textual a um flashcard. | UC06 |
| RF10 | Montar fila diária de estudo com flashcards de revisão vencida. | UC07 |
| RF11 | Permitir avaliação da resposta numa escala de 0 a 5. | UC08 |
| RF12 | Recalcular fator de facilidade, intervalo, repetições e próxima revisão via SM-2. | UC09 |
| RF13 | Gerar quiz de múltipla escolha a partir do deck (extensão de escopo). | UC10 |
| RF14 | Registrar tentativas de quiz e calcular pontuação (extensão de escopo). | UC10 |
| RF15 | Exibir dashboard de progresso por deck (% dominado, % em risco). | UC11 |
| RF16 | Registrar log de cada chamada à API de IA (status + timestamp). | — |

## Requisitos Não Funcionais (RNF)

| Cód. | Categoria | Descrição |
|---|---|---|
| RNF01 | Desempenho | Geração via IA deve responder em < 15s em 90% dos casos, para PDFs de até 15 páginas. |
| RNF02 | Segurança | Senhas armazenadas com hash (bcrypt), nunca em texto plano. |
| RNF03 | Segurança | Todas as rotas exigem token JWT válido, exceto as explicitamente públicas: cadastro, login, recuperação de senha, health-check e o acesso a deck compartilhado por link (RN37). |
| RNF04 | Usabilidade | Interface responsiva (desktop e mobile). |
| RNF05 | Portabilidade | Backend deve permitir trocar o provedor de IA sem alterações estruturais relevantes (via abstração). |
| RNF06 | Confiabilidade | Falhas na API de IA não devem impedir o uso das demais funcionalidades (RN07). |
| RNF07 | Custo/Escalabilidade | Operar dentro dos limites de cota gratuita dos provedores de IA. |
| RNF08 | Manutenibilidade | Backend em arquitetura de camadas (controller/service/repository). |
| RNF09 | Disponibilidade | Ambiente de demonstração acessível via link público durante a avaliação do TCC. |

## Regras de Negócio (RN)

| Cód. | Descrição |
|---|---|
| RN01 | Um usuário só pode acessar seus próprios decks, flashcards, uploads e histórico de revisão. |
| RN02 | O e-mail de cadastro deve ser único no sistema. |
| RN03 | Todo flashcard pertence a exatamente um deck; todo deck pertence a exatamente um usuário. |
| RN04 | Um flashcard pode ser MANUAL ou gerado por IA; o campo `origem` registra essa distinção. |
| RN05 | Flashcards gerados por IA devem passar por revisão/edição do usuário antes de serem confirmados. |
| RN06 | Apenas arquivos PDF são aceitos, com tamanho máximo (ex.: 15 MB). |
| RN07 | Se a extração de texto falhar ou for insuficiente, o sistema não deve chamar a API de IA. |
| RN08 | A geração de flashcards por IA é limitada a um máximo por chamada (ex.: 15). |
| RN09 | Toda revisão recalcula `intervalo_dias`, `repeticoes`, `fator_facilidade` e `proxima_revisao` via SM-2, com base na qualidade (0-5). |
| RN10 | Um flashcard só aparece na fila do dia quando `proxima_revisao <= hoje` (ou é a primeira revisão). |
| RN11 | Qualidade < 3 zera `repeticoes` e reinicia o intervalo. |
| RN12 | O fator de facilidade (EF) nunca é menor que 1,3. |
| RN13 | Excluir um deck exige confirmação e remove em cascata flashcards, materiais e histórico. |
| RN14 | Dashboard calcula, por deck, % "dominado" (repeticoes >= 3 e última qualidade >= 4). Um flashcard é considerado "em risco" quando sua última `qualidade_resposta` for menor que 3 (mesmo limiar de RN11) OU quando `proxima_revisao` estiver vencida há mais de 7 dias. Um flashcard nunca revisado não conta nem como dominado nem como em risco. |
| RN15 | Um quiz só pode ser respondido integralmente; tentativas parciais não geram pontuação. |
| RN16 | Toda chamada à API de IA é registrada em log (timestamp + status). |
| RN17 | Todo flashcard gerado por IA (origem=IA) deve receber, no mesmo processo de geração (UC04), uma classificação de tópico curta (até 60 caracteres) extraída do conteúdo da pergunta/resposta. Flashcards manuais (origem=MANUAL) têm o campo `topico` opcional. |
| RN18 | A recomendação de foco de estudo é gerada sob demanda (não persistida). O sistema identifica o(s) tópico(s) com maior concentração de flashcards "em risco" (critério de RN14) e, havendo dados suficientes, gera uma sugestão textual curta via IA. Sem dados suficientes, retorna mensagem padrão sem chamar a IA. |
| RN19 | Quando o estudante solicita explicação de um flashcard, a explicação deve ser gerada via IA ancorada no texto extraído do material de origem daquele flashcard, quando disponível (não em conhecimento genérico do modelo). Sem material associado, a explicação é gerada sem ancoragem, sinalizando isso na resposta (`ancoradaNoMaterial: false`). |
| RN20 | Além dos indicadores agregados de RN14, o dashboard deve oferecer: evolução temporal do desempenho (média de qualidade por dia, período configurável), detalhamento de % dominado/em risco por tópico (RN17), os N flashcards mais revisados do deck, e distribuição de revisões por dia da semana. |
| RN21 | ~~Uma prova personalizada é gerada via IA, priorizando os tópicos com maior concentração de flashcards em risco (RN14/RN18).~~ **Substituída por RN35** — a seleção automática por tópico em risco foi trocada por seleção manual de flashcards pelo próprio usuário, mantendo o restante (questões originais, RN15). |
| RN22 | Todo usuário possui um nome de usuário (`nomeUsuario`), único no sistema, além do e-mail (RN02). É o identificador público mostrado nas telas — o e-mail nunca é exibido a outros usuários. |
| RN23 | Todo usuário possui um papel (`papel`) determinando suas permissões. Nesta versão, todo usuário cadastrado recebe o papel padrão `ESTUDANTE`, com estrutura preparada para papéis adicionais futuros. |
| RN24 | Um usuário pode solicitar redefinição de senha via e-mail. O sistema gera um token de uso único, válido por 1 hora. A resposta da solicitação é sempre a mesma mensagem genérica, exista ou não o e-mail na base (evita enumeração de contas). |
| RN25 | O sistema oferece uma visão agregada de todo o uso do usuário: total de decks, total de flashcards, percentual geral de dominado/em risco (média ponderada), total de tentativas de quiz/prova e pontuação média, sequência de dias consecutivos de estudo (streak), e ranking de decks por desempenho. |
| RN26 | Toda conta criada permanece com `emailVerificado=false` até que o usuário confirme a posse do e-mail informado, através de um token enviado por e-mail. Login com conta não verificada retorna erro específico (403), com opção de reenviar o token. |
| RN27 | A senha deve ter entre 8 e 64 caracteres, contendo ao menos uma letra maiúscula, uma minúscula, um dígito e um caractere especial. Aplica-se ao cadastro (UC01) e à redefinição de senha (UC18). |
| RN29 | Um material de origem (PDF) pode ser excluído pelo usuário a qualquer momento. A exclusão remove o registro e o arquivo físico, sem afetar flashcards já confirmados (que não mantêm vínculo individual com o material de origem). |
| RN30 | O aceite dos termos de uso e política de privacidade é obrigatório no cadastro (LGPD, consentimento). O sistema registra a versão do termo e o timestamp do aceite. |
| RN31 | O usuário tem direito de exportar todos os seus dados pessoais (LGPD, acesso/portabilidade) em formato estruturado (JSON): perfil, decks, flashcards, revisões, quizzes, tentativas. |
| RN32 | O usuário tem direito de excluir permanentemente sua conta e todos os dados associados (LGPD, direito ao esquecimento). Exige reautenticação (senha), é irreversível, e remove em cascata todos os dados vinculados. Tokens JWT já emitidos permanecem válidos até expiração natural (limitação documentada). |
| RN33 | Um usuário autenticado pode alterar a própria senha informando a senha atual, diferente do fluxo de recuperação por esquecimento (RN24). Segue a mesma política de força de RN27. |
| RN34 | A unicidade do nome de usuário (RN22) é verificada de forma case-insensitive. O valor é armazenado com a capitalização original, mas comparado sempre em minúsculas. |
| RN35 | O usuário pode gerar uma prova personalizada via IA (aba "Provas") selecionando manualmente um ou mais flashcards de um deck como base de conteúdo, e escolhendo um estilo de prova (ENEM, Vestibular ou Conhecimentos Gerais), que orienta o tom/formato das questões geradas. As questões são inéditas — não repetem literalmente a pergunta/resposta dos flashcards selecionados, apenas o tema — e cada questão traz uma explicação da resposta correta, revelada somente após a questão ser respondida. RN15 aplica-se igualmente (só pontua se todas as questões forem respondidas). Substitui RN21. |
| RN36 | O usuário pode consultar o histórico de todas as provas (determinísticas de UC10 e personalizadas de RN35) que já respondeu, mais recentes primeiro, e o detalhe de cada tentativa: questão a questão, com a alternativa escolhida, se acertou, a resposta correta e a explicação (quando houver). |
| RN37 | O dono de um deck pode gerar um link público de compartilhamento, identificado por um token único. Quem acessa o link, mesmo sem conta, vê o deck (título, descrição e flashcards) em modo somente leitura — não pode editar, excluir nem duplicar o deck, e o acesso não passa por RN01 (é público por token, não por dono). Um token inexistente ou desativado responde 404, sem distinguir os dois casos (evita enumeração). |
| RN38 | Cada deck tem no máximo um link de compartilhamento ativo por vez. O dono pode desativá-lo a qualquer momento, invalidando o acesso imediatamente. Gerar um novo link após desativado (ou reativar) sempre cria um token novo, invalidando qualquer token anterior. |
| RN39 | Uma vez por dia, o sistema envia um e-mail de lembrete a cada usuário que tenha ao menos um flashcard pendente de revisão (mesmo critério de RN10), resumindo a quantidade por deck. Usuários sem pendências não recebem e-mail nesse job. Independentemente disso, o usuário pode disparar manualmente o envio do próprio lembrete a qualquer momento (recebendo o e-mail mesmo sem pendências), para conferir o conteúdo. |
