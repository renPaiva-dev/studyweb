package com.tcc.plataformaestudos.revisao;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

/**
 * UC09 — cobertura exaustiva do núcleo do SM-2, isolado de banco/HTTP
 * (RN09/RN11/RN12). Os valores esperados são calculados manualmente a
 * partir da fórmula de docs/casos-de-uso.md, servindo de evidência para a
 * defesa do TCC.
 */
class Sm2CalculatorServiceTest {

	private final Sm2CalculatorService sm2CalculatorService = new Sm2CalculatorService();

	@Test
	void deveReiniciarRepeticoesEIntervaloQuandoQualidadeForZero() {
		EstadoRevisao estadoAnterior = new EstadoRevisao(new BigDecimal("2.50"), 10, 3);

		EstadoRevisao novoEstado = sm2CalculatorService.calcularNovoEstado(estadoAnterior, 0);

		assertThat(novoEstado.repeticoes()).isZero();
		assertThat(novoEstado.intervaloDias()).isEqualTo(1);
		assertThat(novoEstado.fatorFacilidade()).isEqualByComparingTo("1.70");
	}

	@Test
	void deveReiniciarRepeticoesEIntervaloQuandoQualidadeForUm() {
		EstadoRevisao estadoAnterior = new EstadoRevisao(new BigDecimal("2.50"), 10, 3);

		EstadoRevisao novoEstado = sm2CalculatorService.calcularNovoEstado(estadoAnterior, 1);

		assertThat(novoEstado.repeticoes()).isZero();
		assertThat(novoEstado.intervaloDias()).isEqualTo(1);
		assertThat(novoEstado.fatorFacilidade()).isEqualByComparingTo("1.96");
	}

	@Test
	void deveReiniciarRepeticoesEIntervaloQuandoQualidadeForDois() {
		EstadoRevisao estadoAnterior = new EstadoRevisao(new BigDecimal("2.50"), 10, 3);

		EstadoRevisao novoEstado = sm2CalculatorService.calcularNovoEstado(estadoAnterior, 2);

		assertThat(novoEstado.repeticoes()).isZero();
		assertThat(novoEstado.intervaloDias()).isEqualTo(1);
		assertThat(novoEstado.fatorFacilidade()).isEqualByComparingTo("2.18");
	}

	@Test
	void deveProgredirParaPrimeiraRepeticaoComIntervaloDeUmDiaQuandoQualidadeForTres() {
		EstadoRevisao novoEstado = sm2CalculatorService.calcularNovoEstado(EstadoRevisao.inicial(), 3);

		assertThat(novoEstado.repeticoes()).isEqualTo(1);
		assertThat(novoEstado.intervaloDias()).isEqualTo(1);
		assertThat(novoEstado.fatorFacilidade()).isEqualByComparingTo("2.36");
	}

	@Test
	void deveProgredirParaPrimeiraRepeticaoComIntervaloDeUmDiaQuandoQualidadeForQuatro() {
		EstadoRevisao novoEstado = sm2CalculatorService.calcularNovoEstado(EstadoRevisao.inicial(), 4);

		assertThat(novoEstado.repeticoes()).isEqualTo(1);
		assertThat(novoEstado.intervaloDias()).isEqualTo(1);
		assertThat(novoEstado.fatorFacilidade()).isEqualByComparingTo("2.50");
	}

	@Test
	void deveProgredirParaPrimeiraRepeticaoComIntervaloDeUmDiaQuandoQualidadeForCinco() {
		EstadoRevisao novoEstado = sm2CalculatorService.calcularNovoEstado(EstadoRevisao.inicial(), 5);

		assertThat(novoEstado.repeticoes()).isEqualTo(1);
		assertThat(novoEstado.intervaloDias()).isEqualTo(1);
		assertThat(novoEstado.fatorFacilidade()).isEqualByComparingTo("2.60");
	}

	@Test
	void deveUsarIntervaloFixoDeSeisDiasNaSegundaRepeticao() {
		EstadoRevisao estadoAnterior = new EstadoRevisao(new BigDecimal("2.60"), 1, 1);

		EstadoRevisao novoEstado = sm2CalculatorService.calcularNovoEstado(estadoAnterior, 5);

		assertThat(novoEstado.repeticoes()).isEqualTo(2);
		assertThat(novoEstado.intervaloDias()).isEqualTo(6);
		assertThat(novoEstado.fatorFacilidade()).isEqualByComparingTo("2.70");
	}

	@Test
	void deveMultiplicarIntervaloAnteriorPeloNovoFatorDeFacilidadeApartirDaTerceiraRepeticao() {
		EstadoRevisao estadoAnterior = new EstadoRevisao(new BigDecimal("2.70"), 6, 2);

		EstadoRevisao novoEstado = sm2CalculatorService.calcularNovoEstado(estadoAnterior, 5);

		assertThat(novoEstado.repeticoes()).isEqualTo(3);
		assertThat(novoEstado.fatorFacilidade()).isEqualByComparingTo("2.80");
		// intervalo anterior (6) * novo EF (2.80) = 16.8 -> arredondado para 17
		assertThat(novoEstado.intervaloDias()).isEqualTo(17);
	}

	@Test
	void deveEncadearTresRepeticoesBemSucedidasComValoresExatos() {
		EstadoRevisao estado1 = sm2CalculatorService.calcularNovoEstado(EstadoRevisao.inicial(), 5);
		assertThat(estado1.fatorFacilidade()).isEqualByComparingTo("2.60");
		assertThat(estado1.intervaloDias()).isEqualTo(1);
		assertThat(estado1.repeticoes()).isEqualTo(1);

		EstadoRevisao estado2 = sm2CalculatorService.calcularNovoEstado(estado1, 5);
		assertThat(estado2.fatorFacilidade()).isEqualByComparingTo("2.70");
		assertThat(estado2.intervaloDias()).isEqualTo(6);
		assertThat(estado2.repeticoes()).isEqualTo(2);

		EstadoRevisao estado3 = sm2CalculatorService.calcularNovoEstado(estado2, 5);
		assertThat(estado3.fatorFacilidade()).isEqualByComparingTo("2.80");
		assertThat(estado3.intervaloDias()).isEqualTo(17);
		assertThat(estado3.repeticoes()).isEqualTo(3);
	}

	@Test
	void deveManterFatorDeFacilidadeNoMinimoDeUmVirgulaTresQuandoJaEstiverNoPiso() {
		EstadoRevisao estadoAnterior = new EstadoRevisao(new BigDecimal("1.30"), 1, 0);

		EstadoRevisao novoEstado = sm2CalculatorService.calcularNovoEstado(estadoAnterior, 0);

		assertThat(novoEstado.fatorFacilidade()).isEqualByComparingTo("1.30");
	}

	@Test
	void deveManterFatorDeFacilidadeNoMinimoDeUmVirgulaTresQuandoCalculoResultarAbaixoDoPiso() {
		EstadoRevisao estadoAnterior = new EstadoRevisao(new BigDecimal("1.35"), 1, 0);

		// 1.35 - 0.80 = 0.55, abaixo do piso -> deve ser corrigido para 1.30
		EstadoRevisao novoEstado = sm2CalculatorService.calcularNovoEstado(estadoAnterior, 0);

		assertThat(novoEstado.fatorFacilidade()).isEqualByComparingTo("1.30");
	}

	@Test
	void deveManterFatorDeFacilidadeNoPisoEmQuedasRepetidasDeQualidadeBaixa() {
		EstadoRevisao estado = EstadoRevisao.inicial();

		for (int i = 0; i < 10; i++) {
			estado = sm2CalculatorService.calcularNovoEstado(estado, 0);
		}

		assertThat(estado.fatorFacilidade()).isEqualByComparingTo("1.30");
		assertThat(estado.repeticoes()).isZero();
		assertThat(estado.intervaloDias()).isEqualTo(1);
	}

}
