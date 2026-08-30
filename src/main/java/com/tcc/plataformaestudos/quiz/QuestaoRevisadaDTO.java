package com.tcc.plataformaestudos.quiz;

import java.util.List;

/**
 * UC10/UC27/RN36 — revisão de uma questão já respondida: revela a resposta
 * correta, o que o usuário escolheu, se acertou e a explicação (quando
 * houver) — nunca exposta antes de a questão ser respondida.
 */
public record QuestaoRevisadaDTO(
		Long questaoId,
		String enunciado,
		List<String> alternativas,
		String respostaCorreta,
		String alternativaEscolhida,
		boolean correta,
		String explicacao) {
}
