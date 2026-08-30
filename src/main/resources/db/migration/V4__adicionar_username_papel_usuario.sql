-- RN22/RN23 (UC17/UC19): nome_usuario (identificador publico, unico) e
-- papel (permissoes, default ESTUDANTE) na entidade USUARIO.
--
-- nome_usuario vai NOT NULL diretamente (em vez de ficar nullable
-- indefinidamente), mas ha contas reais em uso durante o desenvolvimento
-- (nao e um banco vazio) - por isso o valor e' preenchido via backfill
-- antes da constraint NOT NULL, em vez de simplesmente adicionar a coluna
-- ja obrigatoria (o que quebraria as linhas existentes).
ALTER TABLE usuario ADD COLUMN nome_usuario VARCHAR(30);
ALTER TABLE usuario ADD COLUMN papel VARCHAR(20) NOT NULL DEFAULT 'ESTUDANTE';

UPDATE usuario SET nome_usuario = 'usuario' || id WHERE nome_usuario IS NULL;

ALTER TABLE usuario ALTER COLUMN nome_usuario SET NOT NULL;
ALTER TABLE usuario ADD CONSTRAINT uk_usuario_nome_usuario UNIQUE (nome_usuario);
