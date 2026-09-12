package com.tcc.plataformaestudos.prontidao;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tcc.plataformaestudos.config.AcessoNegadoException;
import com.tcc.plataformaestudos.dashboard.CriterioDesempenhoFlashcard;
import com.tcc.plataformaestudos.dashboard.DashboardRepository;
import com.tcc.plataformaestudos.dashboard.EstadoProntidaoProjecao;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckRepository;
import com.tcc.plataformaestudos.deck.DeckService;

/** UC31/RN40 — ver Docs/extensao-prontidao-prova.md §8. */
@ExtendWith(MockitoExtension.class)
class ProntidaoProvaServiceTest {

	private static final Long DECK_ID = 10L;
	private static final LocalDate HOJE = LocalDate.now();

	@Mock
	private DeckService deckService;

	@Mock
	private DeckRepository deckRepository;

	@Mock
	private DashboardRepository dashboardRepository;

	@InjectMocks
	private ProntidaoProvaService prontidaoProvaService;

	private Deck deck;

	@BeforeEach
	void configurarDeck() {
		deck = new Deck();
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);
	}

	@Test
	void deveLancarAcessoNegadoExceptionQuandoDeckNaoPertenceAoUsuario() {
		AcessoNegadoException excecao = new AcessoNegadoException("Você não tem permissão para acessar este deck");
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenThrow(excecao);

		assertThatThrownBy(() -> prontidaoProvaService.calcularProntidao(DECK_ID)).isSameAs(excecao);
		assertThatThrownBy(() -> prontidaoProvaService.definirDataAlvo(DECK_ID, HOJE.plusDays(1))).isSameAs(excecao);
	}

	@Test
	void deveLancarExcecaoAoDefinirDataAlvoNoPassadoSemPersistir() {
		assertThatThrownBy(() -> prontidaoProvaService.definirDataAlvo(DECK_ID, HOJE.minusDays(1)))
				.isInstanceOf(DataAlvoProvaInvalidaException.class);

		verify(deckRepository, never()).save(any());
	}

	@Test
	void deveDefinirDataAlvoValidaEPersistir() {
		LocalDate dataAlvo = HOJE.plusDays(10);

		DataAlvoProvaResponseDTO resposta = prontidaoProvaService.definirDataAlvo(DECK_ID, dataAlvo);

		assertThat(resposta.dataAlvo()).isEqualTo(dataAlvo);
		assertThat(deck.getDataAlvoProva()).isEqualTo(dataAlvo);
		verify(deckRepository).save(deck);
	}

	@Test
	void deveRemoverDataAlvoPersistindoNulo() {
		deck.setDataAlvoProva(HOJE.plusDays(5));

		prontidaoProvaService.removerDataAlvo(DECK_ID);

		assertThat(deck.getDataAlvoProva()).isNull();
		verify(deckRepository).save(deck);
	}

	@Test
	void deveLancarExcecaoAoCalcularProntidaoSemDataAlvoDefinida() {
		assertThatThrownBy(() -> prontidaoProvaService.calcularProntidao(DECK_ID))
				.isInstanceOf(DataAlvoProvaNaoDefinidaException.class);
	}

	@Test
	void deveRetornarDtoVazioQuandoDeckNaoTemFlashcards() {
		deck.setDataAlvoProva(HOJE.plusDays(10));
		when(dashboardRepository.buscarUltimaRevisaoParaProntidao(DECK_ID)).thenReturn(List.of());

		ProntidaoProvaResponseDTO resposta = prontidaoProvaService.calcularProntidao(DECK_ID);

		assertThat(resposta.totalFlashcards()).isZero();
		assertThat(resposta.prontidaoGeral()).isEqualByComparingTo(BigDecimal.ZERO);
		assertThat(resposta.topicos()).isEmpty();
		assertThat(resposta.mensagem()).isNotBlank();
	}

	@Test
	void deveAgregarPorTopicoOrdenarPorRetencaoAscendenteEContarPrecisandoRevisao() {
		LocalDate dataAlvo = HOJE.plusDays(30);
		deck.setDataAlvoProva(dataAlvo);

		LocalDateTime revisadoHoje = HOJE.atStartOfDay();

		List<EstadoProntidaoProjecao> estados = List.of(
				// Anatomia: intervalo grande (retencao alta) + intervalo pequeno (retencao baixa)
				new EstadoProntidaoProjecao(1L, "Anatomia", revisadoHoje, 100),
				new EstadoProntidaoProjecao(2L, "Anatomia", revisadoHoje, 5),
				// Fisiologia: nunca revisado -> retencao 0, pior de todos
				new EstadoProntidaoProjecao(3L, "Fisiologia", null, null),
				// Sem categoria (topico nulo): intervalo enorme -> retencao muito alta, melhor de todos
				new EstadoProntidaoProjecao(4L, null, revisadoHoje, 1000));
		when(dashboardRepository.buscarUltimaRevisaoParaProntidao(DECK_ID)).thenReturn(estados);

		ProntidaoProvaResponseDTO resposta = prontidaoProvaService.calcularProntidao(DECK_ID);

		assertThat(resposta.dataAlvoProva()).isEqualTo(dataAlvo);
		assertThat(resposta.diasRestantes()).isEqualTo(30);
		assertThat(resposta.totalFlashcards()).isEqualTo(4);
		assertThat(resposta.topicos()).hasSize(3);

		// ordenado por retencaoMediaEstimada ascendente - pior primeiro
		assertThat(resposta.topicos().get(0).topico()).isEqualTo("Fisiologia");
		assertThat(resposta.topicos().get(resposta.topicos().size() - 1).topico())
				.isEqualTo(CriterioDesempenhoFlashcard.SEM_CATEGORIA);

		TopicoProntidaoDTO anatomia = resposta.topicos().stream()
				.filter(t -> t.topico().equals("Anatomia")).findFirst().orElseThrow();
		assertThat(anatomia.totalFlashcards()).isEqualTo(2);
		assertThat(anatomia.flashcardsPrecisandoRevisao()).isEqualTo(1);

		TopicoProntidaoDTO fisiologia = resposta.topicos().stream()
				.filter(t -> t.topico().equals("Fisiologia")).findFirst().orElseThrow();
		assertThat(fisiologia.retencaoMediaEstimada()).isEqualByComparingTo(BigDecimal.ZERO);
		assertThat(fisiologia.flashcardsPrecisandoRevisao()).isEqualTo(1);

		TopicoProntidaoDTO semCategoria = resposta.topicos().stream()
				.filter(t -> t.topico().equals(CriterioDesempenhoFlashcard.SEM_CATEGORIA)).findFirst().orElseThrow();
		assertThat(semCategoria.flashcardsPrecisandoRevisao()).isZero();

		assertThat(resposta.mensagem()).contains("Fisiologia");
	}

}
