package com.tcc.plataformaestudos.dashboard;

import java.math.BigDecimal;

public record TopicoDashboardDTO(
		String topico,
		int totalFlashcards,
		BigDecimal percentualDominado,
		BigDecimal percentualEmRisco) {
}
