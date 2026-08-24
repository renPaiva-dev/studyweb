-- RN13: a exclusao em cascata (deck -> materiais/flashcards/quizzes e
-- flashcard/quiz -> historico) ate aqui so acontecia via Hibernate
-- (cascade = CascadeType.ALL, orphanRemoval = true - ver V1). Recria cada FK
-- abaixo com ON DELETE CASCADE para que a garantia exista tambem no banco,
-- como defesa em duas camadas (JPA E banco) - nao substitui a cascata da
-- aplicacao, soma-se a ela. Os nomes de constraint usados no DROP sao os
-- que o Postgres atribuiu automaticamente as REFERENCES inline da V1
-- (convencao <tabela>_<coluna>_fkey), confirmados contra um banco real.

ALTER TABLE material_origem DROP CONSTRAINT material_origem_deck_id_fkey;
ALTER TABLE material_origem ADD CONSTRAINT material_origem_deck_id_fkey
    FOREIGN KEY (deck_id) REFERENCES deck (id) ON DELETE CASCADE;

ALTER TABLE flashcard DROP CONSTRAINT flashcard_deck_id_fkey;
ALTER TABLE flashcard ADD CONSTRAINT flashcard_deck_id_fkey
    FOREIGN KEY (deck_id) REFERENCES deck (id) ON DELETE CASCADE;

ALTER TABLE quiz DROP CONSTRAINT quiz_deck_id_fkey;
ALTER TABLE quiz ADD CONSTRAINT quiz_deck_id_fkey
    FOREIGN KEY (deck_id) REFERENCES deck (id) ON DELETE CASCADE;

ALTER TABLE revisao_flashcard DROP CONSTRAINT revisao_flashcard_flashcard_id_fkey;
ALTER TABLE revisao_flashcard ADD CONSTRAINT revisao_flashcard_flashcard_id_fkey
    FOREIGN KEY (flashcard_id) REFERENCES flashcard (id) ON DELETE CASCADE;

ALTER TABLE questao_quiz DROP CONSTRAINT questao_quiz_quiz_id_fkey;
ALTER TABLE questao_quiz ADD CONSTRAINT questao_quiz_quiz_id_fkey
    FOREIGN KEY (quiz_id) REFERENCES quiz (id) ON DELETE CASCADE;

ALTER TABLE tentativa_quiz DROP CONSTRAINT tentativa_quiz_quiz_id_fkey;
ALTER TABLE tentativa_quiz ADD CONSTRAINT tentativa_quiz_quiz_id_fkey
    FOREIGN KEY (quiz_id) REFERENCES quiz (id) ON DELETE CASCADE;

-- RN09/RN12: ate aqui validados so em AvaliarRespostaRequestDTO (Bean
-- Validation) e Sm2CalculatorService - o banco aceitava qualquer valor.
-- Mesma logica de defesa em duas camadas: a validacao da aplicacao continua
-- existindo, isto e uma camada adicional, nao substituta.

ALTER TABLE revisao_flashcard ADD CONSTRAINT revisao_flashcard_qualidade_resposta_check
    CHECK (qualidade_resposta BETWEEN 0 AND 5);

ALTER TABLE revisao_flashcard ADD CONSTRAINT revisao_flashcard_fator_facilidade_check
    CHECK (fator_facilidade >= 1.3);
