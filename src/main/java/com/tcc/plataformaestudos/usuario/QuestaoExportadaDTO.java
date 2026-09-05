package com.tcc.plataformaestudos.usuario;

import java.util.List;

import com.tcc.plataformaestudos.quiz.AlternativaQuiz;

/** UC24/RN31/RN35 (LGPD) — explicação incluída para portabilidade completa (B16). */
public record QuestaoExportadaDTO(
		Long id,
		String enunciado,
		List<AlternativaQuiz> alternativas,
		String respostaCorreta,
		String explicacao) {
}
