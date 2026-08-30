package com.tcc.plataformaestudos.dashboard;

import java.util.List;

/** GET /api/decks/{id}/dashboard/topicos (docs/contrato-api.md, UC15/RN20/RN17). */
public record TopicosResponseDTO(List<TopicoDashboardDTO> topicos) {
}
