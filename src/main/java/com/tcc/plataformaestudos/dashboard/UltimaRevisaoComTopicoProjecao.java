package com.tcc.plataformaestudos.dashboard;

import java.time.LocalDate;

/**
 * Mesma projeção de {@link UltimaRevisaoProjecao}, acrescida do tópico do
 * flashcard — usada pelo detalhamento por tópico (UC15/RN20/RN17).
 */
public record UltimaRevisaoComTopicoProjecao(
		Long flashcardId,
		String topico,
		Integer repeticoes,
		Integer qualidadeResposta,
		LocalDate proximaRevisao) {
}
