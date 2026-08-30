package com.tcc.plataformaestudos.dashboard;

import java.util.List;

/** GET /api/decks/{id}/dashboard/evolucao (docs/contrato-api.md, UC15/RN20). */
public record EvolucaoResponseDTO(List<PontoEvolucaoDTO> pontos) {
}
