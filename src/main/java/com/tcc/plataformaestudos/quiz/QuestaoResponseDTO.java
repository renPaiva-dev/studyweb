package com.tcc.plataformaestudos.quiz;

import java.util.List;

public record QuestaoResponseDTO(Long id, String enunciado, List<String> alternativas) {

	/** Expõe apenas os textos das alternativas — nunca resposta_correta nem qual alternativa é a correta. */
	public static QuestaoResponseDTO fromEntity(QuestaoQuiz questao) {
		List<String> textos = questao.getAlternativas().stream()
				.map(AlternativaQuiz::texto)
				.toList();

		return new QuestaoResponseDTO(questao.getId(), questao.getEnunciado(), textos);
	}

}
