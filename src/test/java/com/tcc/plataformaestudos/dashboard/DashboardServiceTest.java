package com.tcc.plataformaestudos.dashboard;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckService;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

	private static final Long DECK_ID = 10L;

	@Mock
	private DeckService deckService;

	@Mock
	private DashboardRepository dashboardRepository;

	@InjectMocks
	private DashboardService dashboardService;

	@Test
	void deveRetornarZeroPorCentoQuandoDeckNaoTemFlashcards() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(new Deck());
		when(dashboardRepository.buscarUltimaRevisaoPorFlashcard(DECK_ID)).thenReturn(List.of());

		DashboardResponseDTO resposta = dashboardService.obterDashboard(DECK_ID);

		assertThat(resposta.totalFlashcards()).isZero();
		assertThat(resposta.percentualDominado()).isEqualByComparingTo("0.00");
		assertThat(resposta.percentualEmRisco()).isEqualByComparingTo("0.00");
	}

	@Test
	void deveCalcularPercentuaisComMixDeFlashcardsDominadosEmRiscoENeutros() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(new Deck());

		LocalDate hoje = LocalDate.now();

		UltimaRevisaoProjecao dominado = new UltimaRevisaoProjecao(1L, 3, 5, hoje.plusDays(10));
		UltimaRevisaoProjecao emRiscoPorQualidadeBaixa = new UltimaRevisaoProjecao(2L, 0, 1, hoje.plusDays(1));
		UltimaRevisaoProjecao emRiscoPorAtraso = new UltimaRevisaoProjecao(3L, 2, 4, hoje.minusDays(10));
		UltimaRevisaoProjecao neutro = new UltimaRevisaoProjecao(4L, 1, 4, hoje.plusDays(3));

		when(dashboardRepository.buscarUltimaRevisaoPorFlashcard(DECK_ID))
				.thenReturn(List.of(dominado, emRiscoPorQualidadeBaixa, emRiscoPorAtraso, neutro));

		DashboardResponseDTO resposta = dashboardService.obterDashboard(DECK_ID);

		assertThat(resposta.totalFlashcards()).isEqualTo(4);
		// 1 dominado em 4 = 25%
		assertThat(resposta.percentualDominado()).isEqualByComparingTo("25.00");
		// 2 em risco em 4 = 50%
		assertThat(resposta.percentualEmRisco()).isEqualByComparingTo("50.00");
	}

	@Test
	void naoDeveContarFlashcardNuncaRevisadoComoDominadoNemEmRiscoENaoDeveLancarErro() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(new Deck());

		UltimaRevisaoProjecao nuncaRevisado = new UltimaRevisaoProjecao(1L, null, null, null);

		when(dashboardRepository.buscarUltimaRevisaoPorFlashcard(DECK_ID)).thenReturn(List.of(nuncaRevisado));

		DashboardResponseDTO resposta = dashboardService.obterDashboard(DECK_ID);

		assertThat(resposta.totalFlashcards()).isEqualTo(1);
		assertThat(resposta.percentualDominado()).isEqualByComparingTo("0.00");
		assertThat(resposta.percentualEmRisco()).isEqualByComparingTo("0.00");
	}

}
