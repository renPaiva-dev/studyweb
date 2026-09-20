package com.tcc.plataformaestudos.deck;

import java.time.LocalDateTime;

public record DeckResponseDTO(
		Long id,
		String titulo,
		String descricao,
		LocalDateTime criadoEm,
		LocalDateTime atualizadoEm,
		int totalFlashcards,
		Long colecaoId,
		String colecaoNome) {

	public static DeckResponseDTO fromEntity(Deck deck, long totalFlashcards) {
		Long colecaoId = deck.getColecao() != null ? deck.getColecao().getId() : null;
		String colecaoNome = deck.getColecao() != null ? deck.getColecao().getNome() : null;
		return new DeckResponseDTO(deck.getId(), deck.getTitulo(), deck.getDescricao(), deck.getCriadoEm(),
				deck.getAtualizadoEm(), (int) totalFlashcards, colecaoId, colecaoNome);
	}

}
