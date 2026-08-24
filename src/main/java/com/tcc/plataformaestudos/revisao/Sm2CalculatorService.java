package com.tcc.plataformaestudos.revisao;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

/**
 * UC09 — Recalcular próxima revisão (SM-2). Serviço isolado, sem dependência
 * de banco ou HTTP: recebe o estado anterior e a qualidade da resposta
 * (0-5) e devolve o novo estado, conforme RN09/RN11/RN12.
 */
@Service
public class Sm2CalculatorService {

	private static final BigDecimal FATOR_FACILIDADE_MINIMO = new BigDecimal("1.3");

	/**
	 * RN11: qualidade &lt; 3 zera as repetições e reinicia o intervalo em 1
	 * dia. Qualidade &gt;= 3: repetições += 1; intervalo = 1 dia (1ª
	 * repetição), 6 dias (2ª repetição), ou intervalo anterior x novo EF
	 * (demais). RN12: o EF recalculado nunca fica abaixo de 1.3 — aplicado
	 * independentemente da qualidade, pois RN09 exige recalcular o EF em toda
	 * revisão.
	 */
	public EstadoRevisao calcularNovoEstado(EstadoRevisao estadoAnterior, int qualidadeResposta) {
		BigDecimal novoFatorFacilidade = calcularFatorFacilidade(estadoAnterior.fatorFacilidade(), qualidadeResposta);

		int repeticoes;
		int intervaloDias;

		if (qualidadeResposta < 3) {
			repeticoes = 0;
			intervaloDias = 1;
		} else {
			repeticoes = estadoAnterior.repeticoes() + 1;
			intervaloDias = calcularIntervalo(repeticoes, estadoAnterior.intervaloDias(), novoFatorFacilidade);
		}

		return new EstadoRevisao(novoFatorFacilidade, intervaloDias, repeticoes);
	}

	private int calcularIntervalo(int repeticoes, int intervaloAnterior, BigDecimal novoFatorFacilidade) {
		return switch (repeticoes) {
			case 1 -> 1;
			case 2 -> 6;
			default -> Math.round(intervaloAnterior * novoFatorFacilidade.floatValue());
		};
	}

	/**
	 * EF' = EF + (0.1 - (5-qualidade) * (0.08 + (5-qualidade) * 0.02)),
	 * nunca menor que 1.3 (RN12).
	 */
	private BigDecimal calcularFatorFacilidade(BigDecimal fatorFacilidadeAnterior, int qualidadeResposta) {
		BigDecimal delta = BigDecimal.valueOf(5 - qualidadeResposta);
		BigDecimal ajuste = BigDecimal.valueOf(0.1)
				.subtract(delta.multiply(BigDecimal.valueOf(0.08).add(delta.multiply(BigDecimal.valueOf(0.02)))));

		BigDecimal novoFatorFacilidade = fatorFacilidadeAnterior.add(ajuste).setScale(2, RoundingMode.HALF_UP);

		return novoFatorFacilidade.max(FATOR_FACILIDADE_MINIMO);
	}

}
