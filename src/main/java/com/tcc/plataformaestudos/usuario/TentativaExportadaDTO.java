package com.tcc.plataformaestudos.usuario;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TentativaExportadaDTO(
		Long id,
		LocalDateTime dataTentativa,
		BigDecimal pontuacao) {
}
