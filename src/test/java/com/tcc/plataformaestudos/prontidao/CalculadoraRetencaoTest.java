package com.tcc.plataformaestudos.prontidao;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;

/** UC31/RN40 — ver Docs/extensao-prontidao-prova.md §8. */
class CalculadoraRetencaoTest {

	private static final LocalDateTime DATA_REVISAO = LocalDateTime.of(2026, 1, 1, 10, 0);

	@Test
	void deveRetornarZeroQuandoFlashcardNuncaFoiRevisado() {
		double retencao = CalculadoraRetencao.estimarRetencao(null, 10, LocalDate.of(2026, 1, 15));

		assertThat(retencao).isZero();
	}

	@Test
	void deveRetornarRetencaoTotalQuandoDataAlvoEhOMesmoDiaDaUltimaRevisao() {
		double retencao = CalculadoraRetencao.estimarRetencao(DATA_REVISAO, 10, DATA_REVISAO.toLocalDate());

		assertThat(retencao).isEqualTo(1.0, within(0.0001));
	}

	@Test
	void deveRetornarAproximadamenteNoventaPorCentoQuandoDataAlvoEhExatamenteOIntervalo() {
		double retencao = CalculadoraRetencao.estimarRetencao(DATA_REVISAO, 10, DATA_REVISAO.toLocalDate().plusDays(10));

		assertThat(retencao).isEqualTo(0.9, within(0.0001));
	}

	@Test
	void deveRetornarAproximadamenteOitentaEUmPorCentoQuandoDataAlvoEhODobroDoIntervalo() {
		double retencao = CalculadoraRetencao.estimarRetencao(DATA_REVISAO, 10, DATA_REVISAO.toLocalDate().plusDays(20));

		assertThat(retencao).isEqualTo(0.81, within(0.0001));
	}

	@Test
	void naoDeveLancarExcecaoQuandoIntervaloDiasEhZero() {
		double retencao = CalculadoraRetencao.estimarRetencao(DATA_REVISAO, 0, DATA_REVISAO.toLocalDate().plusDays(1));

		assertThat(retencao).isBetween(0.0, 1.0);
	}

	@Test
	void deveLimitarDiasDecorridosAZeroQuandoDataAlvoEhAnteriorAUltimaRevisao() {
		double retencao = CalculadoraRetencao.estimarRetencao(DATA_REVISAO, 10, DATA_REVISAO.toLocalDate().minusDays(5));

		assertThat(retencao).isEqualTo(1.0, within(0.0001));
	}

}
