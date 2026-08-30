# Extensão de Escopo — Conformidade LGPD e Itens Pendentes de Conta

Cobre os quatro pilares da LGPD relevantes para este sistema
(consentimento, acesso/portabilidade, eliminação, segurança — a
segurança já está coberta por RN01/RN02/RN26/RN27 e não é repetida
aqui), além de dois itens pendentes: troca de senha autenticada e
correção de case-sensitivity de nome de usuário.

```
P. Aceite de termos no cadastro (RN30, UC23) — independente
Q. Exportar meus dados (RN31, UC24) — independente
R. Excluir conta permanentemente (RN32, UC25) — depende de cascata de Usuario (nova, ver migration)
S. Trocar senha autenticado (RN33, UC26) — independente
T. Nome de usuário case-insensitive (RN34) — correção pontual sobre RN22
```

Ordem sugerida: **T → P → S → Q → R** (R por último porque é a mais
sensível — exclusão irreversível — e se beneficia de tudo o resto já
estar estável).

---

## T. Nome de Usuário Case-Insensitive (RN34, correção sobre RN22)

### Nova Regra de Negócio

| Cód. | Descrição |
|---|---|
| RN34 | A unicidade do nome de usuário (RN22) é verificada de forma case-insensitive — "Renato" e "renato" são considerados o mesmo nome de usuário para fins de cadastro/edição, evitando confusão visual entre contas. O valor é armazenado com a capitalização original informada pelo usuário (preservada para exibição), mas comparado sempre em minúsculas internamente. |

### Prompt

```
Leia docs/regras-de-negocio.md (RN22, RN34) antes de continuar.

1. Ajuste UsuarioRepository.findByNomeUsuario para comparação
   case-insensitive (ex.: query JPQL com
   WHERE LOWER(nomeUsuario) = LOWER(:nomeUsuario), ou
   findByNomeUsuarioIgnoreCase do Spring Data, que gera isso
   automaticamente).

2. Aplique o mesmo ajuste em qualquer outro ponto que valide
   unicidade de nomeUsuario (edição de perfil, UC19).

3. Se a constraint UNIQUE do banco (migration anterior) não for
   naturalmente case-insensitive no Postgres (ela não é, por padrão),
   crie uma nova migration com um índice único sobre
   LOWER(nome_usuario):
   CREATE UNIQUE INDEX uk_usuario_nome_usuario_lower ON usuario (LOWER(nome_usuario));
   E remova a constraint UNIQUE simples anterior, se existir, para
   não ficarem duas validações conflitantes.

4. Teste: cadastrar "Renato" e depois tentar cadastrar "renato" (ou
   "RENATO") → confirma 409 nos dois casos.

Siga docs/boas-praticas-backend.md em tudo.
```

### Teste manual
Cadastra `TesteUser`, tenta cadastrar `testeuser` → confirma 409.

---

## P. Aceite de Termos de Uso (RN30, UC23)

### Nova Regra de Negócio

| Cód. | Descrição |
|---|---|
| RN30 | O aceite dos termos de uso e da política de privacidade é obrigatório no cadastro (LGPD, base legal de consentimento). O sistema registra a versão do termo aceito e o timestamp do aceite, para fins de auditoria de consentimento. Cadastro sem esse aceite é rejeitado. |

### Caso de Uso

**UC23 — Aceitar termos de uso no cadastro (extensão de UC01/UC17)**
- **Ator:** Estudante
- **Objetivo:** Formalizar o consentimento do usuário para o tratamento de seus dados pessoais, conforme LGPD.
- **Fluxo principal:** No formulário de cadastro, o estudante marca a confirmação de leitura e aceite dos termos antes de submeter; o sistema rejeita o cadastro sem essa marcação; ao aceitar, o sistema registra a versão vigente do termo e o timestamp.
- **Regras relacionadas:** RN30

### Extensão do Modelo de Dados

Adicionar à entidade USUARIO:

| Atributo | Tipo | Restrições |
|---|---|---|
| termos_aceitos_em | TIMESTAMP | NOT NULL |
| termos_versao | VARCHAR(10) | NOT NULL |

Migration incluída em `V9` (ver seção R, que consolida as mudanças de
schema desta rodada em uma migration só, já que várias mexem na
entidade Usuario).

### Extensão do Contrato de API

`POST /api/auth/cadastro` — request body ganha o campo
`termosAceitos: boolean` (deve ser `true`, senão `400`). A versão do
termo é definida pelo backend (constante de configuração), não
enviada pelo cliente.

### Prompt

```
Leia docs/regras-de-negocio.md (RN30) e docs/casos-de-uso.md (UC23)
antes de continuar.

1. Adicione os campos termosAceitosEm (LocalDateTime) e termosVersao
   (String) à entidade Usuario (parte da migration V9 consolidada —
   ver prompt da seção R deste documento, que trata todas as mudanças
   de schema desta rodada em uma migration única).

2. Adicione o campo termosAceitos (Boolean, @AssertTrue ou validação
   manual) a CadastroRequestDTO — deve ser true, senão erro de
   validação 400 com mensagem clara ("É necessário aceitar os termos
   de uso para se cadastrar").

3. Defina a versão vigente do termo como uma constante de configuração
   (ex.: application.properties: app.termos.versao-atual=1.0), lida
   no UsuarioService.cadastrar — não confie em valor vindo do cliente
   para a versão.

4. Ao cadastrar com sucesso, preencha termosAceitosEm=now() e
   termosVersao=<valor da constante>.

5. Teste: cadastro sem termosAceitos=true é rejeitado (400); cadastro
   com termosAceitos=true persiste os dois campos corretamente.

No frontend, adicione um checkbox obrigatório no formulário de
cadastro ("Li e concordo com os Termos de Uso e a Política de
Privacidade"), com links para páginas estáticas simples de texto
(podem ser conteúdo placeholder/genérico adaptado ao projeto, já que
não é o foco jurídico do TCC, mas deve existir como página real e
referenciável) — não permita submeter o formulário sem marcar.

Siga docs/boas-praticas-backend.md em tudo.
```

### Teste manual
Tenta cadastrar sem marcar o checkbox → botão desabilitado ou erro
claro. Cadastra marcando → confirma no banco que `termos_aceitos_em`
e `termos_versao` foram preenchidos.

---

## S. Trocar Senha Autenticado (RN33, UC26)

### Nova Regra de Negócio

| Cód. | Descrição |
|---|---|
| RN33 | Um usuário autenticado pode alterar a própria senha informando a senha atual (fluxo diferente da recuperação por esquecimento, RN24 — este exige prova de conhecimento da senha atual, não um token por e-mail). A nova senha segue a mesma política de força de RN27. |

### Caso de Uso

**UC26 — Trocar senha (autenticado)**
- **Ator:** Estudante
- **Objetivo:** Alterar a própria senha por escolha, sem ter esquecido a atual.
- **Pré-condições:** Usuário autenticado.
- **Pós-condições:** Senha atualizada.
- **Fluxo principal:** Estudante informa senha atual e nova senha na tela de perfil; sistema valida a senha atual (mesmo BCrypt já usado em login) e a força da nova senha (RN27); atualiza o hash.
- **Fluxos de exceção:** E1 — senha atual incorreta → 400/401, mensagem clara sem revelar detalhes.
- **Regras relacionadas:** RN33, RN27

### Extensão do Contrato de API

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| PUT | `/api/usuario/senha` | `{ senhaAtual, novaSenha }` | `200` — mensagem de sucesso | `400` (senha atual incorreta, ou nova senha fora da política RN27) · `401` |

### Prompt

```
Leia docs/regras-de-negocio.md (RN33, RN27) e docs/casos-de-uso.md
(UC26) antes de continuar. Reaproveite a validação de senha forte
(RN27) já implementada, e o PasswordEncoder já existente — não
duplique lógica.

1. No UsuarioService, adicione o método trocarSenha(senhaAtual,
   novaSenha):
   - Obtém o usuário autenticado (SecurityUtils)
   - Valida senhaAtual com passwordEncoder.matches contra o hash
     armazenado — se não bater, lança exceção (400, mensagem "Senha
     atual incorreta")
   - Valida novaSenha com a mesma anotação/regra de RN27
   - Atualiza o hash da senha

2. Endpoint PUT /api/usuario/senha (pacote usuario, autenticado).

3. Teste: troca com sucesso; senha atual incorreta (rejeitada); nova
   senha fora da política (rejeitada, reaproveitando a validação de
   RN27).

Siga docs/boas-praticas-backend.md em tudo.
```

### Teste manual
Troca a senha pela tela de perfil → faz logout → tenta logar com a
senha antiga (deve falhar) e com a nova (deve funcionar).

---

## Q. Exportar Meus Dados (RN31, UC24 — LGPD, direito de acesso/portabilidade)

### Nova Regra de Negócio

| Cód. | Descrição |
|---|---|
| RN31 | O usuário tem direito de solicitar a exportação de todos os seus dados pessoais armazenados no sistema (LGPD, direito de acesso e portabilidade), em formato estruturado (JSON), incluindo: dados de perfil, todos os decks, flashcards, histórico de revisões, quizzes e tentativas. Dados de outros usuários nunca são incluídos (RN01 aplicada também aqui). |

### Caso de Uso

**UC24 — Exportar meus dados**
- **Ator:** Estudante
- **Objetivo:** Obter uma cópia completa e estruturada de todos os próprios dados no sistema.
- **Pré-condições:** Usuário autenticado.
- **Pós-condições:** Arquivo/resposta JSON com todos os dados do usuário.
- **Fluxo principal:** Estudante solicita a exportação; sistema aplica RN01 implicitamente (só pode exportar os próprios dados, não há parâmetro de outro usuário); sistema monta um objeto agregando perfil, decks, flashcards, revisões, quizzes e tentativas; retorna o JSON completo.
- **Regras relacionadas:** RN31

### Extensão do Contrato de API

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| GET | `/api/usuario/exportar-dados` | — | `200` — `{ perfil, decks: [ { ...deck, flashcards: [ {...flashcard, revisoes: [...] } ], materiais: [...], quizzes: [ {...quiz, tentativas: [...] } ] } ] }` | `401` |

### Prompt

```
Leia docs/regras-de-negocio.md (RN31) e docs/casos-de-uso.md (UC24)
antes de continuar.

1. Crie um ExportacaoDadosService (pacote usuario ou dashboard, decida
   pela coesão) com o método exportarDados():
   - Obtém o usuário autenticado (SecurityUtils) — a exportação é
     SEMPRE relativa a ele mesmo, não há parâmetro de usuário na
     entrada, eliminando risco de vazamento de dados de terceiros por
     design (não é preciso "validar RN01" porque a busca já parte do
     próprio usuário autenticado)
   - Monta um DTO de exportação aninhado: dados de perfil (sem
     senha_hash, é claro) + todos os decks do usuário, cada um com
     seus flashcards (incluindo mnemônico, tópico, origem), cada
     flashcard com seu histórico de revisões, cada deck com seus
     materiais (nome do arquivo, status — não precisa incluir o texto
     extraído completo, que pode ser muito grande; inclua um resumo
     ou omita, documentando a decisão) e quizzes (com suas tentativas
     e pontuações)

2. Endpoint GET /api/usuario/exportar-dados (autenticado).

3. Teste: usuário com dados variados recebe estrutura completa e
   correta; usuário sem nenhum dado recebe estrutura vazia mas válida
   (perfil preenchido, listas vazias), sem erro.

Siga docs/boas-praticas-backend.md em tudo. Atenção a performance: se
o usuário tiver muitos decks/flashcards, prefira poucas consultas bem
desenhadas (fetch join ou @EntityGraph) a um loop com N+1 consultas.

No frontend, adicione um botão "Exportar meus dados" na tela de
perfil, que baixa o JSON retornado como arquivo (ex.:
meus-dados-plataforma-estudos.json).
```

### Teste manual
Chama o endpoint com um usuário que tem pelo menos 1 deck com
flashcards e revisões → confirma que a estrutura retornada contém
tudo, e que baixar pelo frontend gera um arquivo JSON válido.

---

## R. Excluir Conta Permanentemente (RN32, UC25 — LGPD, direito ao esquecimento)

### Nova Regra de Negócio

| Cód. | Descrição |
|---|---|
| RN32 | O usuário tem direito de excluir permanentemente sua conta e todos os dados associados (LGPD, direito ao esquecimento/eliminação). A exclusão é irreversível, exige reautenticação (confirmação da senha atual) para evitar exclusão acidental ou por sessão sequestrada, e remove em cascata todos os dados vinculados ao usuário — decks e tudo que deles depende (flashcards, materiais, revisões, quizzes, tentativas), tokens de redefinição/verificação. Limitação conhecida e documentada: tokens JWT já emitidos permanecem tecnicamente válidos até sua expiração natural (no máximo 1 hora, conforme configuração), já que a autenticação é stateless sem lista de revogação nesta versão — registrado como trabalho futuro (blacklist de tokens). |

### Caso de Uso

**UC25 — Excluir conta permanentemente**
- **Ator:** Estudante
- **Objetivo:** Exercer o direito ao esquecimento, removendo definitivamente a própria conta e dados.
- **Pré-condições:** Usuário autenticado.
- **Pós-condições:** Usuário e todos os dados vinculados removidos permanentemente do banco.
- **Fluxo principal:**
  1. Estudante acessa a opção de excluir conta na tela de perfil.
  2. Sistema exige confirmação explícita (ex.: digitar a senha atual, e opcionalmente digitar uma frase de confirmação no frontend, tipo "EXCLUIR").
  3. Sistema valida a senha.
  4. Sistema remove permanentemente o usuário e todos os dados em cascata.
- **Fluxos de exceção:** E1 — senha incorreta → 401, exclusão não realizada.
- **Regras relacionadas:** RN32

### Extensão do Modelo de Dados

Esta é a migration que consolida as mudanças de schema desta rodada
(P + R): `V9__lgpd_cascata_usuario_e_termos.sql`

```sql
-- Termos de uso (RN30)
ALTER TABLE usuario ADD COLUMN termos_aceitos_em TIMESTAMP;
ALTER TABLE usuario ADD COLUMN termos_versao VARCHAR(10);
-- nullable porque usuários já existentes não aceitaram nada ainda;
-- se o banco for recriado do zero, pode-se tornar NOT NULL

-- Cascata a partir de Usuario (RN32) — adicionar ON DELETE CASCADE
-- em todas as FKs que referenciam usuario_id (mesmo padrão já usado
-- na migration V2 para as FKs de deck_id/flashcard_id/quiz_id)
ALTER TABLE deck DROP CONSTRAINT deck_usuario_id_fkey;
ALTER TABLE deck ADD CONSTRAINT deck_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE;

ALTER TABLE revisao_flashcard DROP CONSTRAINT revisao_flashcard_usuario_id_fkey;
ALTER TABLE revisao_flashcard ADD CONSTRAINT revisao_flashcard_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE;

ALTER TABLE tentativa_quiz DROP CONSTRAINT tentativa_quiz_usuario_id_fkey;
ALTER TABLE tentativa_quiz ADD CONSTRAINT tentativa_quiz_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE;

ALTER TABLE token_redefinicao_senha DROP CONSTRAINT token_redefinicao_senha_usuario_id_fkey;
ALTER TABLE token_redefinicao_senha ADD CONSTRAINT token_redefinicao_senha_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE;

ALTER TABLE token_verificacao_email DROP CONSTRAINT token_verificacao_email_usuario_id_fkey;
ALTER TABLE token_verificacao_email ADD CONSTRAINT token_verificacao_email_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE;
```

(Os nomes exatos das constraints devem ser confirmados no banco real
antes de escrever a migration definitiva — mesmo processo já usado na
migration V2, usando um container/banco descartável para consultar
`pg_constraint`.)

### Extensão do Contrato de API

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| DELETE | `/api/usuario/conta` | `{ senha }` | `204` | `401` (senha incorreta) |

### Prompt

```
Leia docs/regras-de-negocio.md (RN30, RN32) e docs/casos-de-uso.md
(UC25) antes de continuar. Este prompt trata TODAS as mudanças de
schema desta rodada (P + R) em uma migration única, já que ambas
alteram a entidade Usuario/suas relações.

1. Antes de escrever a migration definitiva, use um banco descartável
   (mesmo processo já usado nas migrations V1/V2) para confirmar os
   nomes reais das constraints de FK que referenciam usuario_id em
   deck, revisao_flashcard, tentativa_quiz, token_redefinicao_senha,
   token_verificacao_email.

2. Crie V9__lgpd_cascata_usuario_e_termos.sql com:
   - As duas colunas novas em usuario (termos_aceitos_em,
     termos_versao), nullable
   - DROP + ADD CONSTRAINT com ON DELETE CASCADE em todas as FKs
     listadas acima

3. Atualize as entidades JPA correspondentes (Deck, RevisaoFlashcard,
   TentativaQuiz, TokenRedefinicaoSenha, TokenVerificacaoEmail) com
   @OnDelete(action = OnDeleteAction.CASCADE) no @ManyToOne para
   Usuario, mesmo padrão já usado para as cascatas de Deck.

4. Adicione @OneToMany(mappedBy="usuario", cascade=ALL,
   orphanRemoval=true) em Usuario para Deck, RevisaoFlashcard,
   TentativaQuiz (dupla garantia JPA + banco, mesmo padrão já
   estabelecido no projeto) — cuidado para não duplicar a cascata que
   já vem transitivamente de Deck (um Flashcard já é removido quando
   seu Deck é removido; não precisa de cascata direta
   Usuario->Flashcard).

5. No UsuarioService, adicione o método excluirConta(senhaInformada):
   - Obtém o usuário autenticado
   - Valida a senha informada com passwordEncoder.matches — se
     incorreta, lança exceção 401, SEM excluir nada
   - Remove o usuário (usuarioRepository.delete) — a cascata cuida do
     resto

6. Endpoint DELETE /api/usuario/conta (autenticado, corpo com senha).

7. Teste (idealmente @DataJpaTest com H2, mesmo padrão dos testes de
   cascata já existentes no projeto): criar um usuário com deck,
   flashcard, revisão, quiz e tentativa; excluir o usuário; confirmar
   que TODOS os registros relacionados desaparecem (consulta direta
   a cada repository). Teste também: exclusão com senha incorreta não
   remove nada.

Siga docs/boas-praticas-backend.md em tudo. Esta é a operação mais
destrutiva do sistema — não economize em teste de cascata completo.

No frontend, adicione a opção "Excluir minha conta" na tela de perfil,
em destaque visual de risco (vermelho), com um AlertDialog exigindo
confirmação de senha e, se possível, digitar uma palavra de
confirmação (ex.: "EXCLUIR") antes de habilitar o botão final — a
ação não deve ser revertível por engano de clique único.
```

### Teste manual
1. Cria um usuário de teste dedicado, com deck, flashcards, revisões,
   quiz e tentativa.
2. Tenta excluir com senha errada → confirma 401, nada removido.
3. Exclui com senha correta → confirma 204.
4. Consulta o banco diretamente (`SELECT * FROM usuario WHERE id = ...`
   e as tabelas relacionadas) → confirma que **nada** restou.
5. Tenta logar com as credenciais da conta excluída → confirma falha
   (usuário não existe mais).

---

## Resumo de conformidade LGPD para o texto do TCC

Com P+Q+R implementados, junto com o que já existia (RN01 isolamento,
RN02 e-mail único, RN26/27 segurança de conta), o sistema cobre os
pilares centrais da LGPD relevantes ao seu escopo:

- **Consentimento** (RN30) — aceite auditável de termos, com versão e timestamp
- **Acesso e portabilidade** (RN31) — exportação completa dos próprios dados
- **Eliminação/esquecimento** (RN32) — exclusão permanente e em cascata, mediante confirmação
- **Segurança** (já existente) — isolamento por usuário (RN01), hash de senha (RNF02), política de senha forte (RN27), verificação de e-mail (RN26)

Limitação documentada e assumida conscientemente: sem blacklist de
tokens JWT, um token emitido antes da exclusão da conta permanece
tecnicamente válido até sua expiração natural (máx. 1h) — trade-off
comum em arquiteturas stateless, registrado como trabalho futuro caso
o sistema evolua para produção real.
