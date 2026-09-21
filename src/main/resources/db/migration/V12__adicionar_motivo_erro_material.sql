-- Achado I4 (Docs/auditoria-coerencia-seguranca-2026-09.md) - RN07: quando a
-- extracao de texto do PDF falha (escaneado, corrompido, protegido), o
-- material fica com status ERRO mas sem nenhum motivo persistido, entao o
-- frontend so tinha um badge "Erro" generico, sem explicar a causa nem dar
-- proximo passo ao usuario.

ALTER TABLE material_origem ADD COLUMN motivo_erro VARCHAR(300);
