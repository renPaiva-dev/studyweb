-- UC18/RN24: token de uso unico para redefinicao de senha, valido por 1h.
CREATE TABLE token_redefinicao_senha (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    token VARCHAR(64) NOT NULL UNIQUE,
    expira_em TIMESTAMP NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);
