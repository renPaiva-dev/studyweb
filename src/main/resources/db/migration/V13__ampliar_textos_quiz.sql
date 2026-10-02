-- UC10/RN15: o quiz deterministico copia a resposta do flashcard (ate 1000
-- caracteres, V1) para questao_quiz.resposta_correta e para
-- resposta_tentativa_quiz.alternativa_escolhida, que so aceitavam 500. As
-- provas por IA (UC27/RN35) tambem nao tem limite de tamanho para enunciado e
-- alternativas. O INSERT estourava "value too long" e o usuario recebia um
-- 409 "recurso ja existe" sem relacao com o problema. TEXT nao tem custo
-- extra no PostgreSQL e as alternativas ja eram TEXT.

ALTER TABLE questao_quiz ALTER COLUMN enunciado TYPE TEXT;
ALTER TABLE questao_quiz ALTER COLUMN resposta_correta TYPE TEXT;
ALTER TABLE resposta_tentativa_quiz ALTER COLUMN alternativa_escolhida TYPE TEXT;
