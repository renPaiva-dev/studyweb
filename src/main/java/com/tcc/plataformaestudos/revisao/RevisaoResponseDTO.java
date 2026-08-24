package com.tcc.plataformaestudos.revisao;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RevisaoResponseDTO(
		Long flashcardId,
		Integer qualidadeResposta,
		BigDecimal fatorFacilidade,
		Integer intervaloDias,
		Integer repeticoes,
		LocalDate proximaRevisao) {

	public static RevisaoResponseDTO fromEntity(RevisaoFlashcard revisao) {
		return new RevisaoResponseDTO(
				revisao.getFlashcard().getId(),
				revisao.getQualidadeResposta(),
				revisao.getFatorFacilidade(),
				revisao.getIntervaloDias(),
				revisao.getRepeticoes(),
				revisao.getProximaRevisao());
	}

}
