package com.tcc.plataformaestudos.deck;

import java.time.LocalDateTime;

public record DeckResponseDTO(
		Long id,
		String titulo,
		String descricao,
		LocalDateTime criadoEm,
		LocalDateTime atualizadoEm,
		int totalFlashcards) {

	/**
	 * totalFlashcards é fixo em 0 por enquanto — a entidade Flashcard ainda não
	 * existe. Quando ela existir, este método deve passar a contar os
	 * flashcards do deck.
	 */
	public static DeckResponseDTO fromEntity(Deck deck) {
		return new DeckResponseDTO(deck.getId(), deck.getTitulo(), deck.getDescricao(), deck.getCriadoEm(), deck.getAtualizadoEm(), 0);
	}

}
