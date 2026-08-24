package com.tcc.plataformaestudos.quiz;

import java.util.List;

public record QuizResponseDTO(Long id, String titulo, List<QuestaoResponseDTO> questoes) {

	public static QuizResponseDTO fromEntity(Quiz quiz) {
		List<QuestaoResponseDTO> questoes = quiz.getQuestoes().stream()
				.map(QuestaoResponseDTO::fromEntity)
				.toList();

		return new QuizResponseDTO(quiz.getId(), quiz.getTitulo(), questoes);
	}

}
