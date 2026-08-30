package com.tcc.plataformaestudos.quiz;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** UC28/RN36 — um item da lista de histórico (GET /api/usuario/provas). */
public record HistoricoProvaResumoDTO(
		Long tentativaId,
		Long quizId,
		String titulo,
		OrigemQuiz origem,
		EstiloProva estilo,
		LocalDateTime dataTentativa,
		BigDecimal pontuacao,
		int acertos,
		int total) {
}
