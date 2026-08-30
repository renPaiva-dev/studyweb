# Extensão de Escopo — Conta/Perfil (QoL) e Dashboard Geral Consolidado

Duas frentes independentes uma da outra, mas cada uma reforça a
sensação de "sistema real": (F+G+H) tratam de identidade e conta do
usuário; (I) trata de uma visão consolidada de todo o uso do sistema,
não mais só por deck individual.

```
F. Conta e Perfil (username, papel, editar perfil) — independente
   └─> G. Esqueci/Redefinir senha — depende de F (mesmo cluster de conta)
H. Tema escuro (frontend) — independente de tudo
I. Dashboard Geral consolidado — independente, usa lógica já existente
```

Ordem sugerida: **F → G → I → H** (H por último porque é só frontend,
não depende de nada no backend e pode ser feito a qualquer momento
entre uma etapa e outra, inclusive em paralelo).

---

## F. Conta e Perfil — Username, Papel, Edição (extensão de UC01)

### Novas Regras de Negócio

| Cód. | Descrição |
|---|---|
| RN22 | Todo usuário possui um nome de usuário (`nomeUsuario`), único no sistema, além do e-mail (RN02) e do nome de exibição. O `nomeUsuario` é o identificador público mostrado nas telas do sistema — o e-mail nunca é exibido a outros usuários, apenas ao próprio dono da conta. |
| RN23 | Todo usuário possui um papel (`papel`) que determina suas permissões no sistema. Nesta versão, todo usuário cadastrado recebe o papel padrão `ESTUDANTE`. A estrutura já é preparada (enum extensível) para suportar papéis adicionais (ex.: `ADMIN`) em versões futuras, sem necessidade de nova migração de schema além do enum. |

### Casos de Uso

**UC17 — Cadastro com nome de usuário (extensão de UC01)**
- **Ator:** Estudante
- **Objetivo:** Registrar-se com identidade pública própria (nomeUsuario), além do e-mail.
- **Pré-condições:** Nenhuma.
- **Pós-condições:** Usuário criado com `nomeUsuario` único e `papel=ESTUDANTE`.
- **Fluxo principal:** Mesmo fluxo de UC01, com o campo `nomeUsuario` adicional, validado quanto a formato (alfanumérico, sem espaços, 3-30 caracteres) e unicidade (RN22).
- **Exceções:** E2 — nome de usuário já em uso → 409, mensagem específica diferenciando do erro de e-mail duplicado.
- **Regras relacionadas:** RN22, RN23

**UC19 — Editar perfil**
- **Ator:** Estudante
- **Objetivo:** Atualizar nome de exibição e/ou nome de usuário da própria conta.
- **Pré-condições:** Usuário autenticado.
- **Pós-condições:** Dados atualizados.
- **Fluxo principal:** Estudante acessa a tela de perfil, edita nome e/ou nomeUsuario, sistema valida unicidade (RN22) e persiste.
- **Exceções:** E1 — novo nomeUsuario já em uso por outro usuário → 409.
- **Regras relacionadas:** RN22

Alteração de e-mail e senha ficam fora deste escopo — e-mail é o
identificador de login (mudar exigiria reautenticação/verificação, mais
complexidade do que vale agora); troca de senha autenticado (diferente
de "esqueci senha") pode ser um item futuro simples de se adicionar
depois, reaproveitando o mesmo `PasswordEncoder` já existente.

### Extensão do Modelo de Dados

Adicionar à entidade USUARIO:

| Atributo | Tipo | Restrições |
|---|---|---|
| nome_usuario | VARCHAR(30) | NOT NULL, UNIQUE |
| papel | VARCHAR(20) | NOT NULL, DEFAULT 'ESTUDANTE' |

Migration `V5__adicionar_username_papel_usuario.sql`:
```sql
ALTER TABLE usuario ADD COLUMN nome_usuario VARCHAR(30);
ALTER TABLE usuario ADD COLUMN papel VARCHAR(20) NOT NULL DEFAULT 'ESTUDANTE';
-- nome_usuario começa nullable para não quebrar dados de teste já
-- existentes; se o banco for recriado do zero (recomendado em dev),
-- pode-se aplicar NOT NULL diretamente. Ver nota no prompt.
```

### Extensão do Contrato de API

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/auth/cadastro` (**) | `{ nome, nomeUsuario, email, senha }` | `201` — `{ id, nome, nomeUsuario, email, papel, criadoEm }` | `400` · `409` (e-mail OU nomeUsuario duplicado — RN02/RN22) |
| GET | `/api/usuario/perfil` | — | `200` — `{ id, nome, nomeUsuario, email, papel, criadoEm }` | `401` |
| PUT | `/api/usuario/perfil` | `{ nome, nomeUsuario }` | `200` — perfil atualizado | `400` · `401` · `409` (nomeUsuario em uso) |

### Prompt de Implementação

```
Leia docs/regras-de-negocio.md (RN22, RN23), docs/casos-de-uso.md
(UC17, UC19) e docs/contrato-api.md antes de continuar. Isso estende
o UC01 já implementado — não quebre cadastro/login existentes; os
testes de UsuarioServiceTest e AuthController já existentes devem
continuar passando (ajustados apenas para incluir o novo campo
obrigatório nos DTOs de teste).

1. Crie a migration V5__adicionar_username_papel_usuario.sql (coluna
   nome_usuario nullable inicialmente, papel com default ESTUDANTE).
   Como o banco de desenvolvimento pode ser recriado do zero sem
   perda de dados reais, prefira, se for mais simples, já deixar
   nome_usuario NOT NULL diretamente na migration — decida e
   justifique brevemente qual caminho seguiu.

2. Adicione um enum PapelUsuario (ESTUDANTE, ADMIN — mesmo que ADMIN
   não tenha nenhum uso ainda) e os campos nomeUsuario/papel na
   entidade Usuario, com papel usando @Enumerated(EnumType.STRING) e
   valor padrão ESTUDANTE.

3. Adicione findByNomeUsuario ao UsuarioRepository (para validar
   unicidade, mesmo padrão de findByEmail/RN02).

4. Atualize CadastroRequestDTO para incluir nomeUsuario (@NotBlank,
   @Pattern para alfanumérico sem espaços, @Size 3-30), e
   UsuarioResponseDTO para incluir nomeUsuario e papel.

5. Atualize UsuarioService.cadastrar para validar unicidade de
   nomeUsuario (RN22) da mesma forma que já valida e-mail (RN02),
   lançando uma exceção específica (NomeUsuarioJaCadastradoException,
   409) diferente da de e-mail duplicado.

6. Novo pacote/controller para perfil (ou dentro do pacote usuario):
   GET /api/usuario/perfil (retorna os dados do usuário autenticado,
   via SecurityUtils) e PUT /api/usuario/perfil (atualiza nome e
   nomeUsuario, revalidando unicidade).

7. Testes cobrindo: cadastro com nomeUsuario duplicado (409,
   diferenciado do e-mail duplicado); edição de perfil com sucesso;
   edição com nomeUsuario já usado por outro usuário (409).

Siga docs/boas-praticas-backend.md em tudo.
```

### Teste manual
1. Cadastra um usuário novo com `nomeUsuario`, confirma resposta e
   consulta no banco.
2. Tenta cadastrar outro com o mesmo `nomeUsuario` (e-mail diferente)
   → confirma 409 específico.
3. `GET /api/usuario/perfil` com token válido → confirma dados.
4. `PUT /api/usuario/perfil` alterando o nome → confirma persistência.

---

## G. Esqueci Minha Senha / Redefinir Senha (depende de F)

### Nova Regra de Negócio

| Cód. | Descrição |
|---|---|
| RN24 | Um usuário pode solicitar redefinição de senha informando o e-mail cadastrado. O sistema gera um token de redefinição de uso único, válido por 1 hora. Por segurança (RNF03), a resposta da solicitação é sempre a mesma mensagem genérica, exista ou não o e-mail na base — evita enumeração de contas. A redefinição efetiva só ocorre mediante token válido, não expirado e não utilizado anteriormente. |

### Caso de Uso

**UC18 — Esqueci/Redefinir senha**
- **Ator:** Estudante
- **Objetivo:** Recuperar acesso à conta em caso de esquecimento de senha.
- **Pré-condições:** Conta previamente cadastrada.
- **Pós-condições:** Senha alterada (se token válido) ou nada acontece de observável (se e-mail não existir — RN24).
- **Fluxo principal:**
  1. Estudante informa o e-mail na tela "esqueci minha senha".
  2. Sistema gera um token de uso único (válido por 1h) associado ao usuário, se o e-mail existir.
  3. Sistema envia o token por e-mail (ou registra em log, em ambiente de desenvolvimento sem SMTP configurado — ver nota técnica no prompt).
  4. Sistema responde com mensagem genérica, independente de o e-mail existir (RN24).
  5. Estudante acessa o link/token recebido e informa a nova senha.
  6. Sistema valida o token (existe, não expirado, não usado) e atualiza a senha (mesmo BCrypt já usado em UC01), marcando o token como usado.
- **Fluxos de exceção:** E1 — token inválido/expirado/já usado → 400, mensagem clara.
- **Regras relacionadas:** RN24

### Extensão do Modelo de Dados

Nova tabela TOKEN_REDEFINICAO_SENHA:

| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| usuario_id | BIGINT | NOT NULL, FK → USUARIO(id) |
| token | VARCHAR(64) | NOT NULL, UNIQUE |
| expira_em | TIMESTAMP | NOT NULL |
| usado | BOOLEAN | NOT NULL, DEFAULT FALSE |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |

Migration `V6__criar_token_redefinicao_senha.sql`.

### Extensão do Contrato de API

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/auth/esqueci-senha` (**) | `{ email }` | `200` — `{ mensagem: "Se o e-mail existir em nossa base, você receberá instruções de redefinição." }` (sempre a mesma, RN24) | `400` (e-mail mal formatado) |
| POST | `/api/auth/redefinir-senha` (**) | `{ token, novaSenha }` | `200` — `{ mensagem: "Senha redefinida com sucesso." }` | `400` (token inválido/expirado/usado) |

### Prompt de Implementação

```
Leia docs/regras-de-negocio.md (RN24), docs/casos-de-uso.md (UC18) e
docs/contrato-api.md antes de continuar.

1. Crie a migration V6__criar_token_redefinicao_senha.sql com a
   tabela conforme docs/modelo-de-dados.md (seção desta extensão).

2. Entidade TokenRedefinicaoSenha + repository com
   findByTokenAndUsadoFalse.

3. No pom.xml, adicione spring-boot-starter-mail.

4. Configure application.properties com propriedades de SMTP via
   variáveis de ambiente (MAIL_HOST, MAIL_PORT, MAIL_USERNAME,
   MAIL_PASSWORD), SEM valores reais. IMPORTANTE: implemente de forma
   que, se as variáveis de e-mail não estiverem configuradas (valor
   vazio/ausente), o sistema NÃO tente enviar e-mail de verdade —
   em vez disso, registre o token gerado em log (nível INFO, claramente
   marcado como "MODO DESENVOLVIMENTO — sem envio real de e-mail"),
   permitindo testar o fluxo completo sem precisar de conta SMTP real.
   Isole essa decisão em um EmailService com um método simples
   enviarEmail(destinatario, assunto, corpo) que decide internamente
   entre enviar de verdade ou logar, baseado na configuração.

5. PasswordResetService (pacote usuario) com:
   - solicitarRedefinicao(email): busca o usuário (se não existir,
     não faz nada, mas a resposta ao chamador é idêntica de qualquer
     forma — RN24); gera um token aleatório seguro (ex.:
     UUID.randomUUID() ou SecureRandom), salva com expiração de 1
     hora; chama EmailService.
   - redefinirSenha(token, novaSenha): busca o token, valida que
     existe, não expirou e não foi usado; atualiza a senha do
     usuário (BCrypt, mesmo padrão de UsuarioService); marca o token
     como usado.

6. Endpoints POST /api/auth/esqueci-senha e POST
   /api/auth/redefinir-senha (sem autenticação, mesmo padrão de
   cadastro/login).

7. Testes cobrindo: solicitação com e-mail existente (token gerado);
   solicitação com e-mail inexistente (mesma resposta, nenhum token
   gerado, sem erro); redefinição com token válido (senha alterada);
   token expirado (400); token já usado (400); token inexistente
   (400).

Siga docs/boas-praticas-backend.md em tudo — atenção especial a nunca
logar a nova senha em texto plano, apenas o token (que por si só não
compromete a senha).
```

### Teste manual
1. Sem configurar `MAIL_*`, chama `POST /api/auth/esqueci-senha` com um
   e-mail existente → confirma resposta genérica, e localiza o token no
   log do backend (modo desenvolvimento).
2. Usa esse token em `POST /api/auth/redefinir-senha` com nova senha →
   confirma sucesso, e testa login com a senha nova.
3. Tenta reutilizar o mesmo token → confirma 400.
4. Chama `esqueci-senha` com e-mail que não existe → confirma mesma
   resposta genérica do passo 1 (nenhuma forma de diferenciar de fora).

---

## H. Tema Escuro (frontend, independente)

Sem RN/UC de backend — é puramente de interface. Prompt direto:

```
Leia docs/boas-praticas-frontend.md antes de continuar.

Implemente suporte a tema escuro em todo o frontend:

1. Configure o Tailwind para dark mode via classe (darkMode: 'class'
   no tailwind.config.js), não via media query — isso permite alternar
   manualmente, independente da preferência do sistema operacional.

2. Crie um ThemeContext (src/context/ThemeContext.tsx) com o estado do
   tema (light/dark), persistido em localStorage, e um hook useTheme().
   Ao carregar a aplicação, respeita a preferência salva; se não houver
   nenhuma, usa a preferência do sistema operacional (prefers-color-scheme)
   como padrão inicial.

3. Adicione um botão de alternância (ícone sol/lua) no Layout
   compartilhado, visível em todas as telas autenticadas e também nas
   telas de login/cadastro.

4. Revise TODOS os componentes e páginas já existentes, adicionando as
   variantes dark: do Tailwind (cores de fundo, texto, bordas) — não
   deixe nenhuma tela "quebrada" no tema escuro (texto escuro em fundo
   escuro, por exemplo). Preste atenção especial em: badges de status
   (PROCESSADO/ERRO/dominado/em risco — as cores precisam continuar
   com bom contraste e significado claro nos dois temas), gráficos do
   dashboard, e o card de flashcard na tela de estudo.

Teste visualmente cada tela nos dois temas antes de finalizar.
```

### Teste manual
Alterna o tema em cada tela do sistema (login, decks, deck detalhe,
estudo, dashboard, quiz, perfil) e confirma legibilidade e contraste
em ambos.

---

## I. Dashboard Geral Consolidado (independente)

### Nova Regra de Negócio

| Cód. | Descrição |
|---|---|
| RN25 | O sistema deve oferecer uma visão agregada de todo o uso do usuário autenticado, consolidando dados de todos os seus decks: total de decks, total de flashcards, percentual geral de dominado/em risco (média ponderada entre todos os decks, mesmo critério de RN14), total de tentativas de quiz/prova respondidas e pontuação média, sequência de dias consecutivos de estudo ("streak", contando dias com pelo menos uma revisão registrada), e um ranking dos decks por desempenho (melhor e pior percentual dominado). |

### Caso de Uso

**UC20 — Visualizar dashboard geral consolidado**
- **Ator:** Estudante
- **Objetivo:** Ter uma visão única de todo o progresso no sistema, não limitada a um deck específico.
- **Pré-condições:** Usuário autenticado (pode ter zero ou mais decks).
- **Pós-condições:** Métricas consolidadas exibidas.
- **Fluxo principal:**
  1. Estudante acessa a tela inicial/dashboard geral (ex.: ao fazer login).
  2. Sistema agrega os dados de todos os decks do usuário (reaproveitando a lógica já existente de RN14/RN20 por deck, agora somada).
  3. Sistema calcula o streak de dias consecutivos com pelo menos uma revisão.
  4. Sistema exibe o ranking de decks por desempenho.
- **Regras relacionadas:** RN25

### Extensão do Contrato de API

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| GET | `/api/usuario/dashboard-geral` | — | `200` — `{ totalDecks, totalFlashcards, percentualDominadoGeral, percentualEmRiscoGeral, totalTentativasQuiz, pontuacaoMediaQuiz, streakDias, decks: [ { deckId, titulo, percentualDominado, percentualEmRisco } ] }` (decks ordenados por percentualDominado desc) | `401` |

Não precisa de `{id}` no path — é sempre relativo ao usuário autenticado
(via `SecurityUtils`), diferente de todos os outros endpoints de
dashboard que são por deck.

### Prompt de Implementação

```
Leia docs/regras-de-negocio.md (RN25), docs/casos-de-uso.md (UC20) e
docs/contrato-api.md antes de continuar. Reaproveite ao máximo a
lógica já existente em DashboardService (RN14) — este endpoint agrega
a mesma lógica por deck, somada para todos os decks do usuário, não
duplica os critérios de dominado/em risco.

1. No pacote dashboard, adicione um método
   DashboardGeralService.obterDashboardGeral() (ou método novo no
   DashboardService existente, decida pela coesão):
   - Obtém o usuário autenticado (SecurityUtils)
   - Busca todos os decks do usuário (DeckRepository.findByUsuarioId
     já existente)
   - Para cada deck, reaproveita a mesma lógica de cálculo de
     dominado/em risco já existente (não reimplemente a regra)
   - Agrega: total de decks, total de flashcards, percentual geral
     (média ponderada pelo total de flashcards de cada deck, não
     média simples entre decks)
   - Busca o total de tentativas de quiz (TentativaQuizRepository) e
     a pontuação média entre todas
   - Calcula o streak: conte, a partir de hoje retrocedendo, quantos
     dias consecutivos têm pelo menos uma RevisaoFlashcard do usuário
     (em qualquer deck), parando no primeiro dia sem nenhuma revisão
   - Monta o ranking de decks (lista ordenada por percentualDominado
     desc)

2. Endpoint GET /api/usuario/dashboard-geral (pacote dashboard,
   controller novo ou reaproveitando DashboardController — decida).

3. Testes cobrindo: usuário sem nenhum deck (retorna zeros, sem
   erro); usuário com múltiplos decks (agregação correta, streak
   calculado corretamente com revisões em dias consecutivos e com uma
   lacuna quebrando o streak); ranking ordenado corretamente.

Siga docs/boas-praticas-backend.md em tudo. Cuidado com N+1 ao
calcular por deck — prefira uma consulta agregada ou poucas consultas
bem desenhadas a um loop com uma query por deck.
```

### Teste manual
1. Usuário com 2-3 decks de dados variados → `GET
   /api/usuario/dashboard-geral` → confirma agregação e ranking.
2. Cria revisões em dias consecutivos (ajustando `data_revisao` no
   banco, como fizemos para testar a evolução temporal) → confirma o
   streak calculado corretamente, incluindo o caso de quebrar o
   streak com um dia sem revisão no meio.
3. Usuário novo, sem nenhum deck → confirma resposta com zeros, sem
   erro 500.

---

## Resumo do que isso adiciona à narrativa do TCC

Com F+G+H+I implementados, o sistema ganha o que faltava para "parecer
real": identidade de usuário completa (username, perfil, recuperação
de senha — indistinguível de qualquer produto SaaS real), tema escuro
(expectativa padrão de qualquer aplicação moderna), e uma visão
consolidada que trata o usuário como alguém com múltiplos decks e um
histórico de uso ao longo do tempo, não uma sequência de telas isoladas
por deck. Isso reforça a percepção de maturidade do produto na
demonstração para a banca, sem adicionar nenhuma dependência de
infraestrutura pesada (o e-mail tem fallback de log para não exigir
conta SMTP real durante o desenvolvimento/demonstração).
