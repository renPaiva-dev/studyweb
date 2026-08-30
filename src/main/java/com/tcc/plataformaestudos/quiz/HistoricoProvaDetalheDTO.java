package com.tcc.plataformaestudos.quiz;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** UC28/RN36 — detalhe de uma tentativa (GET /api/usuario/provas/{id}), com revisão questão a questão. */
public record HistoricoProvaDetalheDTO(
		Long tentativaId,
		Long quizId,
		String titulo,
		OrigemQuiz origem,
		EstiloProva estilo,
		LocalDateTime dataTentativa,
		BigDecimal pontuacao,
		List<QuestaoRevisadaDTO> questoes) {
}
