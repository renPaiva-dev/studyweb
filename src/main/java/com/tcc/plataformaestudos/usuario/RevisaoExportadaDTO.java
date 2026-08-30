package com.tcc.plataformaestudos.usuario;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RevisaoExportadaDTO(
		Long id,
		LocalDateTime dataRevisao,
		Integer qualidadeResposta,
		BigDecimal fatorFacilidade,
		Integer intervaloDias,
		Integer repeticoes,
		LocalDate proximaRevisao) {
}
