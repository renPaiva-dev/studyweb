package com.tcc.plataformaestudos.dashboard;

import java.time.LocalDate;

/**
 * Projeção da última {@code RevisaoFlashcard} de um flashcard (ou campos
 * nulos, se o flashcard nunca foi revisado), usada para calcular as
 * métricas do dashboard (UC11/RN14) sem carregar entidades completas.
 */
public record UltimaRevisaoProjecao(
		Long flashcardId,
		Integer repeticoes,
		Integer qualidadeResposta,
		LocalDate proximaRevisao) {
}
