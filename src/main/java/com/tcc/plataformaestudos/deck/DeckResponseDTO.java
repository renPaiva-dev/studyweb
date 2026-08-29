package com.tcc.plataformaestudos.deck;

import java.time.LocalDateTime;

public record DeckResponseDTO(
		Long id,
		String titulo,
		String descricao,
		LocalDateTime criadoEm,
		LocalDateTime atualizadoEm,
		int totalFlashcards) {

	public static DeckResponseDTO fromEntity(Deck deck, long totalFlashcards) {
		return new DeckResponseDTO(deck.getId(), deck.getTitulo(), deck.getDescricao(), deck.getCriadoEm(), deck.getAtualizadoEm(), (int) totalFlashcards);
	}

}
