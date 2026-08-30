-- Extensão LGPD e itens pendentes de conta (docs/extensao-lgpd-conta.md).
-- Consolida em uma única migration as mudanças que tocam a entidade
-- Usuario/suas relações, mesmo padrão já usado na V2 (defesa em duas
-- camadas: JPA + banco).

-- RN34: unicidade de nome_usuario (RN22) passa a ser case-insensitive -
-- "Renato" e "renato" nao podem coexistir. A constraint UNIQUE simples da
-- V4 nao e case-insensitive no Postgres, por isso e substituida por um
-- indice unico sobre LOWER(nome_usuario).
ALTER TABLE usuario DROP CONSTRAINT uk_usuario_nome_usuario;
CREATE UNIQUE INDEX uk_usuario_nome_usuario_lower ON usuario (LOWER(nome_usuario));

-- RN30: aceite de termos de uso no cadastro (LGPD, consentimento). Nullable
-- porque contas ja existentes nao aceitaram nada ainda (mesmo raciocinio de
-- backfill/nullable ja usado na V4 para colunas novas em base populada).
ALTER TABLE usuario ADD COLUMN termos_aceitos_em TIMESTAMP;
ALTER TABLE usuario ADD COLUMN termos_versao VARCHAR(10);

-- RN32: exclusao de conta em cascata (LGPD, direito ao esquecimento) - as
-- FKs que referenciam usuario_id ganham ON DELETE CASCADE, como defesa
-- adicional a cascata do Hibernate (cascade = ALL, orphanRemoval = true em
-- Usuario#decks). Nao ha token_verificacao_email nesta versao do sistema
-- (UC21/RN26 ainda nao implementado), por isso essa FK nao aparece aqui.
ALTER TABLE deck DROP CONSTRAINT deck_usuario_id_fkey;
ALTER TABLE deck ADD CONSTRAINT deck_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE;

ALTER TABLE revisao_flashcard DROP CONSTRAINT revisao_flashcard_usuario_id_fkey;
ALTER TABLE revisao_flashcard ADD CONSTRAINT revisao_flashcard_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE;

ALTER TABLE tentativa_quiz DROP CONSTRAINT tentativa_quiz_usuario_id_fkey;
ALTER TABLE tentativa_quiz ADD CONSTRAINT tentativa_quiz_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE;

ALTER TABLE token_redefinicao_senha DROP CONSTRAINT token_redefinicao_senha_usuario_id_fkey;
ALTER TABLE token_redefinicao_senha ADD CONSTRAINT token_redefinicao_senha_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE;
