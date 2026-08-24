package com.tcc.plataformaestudos.flashcard;

import java.time.LocalDateTime;

public record FlashcardResponseDTO(
		Long id,
		String pergunta,
		String resposta,
		String mnemonico,
		OrigemFlashcard origem,
		LocalDateTime criadoEm) {

	public static FlashcardResponseDTO fromEntity(Flashcard flashcard) {
		return new FlashcardResponseDTO(
				flashcard.getId(),
				flashcard.getPergunta(),
				flashcard.getResposta(),
				flashcard.getMnemonico(),
				flashcard.getOrigem(),
				flashcard.getCriadoEm());
	}

}
