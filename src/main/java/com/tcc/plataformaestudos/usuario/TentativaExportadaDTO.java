package com.tcc.plataformaestudos.usuario;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** UC24/RN31/RN36 (LGPD) — respostas por questão incluídas para portabilidade completa (B16). */
public record TentativaExportadaDTO(
		Long id,
		LocalDateTime dataTentativa,
		BigDecimal pontuacao,
		List<RespostaExportadaDTO> respostas) {
}
