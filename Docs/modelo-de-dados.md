# Modelo de Dados

## Entidades e Atributos

### USUARIO
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| nome | VARCHAR(120) | NOT NULL |
| nome_usuario | VARCHAR(30) | NOT NULL, UNIQUE (RN22) |
| email | VARCHAR(180) | NOT NULL, UNIQUE |
| senha_hash | VARCHAR(255) | NOT NULL |
| papel | VARCHAR(20) | NOT NULL, DEFAULT 'ESTUDANTE' (RN23) |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |

### TOKEN_REDEFINICAO_SENHA
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| usuario_id | BIGINT | NOT NULL, FK → USUARIO(id) |
| token | VARCHAR(64) | NOT NULL, UNIQUE |
| expira_em | TIMESTAMP | NOT NULL |
| usado | BOOLEAN | NOT NULL, DEFAULT FALSE |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |

### DECK
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| usuario_id | BIGINT | NOT NULL, FK → USUARIO(id) |
| titulo | VARCHAR(150) | NOT NULL |
| descricao | VARCHAR(500) | NULL |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |
| atualizado_em | TIMESTAMP | NOT NULL, DEFAULT now() |

### COMPARTILHAMENTO_DECK
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| deck_id | BIGINT | NOT NULL, UNIQUE, FK → DECK(id) (no máximo um por deck — RN38) |
| token | VARCHAR(36) | NOT NULL, UNIQUE |
| ativo | BOOLEAN | NOT NULL, DEFAULT true |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |
| revogado_em | TIMESTAMP | NULL |

### MATERIAL_ORIGEM
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| deck_id | BIGINT | NOT NULL, FK → DECK(id) |
| nome_arquivo | VARCHAR(255) | NOT NULL |
| caminho_arquivo | VARCHAR(500) | NOT NULL |
| texto_extraido | TEXT | NULL |
| status_processamento | VARCHAR(20) | NOT NULL, DEFAULT 'PENDENTE' (PENDENTE, PROCESSADO, ERRO) |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |

### FLASHCARD
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| deck_id | BIGINT | NOT NULL, FK → DECK(id) |
| pergunta | VARCHAR(1000) | NOT NULL |
| resposta | VARCHAR(1000) | NOT NULL |
| mnemonico | VARCHAR(500) | NULL |
| origem | VARCHAR(10) | NOT NULL, DEFAULT 'MANUAL' (MANUAL, IA) |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |

### REVISAO_FLASHCARD
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| flashcard_id | BIGINT | NOT NULL, FK → FLASHCARD(id) |
| usuario_id | BIGINT | NOT NULL, FK → USUARIO(id) |
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
| deck_id | BIGINT | NOT NULL, FK → DECK(id) |
| titulo | VARCHAR(150) | NOT NULL |
| criado_em | TIMESTAMP | NOT NULL, DEFAULT now() |

### QUESTAO_QUIZ
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| quiz_id | BIGINT | NOT NULL, FK → QUIZ(id) |
| enunciado | VARCHAR(1000) | NOT NULL |
| alternativas | JSONB | NOT NULL — array de {texto, correta} |
| resposta_correta | VARCHAR(500) | NOT NULL |

### TENTATIVA_QUIZ
| Atributo | Tipo | Restrições |
|---|---|---|
| id | BIGINT | PK, auto_increment |
| quiz_id | BIGINT | NOT NULL, FK → QUIZ(id) |
| usuario_id | BIGINT | NOT NULL, FK → USUARIO(id) |
| data_tentativa | TIMESTAMP | NOT NULL, DEFAULT now() |
| pontuacao | DECIMAL(5,2) | NOT NULL |

## Relacionamentos (cardinalidade)

```
USUARIO (1) ──< (N) DECK                  um usuário possui vários decks
DECK    (1) ──< (N) MATERIAL_ORIGEM       um deck pode ter vários PDFs enviados
DECK    (1) ──< (N) FLASHCARD             um deck contém vários flashcards
FLASHCARD (1) ──< (N) REVISAO_FLASHCARD   um flashcard tem várias revisões
USUARIO (1) ──< (N) REVISAO_FLASHCARD     um usuário realiza várias revisões
DECK    (1) ──< (N) QUIZ                  um deck pode gerar vários quizzes
QUIZ    (1) ──< (N) QUESTAO_QUIZ          um quiz contém várias questões
QUIZ    (1) ──< (N) TENTATIVA_QUIZ        um quiz é respondido em várias tentativas
USUARIO (1) ──< (N) TENTATIVA_QUIZ        um usuário realiza várias tentativas
USUARIO (1) ──< (N) TOKEN_REDEFINICAO_SENHA  um usuário pode ter vários tokens de redefinição (histórico)
DECK    (1) ──< (1) COMPARTILHAMENTO_DECK    um deck tem no máximo um link de compartilhamento (RN38)
```

Todas as relações são 1:N (sem N:N neste modelo) e obrigatórias do lado N —
toda FK é `NOT NULL`.

## DDL SQL

```sql
CREATE TABLE usuario (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    nome_usuario VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    papel VARCHAR(20) NOT NULL DEFAULT 'ESTUDANTE',
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE token_redefinicao_senha (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    token VARCHAR(64) NOT NULL UNIQUE,
    expira_em TIMESTAMP NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE deck (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    titulo VARCHAR(150) NOT NULL,
    descricao VARCHAR(500),
    criado_em TIMESTAMP NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMP NOT NULL DEFAULT now()
);

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
    origem VARCHAR(10) NOT NULL DEFAULT 'MANUAL'
        CHECK (origem IN ('MANUAL','IA')),
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE revisao_flashcard (
    id BIGSERIAL PRIMARY KEY,
    flashcard_id BIGINT NOT NULL REFERENCES flashcard(id) ON DELETE CASCADE,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
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
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE questao_quiz (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
    enunciado VARCHAR(1000) NOT NULL,
    alternativas JSONB NOT NULL,
    resposta_correta VARCHAR(500) NOT NULL
);

CREATE TABLE tentativa_quiz (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    data_tentativa TIMESTAMP NOT NULL DEFAULT now(),
    pontuacao DECIMAL(5,2) NOT NULL
);
```

## Observações de mapeamento JPA

- `@OneToMany(mappedBy = "...", cascade = CascadeType.ALL, orphanRemoval = true)` no lado "um" implementa a exclusão em cascata da RN13, equivalente ao `ON DELETE CASCADE` do DDL.
- `status_processamento` e `origem` são mapeados como enums Java com `@Enumerated(EnumType.STRING)`.
- `alternativas` (QUESTAO_QUIZ) é mapeado como JSONB via `AttributeConverter` customizado.
