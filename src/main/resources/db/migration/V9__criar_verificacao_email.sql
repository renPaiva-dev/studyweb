-- UC21/RN26: verificacao de posse do e-mail no cadastro. Mesmo padrao de
-- token de uso unico da V5 (token_redefinicao_senha), mas com validade de
-- 24h em vez de 1h - nao ha urgencia de seguranca aqui, so confirmacao de
-- titularidade do e-mail informado. ON DELETE CASCADE ja inline (V5 so
-- ganhou isso depois, na V6, porque a tabela dela e anterior a esse
-- esforco de cascata em duas camadas).
CREATE TABLE token_verificacao_email (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expira_em TIMESTAMP NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);

-- RN26: toda conta criada passa a exigir confirmacao do e-mail antes do
-- login. DEFAULT TRUE serve so para o backfill das contas ja existentes
-- (evita travar o login de quem ja usava o sistema antes desta feature) -
-- novos cadastros continuam gravando FALSE, porque o Hibernate inclui
-- todas as colunas mapeadas no INSERT explicitamente (valor do campo Java
-- `emailVerificado = false`), sobrescrevendo o DEFAULT do banco, que so
-- vale quando a coluna e omitida do INSERT.
ALTER TABLE usuario ADD COLUMN email_verificado BOOLEAN NOT NULL DEFAULT TRUE;
