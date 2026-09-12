package com.tcc.plataformaestudos.prontidao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * UC31/RN40. {@code topicos} já vem ordenado por {@code retencaoMediaEstimada}
 * ascendente (mais urgente primeiro) — é o próprio "plano de revisão
 * priorizado" da regra, sem precisar de um campo separado.
 */
public record ProntidaoProvaResponseDTO(
		LocalDate dataAlvoProva,
		long diasRestantes,
		int totalFlashcards,
		BigDecimal prontidaoGeral,
		List<TopicoProntidaoDTO> topicos,
		String mensagem) {
}
