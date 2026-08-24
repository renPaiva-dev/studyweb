package com.tcc.plataformaestudos.dashboard;

import java.math.BigDecimal;

public record DashboardResponseDTO(
		int totalFlashcards,
		BigDecimal percentualDominado,
		BigDecimal percentualEmRisco) {
}
