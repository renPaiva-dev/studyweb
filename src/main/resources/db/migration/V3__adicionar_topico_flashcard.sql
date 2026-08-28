-- RN17/UC12: cada flashcard gerado por IA recebe, no mesmo processo de
-- geracao (UC04), uma classificacao curta de topico (ate 60 caracteres).
-- Para flashcards MANUAL o campo e opcional. Nullable porque flashcards
-- ja existentes nao tem topico retroativo, e a IA pode eventualmente nao
-- retornar o campo numa sugestao (tratado na aplicacao, nao no banco).

ALTER TABLE flashcard ADD COLUMN topico VARCHAR(60);
