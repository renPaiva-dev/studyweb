# Modelo de Dados

## Entidades e Atributos

### USUARIO
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| nome | VARCHAR(120) | NOT NULL |
| nome_usuario | VARCHAR(30) | NOT NULL, UNIQUE case-insensitive — índice sobre `LOWER(nome_usuario)` (RN22/RN34) |
| email | VARCHAR(180) | NOT NULL, UNIQUE |
| senha_hash | VARCHAR(255) | NOT NULL |
| papel | VARCHAR(20) | NOT NULL, DEFAULT 'ESTUDANTE' (RN23) — valores: ESTUDANTE, ADMIN |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |
| termos_aceitos_em | TIMESTAMP | NULL (RN30, LGPD — nulo para contas anteriores à exigência de consentimento) |
| termos_versao | VARCHAR(10) | NULL (RN30, LGPD) |
| email_verificado | BOOLEAN | NOT NULL, DEFAULT FALSE (RN26 — login bloqueado enquanto false) |

### TOKEN_REDEFINICAO_SENHA
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| usuario_id | BIGINT | NOT NULL, FK → USUARIO(id) ON DELETE CASCADE (RN32) |
| token | VARCHAR(64) | NOT NULL, UNIQUE |
| expira_em | TIMESTAMP | NOT NULL (válido por 1h — RN24) |
| usado | BOOLEAN | NOT NULL, DEFAULT FALSE |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |

### TOKEN_VERIFICACAO_EMAIL
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| usuario_id | BIGINT | NOT NULL, FK → USUARIO(id) ON DELETE CASCADE |
| token | VARCHAR(64) | NOT NULL, UNIQUE |
| expira_em | TIMESTAMP | NOT NULL (válido por 10 minutos a partir da criação — RN26/UC21; contas não verificadas expiradas são removidas por job agendado a cada 5 min) |
| usado | BOOLEAN | NOT NULL, DEFAULT FALSE |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |

### DECK
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| usuario_id | BIGINT | NOT NULL, FK → USUARIO(id) ON DELETE CASCADE |
| titulo | VARCHAR(150) | NOT NULL |
| descricao | VARCHAR(500) | NULL |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |
| atualizado_em | TIMESTAMP | NOT NULL, DEFAULT now() |
| data_alvo_prova | DATE | NULL (RN40/UC31 — data de prova definida pelo estudante; usada para estimar a retenção esperada de cada flashcard naquela data) |

### COMPARTILHAMENTO_DECK
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| deck_id | BIGINT | NOT NULL, UNIQUE, FK → DECK(id) ON DELETE CASCADE (no máximo um por deck — RN38) |
| token | VARCHAR(36) | NOT NULL, UNIQUE |
| ativo | BOOLEAN | NOT NULL, DEFAULT true |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |
| revogado_em | TIMESTAMP | NULL |

### MATERIAL_ORIGEM
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| deck_id | BIGINT | NOT NULL, FK → DECK(id) ON DELETE CASCADE |
| nome_arquivo | VARCHAR(255) | NOT NULL |
| caminho_arquivo | VARCHAR(500) | NOT NULL |
| texto_extraido | TEXT | NULL |
| status_processamento | VARCHAR(20) | NOT NULL, DEFAULT 'PENDENTE' (PENDENTE, PROCESSADO, ERRO) |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |

### FLASHCARD
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| deck_id | BIGINT | NOT NULL, FK → DECK(id) ON DELETE CASCADE |
| pergunta | VARCHAR(1000) | NOT NULL |
| resposta | VARCHAR(1000) | NOT NULL |
| mnemonico | VARCHAR(500) | NULL |
| topico | VARCHAR(60) | NULL (RN17/UC12 — classificação curta atribuída na geração por IA; opcional para MANUAL) |
| origem | VARCHAR(10) | NOT NULL, DEFAULT 'MANUAL' (MANUAL, IA) |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |

### REVISAO_FLASHCARD
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| flashcard_id | BIGINT | NOT NULL, FK → FLASHCARD(id) ON DELETE CASCADE |
| usuario_id | BIGINT | NOT NULL, FK → USUARIO(id) ON DELETE CASCADE |
| data_revisao | TIMESTAMP | NOT NULL, DEFAULT now() |
| qualidade_resposta | SMALLINT | NOT NULL, CHECK 0–5 |
| fator_facilidade | DECIMAL(3,2) | NOT NULL, DEFAULT 2.50, CHECK >= 1.3 |
| intervalo_dias | INT | NOT NULL, DEFAULT 0 |
| repeticoes | INT | NOT NULL, DEFAULT 0 |
| proxima_revisao | DATE | NOT NULL |

### QUIZ
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| deck_id | BIGINT | NOT NULL, FK → DECK(id) ON DELETE CASCADE |
| titulo | VARCHAR(150) | NOT NULL |
| origem | VARCHAR(20) | NOT NULL, DEFAULT 'DETERMINISTICO' (DETERMINISTICO — UC10, IA_PERSONALIZADA — RN35/UC27) |
| estilo | VARCHAR(20) | NULL, CHECK NULL ou (ENEM, VESTIBULAR, GERAL) — só preenchido quando origem=IA_PERSONALIZADA |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |

### QUESTAO_QUIZ
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| quiz_id | BIGINT | NOT NULL, FK → QUIZ(id) ON DELETE CASCADE |
| enunciado | VARCHAR(1000) | NOT NULL |
| alternativas | TEXT | NOT NULL — JSON serializado (array de {texto, correta}) via `AttributeConverter` (Jackson); **não é uma coluna `jsonb` no banco** |
| resposta_correta | VARCHAR(500) | NOT NULL |
| explicacao | TEXT | NULL (RN35/UC27 — explicação da resposta correta, revelada só após responder; não usada em quiz determinístico) |

### TENTATIVA_QUIZ
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| quiz_id | BIGINT | NOT NULL, FK → QUIZ(id) ON DELETE CASCADE |
| usuario_id | BIGINT | NOT NULL, FK → USUARIO(id) ON DELETE CASCADE |
| data_tentativa | TIMESTAMP | NOT NULL, DEFAULT now() |
| pontuacao | DECIMAL(5,2) | NOT NULL |

### RESPOSTA_TENTATIVA_QUIZ
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| tentativa_quiz_id | BIGINT | NOT NULL, FK → TENTATIVA_QUIZ(id) ON DELETE CASCADE |
| questao_quiz_id | BIGINT | NOT NULL, FK → QUESTAO_QUIZ(id) ON DELETE CASCADE |
| alternativa_escolhida | VARCHAR(500) | NOT NULL |
| correta | BOOLEAN | NOT NULL |

RN36/UC27 — registro por questão de cada tentativa, usado para reconstruir a
revisão questão-a-questão no histórico de provas (a pontuação agregada de
TENTATIVA_QUIZ, sozinha, não permite isso).

## Relacionamentos (cardinalidade)

```
USUARIO (1) ──< (N) DECK                        um usuário possui vários decks
USUARIO (1) ──< (N) TOKEN_REDEFINICAO_SENHA      um usuário pode ter vários tokens de redefinição (histórico)
USUARIO (1) ──< (N) TOKEN_VERIFICACAO_EMAIL      um usuário pode ter vários tokens de verificação (histórico/reenvio)
USUARIO (1) ──< (N) REVISAO_FLASHCARD            um usuário realiza várias revisões
USUARIO (1) ──< (N) TENTATIVA_QUIZ               um usuário realiza várias tentativas
DECK    (1) ──< (N) MATERIAL_ORIGEM              um deck pode ter vários PDFs enviados
DECK    (1) ──< (N) FLASHCARD                    um deck contém vários flashcards
DECK    (1) ──< (N) QUIZ                         um deck pode gerar vários quizzes
DECK    (1) ──< (1) COMPARTILHAMENTO_DECK        um deck tem no máximo um link de compartilhamento (RN38)
FLASHCARD (1) ──< (N) REVISAO_FLASHCARD          um flashcard tem várias revisões
QUIZ    (1) ──< (N) QUESTAO_QUIZ                 um quiz contém várias questões
QUIZ    (1) ──< (N) TENTATIVA_QUIZ               um quiz é respondido em várias tentativas
TENTATIVA_QUIZ (1) ──< (N) RESPOSTA_TENTATIVA_QUIZ   uma tentativa tem uma resposta registrada por questão
QUESTAO_QUIZ   (1) ──< (N) RESPOSTA_TENTATIVA_QUIZ   uma questão pode ser respondida em várias tentativas
```

Todas as relações são 1:N (sem N:N neste modelo) e obrigatórias do lado N —
toda FK é `NOT NULL`.

## DDL SQL

```sql
CREATE TABLE usuario (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    nome_usuario VARCHAR(30) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    papel VARCHAR(20) NOT NULL DEFAULT 'ESTUDANTE',
    criado_em TIMESTAMP NOT NULL DEFAULT now(),
    termos_aceitos_em TIMESTAMP,
    termos_versao VARCHAR(10),
    email_verificado BOOLEAN NOT NULL DEFAULT FALSE
);
-- unicidade de nome_usuario é case-insensitive (RN34): índice sobre LOWER(), não UNIQUE simples
CREATE UNIQUE INDEX uk_usuario_nome_usuario_lower ON usuario (LOWER(nome_usuario));

CREATE TABLE token_redefinicao_senha (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expira_em TIMESTAMP NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE token_verificacao_email (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expira_em TIMESTAMP NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE deck (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    descricao VARCHAR(500),
    criado_em TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMP NOT NULL DEFAULT now()
);
-- RN40/UC31: adicionada em V10, coluna nullable ate o estudante definir uma data-alvo
ALTER TABLE deck ADD COLUMN data_alvo_prova DATE;

CREATE TABLE compartilhamento_deck (
    id BIGSERIAL PRIMARY KEY,
    deck_id BIGINT NOT NULL UNIQUE REFERENCES deck(id) ON DELETE CASCADE,
    token VARCHAR(36) NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP NOT NULL DEFAULT now(),
    revogado_em TIMESTAMP
);

CREATE TABLE material_origem (
    id BIGSERIAL PRIMARY KEY,
    deck_id BIGINT NOT NULL REFERENCES deck(id) ON DELETE CASCADE,
    nome_arquivo VARCHAR(255) NOT NULL,
    caminho_arquivo VARCHAR(500) NOT NULL,
    texto_extraido TEXT,
    status_processamento VARCHAR(20) NOT NULL DEFAULT 'PENDENTE'
        CHECK (status_processamento IN ('PENDENTE','PROCESSADO','ERRO')),
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE flashcard (
    id BIGSERIAL PRIMARY KEY,
    deck_id BIGINT NOT NULL REFERENCES deck(id) ON DELETE CASCADE,
    pergunta VARCHAR(1000) NOT NULL,
    resposta VARCHAR(1000) NOT NULL,
    mnemonico VARCHAR(500),
    topico VARCHAR(60),
    origem VARCHAR(10) NOT NULL DEFAULT 'MANUAL'
        CHECK (origem IN ('MANUAL','IA')),
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE revisao_flashcard (
    id BIGSERIAL PRIMARY KEY,
    flashcard_id BIGINT NOT NULL REFERENCES flashcard(id) ON DELETE CASCADE,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    data_revisao TIMESTAMP NOT NULL DEFAULT now(),
    qualidade_resposta SMALLINT NOT NULL CHECK (qualidade_resposta BETWEEN 0 AND 5),
    fator_facilidade DECIMAL(3,2) NOT NULL DEFAULT 2.50 CHECK (fator_facilidade >= 1.3),
    intervalo_dias INT NOT NULL DEFAULT 0,
    repeticoes INT NOT NULL DEFAULT 0,
    proxima_revisao DATE NOT NULL
);

CREATE TABLE quiz (
    id BIGSERIAL PRIMARY KEY,
    deck_id BIGINT NOT NULL REFERENCES deck(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    origem VARCHAR(20) NOT NULL DEFAULT 'DETERMINISTICO'
        CHECK (origem IN ('DETERMINISTICO','IA_PERSONALIZADA')),
    estilo VARCHAR(20)
        CHECK (estilo IS NULL OR estilo IN ('ENEM','VESTIBULAR','GERAL')),
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE questao_quiz (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
    enunciado VARCHAR(1000) NOT NULL,
    alternativas TEXT NOT NULL,
    resposta_correta VARCHAR(500) NOT NULL,
    explicacao TEXT
);

CREATE TABLE tentativa_quiz (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    data_tentativa TIMESTAMP NOT NULL DEFAULT now(),
    pontuacao DECIMAL(5,2) NOT NULL
);

CREATE TABLE resposta_tentativa_quiz (
    id BIGSERIAL PRIMARY KEY,
    tentativa_quiz_id BIGINT NOT NULL REFERENCES tentativa_quiz(id) ON DELETE CASCADE,
    questao_quiz_id BIGINT NOT NULL REFERENCES questao_quiz(id) ON DELETE CASCADE,
    alternativa_escolhida VARCHAR(500) NOT NULL,
    correta BOOLEAN NOT NULL
);
```

Este DDL reflete o schema real (ver `src/main/resources/db/migration/V1`–`V10`),
não a saída literal do `ddl-auto` do Hibernate — os nomes de PK/sequence e
tipos exatos de timestamp podem variar ligeiramente da migration física sem
impacto no modelo lógico acima.

## Observações de mapeamento JPA

- A exclusão em cascata da RN13/RN32 é garantida em **duas camadas**: no
  banco, toda FK do lado N tem `ON DELETE CASCADE` (via `@OnDelete(action =
  OnDeleteAction.CASCADE)` do Hibernate no lado `@ManyToOne`); na aplicação,
  o lado `@OneToMany` correspondente usa `cascade = CascadeType.ALL,
  orphanRemoval = true`. As duas cascatas coexistem como defesa em
  profundidade — uma não substitui a outra (ver comentários em
  `V2__adicionar_constraints_banco.sql` e
  `V6__lgpd_termos_cascata_usuario_e_username_case_insensitive.sql`).
- `status_processamento`, `origem` (flashcard/quiz), `papel` e `estilo` são
  mapeados como enums Java com `@Enumerated(EnumType.STRING)`.
- `alternativas` (QUESTAO_QUIZ) **não é `jsonb`**: é uma coluna `TEXT` comum,
  serializada/deserializada via `AttributeConverter` customizado
  (`AlternativasConverter`, baseado em Jackson).
- `nome_usuario` não tem `UNIQUE` simples na coluna: a unicidade é garantida
  por um índice único sobre `LOWER(nome_usuario)` (RN34, case-insensitive),
  criado em `V6`.
