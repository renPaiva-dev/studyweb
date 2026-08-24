package com.tcc.plataformaestudos.revisao;

import java.math.BigDecimal;

/**
 * Estado do SM-2 para um flashcard num dado momento: fator de facilidade
 * (EF), intervalo em dias até a próxima revisão e número de repetições
 * consecutivas com qualidade >= 3. Entrada e saída de
 * {@link Sm2CalculatorService#calcularNovoEstado(EstadoRevisao, int)}.
 */
public record EstadoRevisao(BigDecimal fatorFacilidade, int intervaloDias, int repeticoes) {

	private static final BigDecimal FATOR_FACILIDADE_INICIAL = new BigDecimal("2.50");

	/**
	 * Estado de partida quando o flashcard ainda não teve nenhuma revisão
	 * (UC09): EF inicial 2.5, repetições 0.
	 */
	public static EstadoRevisao inicial() {
		return new EstadoRevisao(FATOR_FACILIDADE_INICIAL, 0, 0);
	}

}
