package com.tcc.plataformaestudos.usuario;

import java.time.LocalDateTime;
import java.util.List;

import com.tcc.plataformaestudos.quiz.EstiloProva;
import com.tcc.plataformaestudos.quiz.OrigemQuiz;

/** UC24/RN31 (LGPD) — origem/estilo incluídos para portabilidade completa (B16). */
public record QuizExportadoDTO(
		Long id,
		String titulo,
		OrigemQuiz origem,
		EstiloProva estilo,
		LocalDateTime criadoEm,
		List<QuestaoExportadaDTO> questoes,
		List<TentativaExportadaDTO> tentativas) {
}
