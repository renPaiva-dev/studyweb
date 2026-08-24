package com.tcc.plataformaestudos.revisao;

import com.tcc.plataformaestudos.flashcard.Flashcard;

public record FilaEstudoItemDTO(
		Long flashcardId,
		String pergunta,
		String resposta,
		String mnemonico) {

	public static FilaEstudoItemDTO fromEntity(Flashcard flashcard) {
		return new FilaEstudoItemDTO(
				flashcard.getId(),
				flashcard.getPergunta(),
				flashcard.getResposta(),
				flashcard.getMnemonico());
	}

}
