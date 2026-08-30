package com.tcc.plataformaestudos.usuario;

import java.util.List;

import com.tcc.plataformaestudos.quiz.AlternativaQuiz;

public record QuestaoExportadaDTO(
		Long id,
		String enunciado,
		List<AlternativaQuiz> alternativas,
		String respostaCorreta) {
}
