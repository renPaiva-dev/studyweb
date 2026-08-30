package com.tcc.plataformaestudos.usuario;

import java.time.LocalDateTime;
import java.util.List;

public record DeckExportadoDTO(
		Long id,
		String titulo,
		String descricao,
		LocalDateTime criadoEm,
		LocalDateTime atualizadoEm,
		List<MaterialExportadoDTO> materiais,
		List<FlashcardExportadoDTO> flashcards,
		List<QuizExportadoDTO> quizzes) {
}
