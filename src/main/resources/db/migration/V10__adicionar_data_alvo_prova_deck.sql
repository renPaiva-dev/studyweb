-- UC31/RN40: data-alvo de prova por deck, usada para estimar a retencao
-- esperada de cada flashcard naquela data (curva de esquecimento calibrada
-- pelo proprio SM-2/RN09). Nula ate o estudante definir uma data.
ALTER TABLE deck ADD COLUMN data_alvo_prova DATE;
