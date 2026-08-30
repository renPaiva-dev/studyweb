package com.tcc.plataformaestudos.usuario;

import java.time.LocalDateTime;
import java.util.List;

import com.tcc.plataformaestudos.flashcard.OrigemFlashcard;

public record FlashcardExportadoDTO(
		Long id,
		String pergunta,
		String resposta,
		String mnemonico,
		String topico,
		OrigemFlashcard origem,
		LocalDateTime criadoEm,
		List<RevisaoExportadaDTO> revisoes) {
}
