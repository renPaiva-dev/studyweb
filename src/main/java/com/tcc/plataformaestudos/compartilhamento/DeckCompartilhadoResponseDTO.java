package com.tcc.plataformaestudos.compartilhamento;

import java.util.List;

import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardResponseDTO;

/** UC29 — visão somente leitura de um deck acessado via link público (RN37). */
public record DeckCompartilhadoResponseDTO(
		String titulo,
		String descricao,
		List<FlashcardResponseDTO> flashcards) {

	public static DeckCompartilhadoResponseDTO fromEntity(Deck deck, List<Flashcard> flashcards) {
		return new DeckCompartilhadoResponseDTO(
				deck.getTitulo(),
				deck.getDescricao(),
				flashcards.stream().map(FlashcardResponseDTO::fromEntity).toList());
	}

}
