package com.tcc.plataformaestudos.dashboard;

import java.math.BigDecimal;
import java.util.List;

/** GET /api/usuario/dashboard-geral (docs/contrato-api.md, UC20/RN25). */
public record DashboardGeralResponseDTO(
		int totalDecks,
		int totalFlashcards,
		BigDecimal percentualDominadoGeral,
		BigDecimal percentualEmRiscoGeral,
		long totalTentativasQuiz,
		BigDecimal pontuacaoMediaQuiz,
		int streakDias,
		List<RankingDeckDTO> decks) {
}
