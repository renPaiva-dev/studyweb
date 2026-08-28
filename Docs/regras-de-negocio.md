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
| RNF03 | Segurança | Todas as rotas, exceto cadastro/login, exigem token JWT válido. |
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
