package com.tcc.plataformaestudos.dashboard;

import java.util.List;

/** GET /api/decks/{id}/dashboard/atividade (docs/contrato-api.md, UC15/RN20). */
public record AtividadeResponseDTO(
		List<FlashcardMaisRevisadoDTO> flashcardsMaisRevisados,
		List<RevisaoPorDiaSemanaDTO> revisoesPorDiaSemana) {
}
