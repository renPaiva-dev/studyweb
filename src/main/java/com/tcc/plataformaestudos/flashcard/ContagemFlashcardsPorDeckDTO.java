package com.tcc.plataformaestudos.flashcard;

/**
 * B4 — projeção usada por {@link FlashcardRepository#contarPorDeckIdAgrupado}
 * para trazer, numa única consulta agregada (GROUP BY deck_id), a contagem de
 * flashcards de todos os decks de um usuário — evita o N+1 de uma query
 * {@code COUNT} por deck em {@code DeckService#listar}.
 */
public record ContagemFlashcardsPorDeckDTO(Long deckId, Long total) {
}
