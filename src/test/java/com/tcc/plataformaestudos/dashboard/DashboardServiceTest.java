package com.tcc.plataformaestudos.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tcc.plataformaestudos.config.AcessoNegadoException;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckRepository;
import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.quiz.EstatisticaTentativaProjecao;
import com.tcc.plataformaestudos.quiz.TentativaQuizRepository;
import com.tcc.plataformaestudos.usuario.UsuarioAutenticado;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

	private static final Long DECK_ID = 10L;
	private static final Long USUARIO_ID = 1L;

	@Mock
	private DeckService deckService;

	@Mock
	private DeckRepository deckRepository;

	@Mock
	private DashboardRepository dashboardRepository;

	@Mock
	private TentativaQuizRepository tentativaQuizRepository;

	@AfterEach
	void limparContextoDeSeguranca() {
		SecurityContextHolder.clearContext();
	}

	private void autenticarUsuario() {
		UsuarioAutenticado principal = new UsuarioAutenticado(USUARIO_ID, "ana@email.com");
		var authentication = new UsernamePasswordAuthenticationToken(principal, null, List.of());
		SecurityContextHolder.getContext().setAuthentication(authentication);
	}

	private Deck deckComId(Long id, String titulo) {
		Deck deck = new Deck();
		deck.setId(id);
		deck.setTitulo(titulo);
		return deck;
	}

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

	@Test
	void deveAgregarEvolucaoComRevisoesEmDiasVariados() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(new Deck());

		LocalDate hoje = LocalDate.now();
		LocalDateTime ontemCedo = hoje.minusDays(1).atTime(8, 0);
		LocalDateTime ontemTarde = hoje.minusDays(1).atTime(20, 0);
		LocalDateTime hojeManha = hoje.atTime(9, 0);

		when(dashboardRepository.buscarRevisoesParaEvolucao(eq(DECK_ID), any())).thenReturn(List.of(
				new RevisaoBrutaProjecao(ontemCedo, 4),
				new RevisaoBrutaProjecao(ontemTarde, 5),
				new RevisaoBrutaProjecao(hojeManha, 5)));

		EvolucaoResponseDTO resposta = dashboardService.obterEvolucao(DECK_ID, 7);

		assertThat(resposta.pontos()).hasSize(2);
		assertThat(resposta.pontos().get(0).data()).isEqualTo(hoje.minusDays(1));
		assertThat(resposta.pontos().get(0).mediaQualidade()).isEqualByComparingTo("4.50");
		assertThat(resposta.pontos().get(0).totalRevisoes()).isEqualTo(2L);
		assertThat(resposta.pontos().get(1).data()).isEqualTo(hoje);
		assertThat(resposta.pontos().get(1).mediaQualidade()).isEqualByComparingTo("5.00");
	}

	@Test
	void deveRetornarListaVaziaDeEvolucaoQuandoDeckNaoTemRevisoes() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(new Deck());
		when(dashboardRepository.buscarRevisoesParaEvolucao(eq(DECK_ID), any())).thenReturn(List.of());

		EvolucaoResponseDTO resposta = dashboardService.obterEvolucao(DECK_ID, 30);

		assertThat(resposta.pontos()).isEmpty();
	}

	@Test
	void deveAgruparDetalhamentoPorTopicoIncluindoSemCategoria() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(new Deck());

		LocalDate hoje = LocalDate.now();
		UltimaRevisaoComTopicoProjecao dominadoEmAnatomia =
				new UltimaRevisaoComTopicoProjecao(1L, "Anatomia", 3, 5, hoje.plusDays(10));
		UltimaRevisaoComTopicoProjecao neutroEmAnatomia =
				new UltimaRevisaoComTopicoProjecao(2L, "Anatomia", 1, 4, hoje.plusDays(3));
		UltimaRevisaoComTopicoProjecao semTopico =
				new UltimaRevisaoComTopicoProjecao(3L, null, null, null, null);

		when(dashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(DECK_ID))
				.thenReturn(List.of(dominadoEmAnatomia, neutroEmAnatomia, semTopico));

		TopicosResponseDTO resposta = dashboardService.obterDetalhamentoPorTopico(DECK_ID);

		assertThat(resposta.topicos()).hasSize(2);

		TopicoDashboardDTO anatomia = resposta.topicos().stream()
				.filter(t -> t.topico().equals("Anatomia"))
				.findFirst().orElseThrow();
		assertThat(anatomia.totalFlashcards()).isEqualTo(2);
		assertThat(anatomia.percentualDominado()).isEqualByComparingTo("50.00");

		TopicoDashboardDTO semCategoria = resposta.topicos().stream()
				.filter(t -> t.topico().equals("Sem categoria"))
				.findFirst().orElseThrow();
		assertThat(semCategoria.totalFlashcards()).isEqualTo(1);
		assertThat(semCategoria.percentualDominado()).isEqualByComparingTo("0.00");
	}

	@Test
	void deveTrazerTop5FlashcardsMaisRevisadosQuandoHaMaisDeCinco() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(new Deck());

		List<FlashcardMaisRevisadoProjecao> top5 = List.of(
				new FlashcardMaisRevisadoProjecao(1L, "Pergunta 1", 10L),
				new FlashcardMaisRevisadoProjecao(2L, "Pergunta 2", 9L),
				new FlashcardMaisRevisadoProjecao(3L, "Pergunta 3", 8L),
				new FlashcardMaisRevisadoProjecao(4L, "Pergunta 4", 7L),
				new FlashcardMaisRevisadoProjecao(5L, "Pergunta 5", 6L));

		when(dashboardRepository.buscarFlashcardsMaisRevisados(eq(DECK_ID), any(Pageable.class)))
				.thenReturn(top5);
		when(dashboardRepository.buscarDatasDeRevisoes(DECK_ID)).thenReturn(List.of());

		AtividadeResponseDTO resposta = dashboardService.obterAtividade(DECK_ID);

		assertThat(resposta.flashcardsMaisRevisados()).hasSize(5);
		assertThat(resposta.flashcardsMaisRevisados().get(0).pergunta()).isEqualTo("Pergunta 1");
	}

	@Test
	void deveDistribuirRevisoesPorDiaDaSemanaComTodosOsSeteDiasZeroPreenchidos() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(new Deck());
		when(dashboardRepository.buscarFlashcardsMaisRevisados(eq(DECK_ID), any(Pageable.class)))
				.thenReturn(List.of());

		LocalDateTime segunda = LocalDate.now().with(DayOfWeek.MONDAY).atTime(10, 0);
		when(dashboardRepository.buscarDatasDeRevisoes(DECK_ID))
				.thenReturn(List.of(segunda, segunda, segunda.plusHours(1)));

		AtividadeResponseDTO resposta = dashboardService.obterAtividade(DECK_ID);

		assertThat(resposta.revisoesPorDiaSemana()).hasSize(7);
		assertThat(resposta.revisoesPorDiaSemana())
				.filteredOn(d -> d.diaSemana().equals("SEGUNDA"))
				.first()
				.satisfies(d -> assertThat(d.totalRevisoes()).isEqualTo(3L));
		assertThat(resposta.revisoesPorDiaSemana())
				.filteredOn(d -> d.diaSemana().equals("DOMINGO"))
				.first()
				.satisfies(d -> assertThat(d.totalRevisoes()).isZero());
	}

	@Test
	void deveAplicarRn01NosTresEndpointsDeUc15() {
		// RN01 é centralizada em DeckService.buscarDeckDoUsuarioAutenticado — os
		// três métodos novos chamam esse método antes de qualquer consulta, e
		// propagam a exceção lançada por ele sem capturar.
		DeckService outroDeckService = mock(DeckService.class);
		DashboardService servico = new DashboardService(outroDeckService, deckRepository, dashboardRepository, tentativaQuizRepository);
		AcessoNegadoException excecao = new AcessoNegadoException("Você não tem permissão para acessar este deck");
		when(outroDeckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenThrow(excecao);

		assertThatThrownBy(() -> servico.obterEvolucao(DECK_ID, 7)).isSameAs(excecao);
		assertThatThrownBy(() -> servico.obterDetalhamentoPorTopico(DECK_ID)).isSameAs(excecao);
		assertThatThrownBy(() -> servico.obterAtividade(DECK_ID)).isSameAs(excecao);
	}

	@Test
	void deveRetornarZerosNoDashboardGeralQuandoUsuarioNaoTemDecks() {
		autenticarUsuario();
		when(deckRepository.findByUsuarioId(USUARIO_ID)).thenReturn(List.of());
		when(dashboardRepository.buscarUltimaRevisaoPorUsuario(USUARIO_ID)).thenReturn(List.of());
		when(tentativaQuizRepository.calcularEstatisticasPorUsuario(USUARIO_ID))
				.thenReturn(new EstatisticaTentativaProjecao(0L, null));
		when(dashboardRepository.buscarDatasDeRevisoesPorUsuario(USUARIO_ID)).thenReturn(List.of());

		DashboardGeralResponseDTO resposta = dashboardService.obterDashboardGeral();

		assertThat(resposta.totalDecks()).isZero();
		assertThat(resposta.totalFlashcards()).isZero();
		assertThat(resposta.percentualDominadoGeral()).isEqualByComparingTo("0.00");
		assertThat(resposta.percentualEmRiscoGeral()).isEqualByComparingTo("0.00");
		assertThat(resposta.totalTentativasQuiz()).isZero();
		assertThat(resposta.pontuacaoMediaQuiz()).isEqualByComparingTo("0.00");
		assertThat(resposta.streakDias()).isZero();
		assertThat(resposta.decks()).isEmpty();
	}

	@Test
	void deveAgregarMultiplosDecksComRankingOrdenadoPorPercentualDominado() {
		autenticarUsuario();

		Deck deckA = deckComId(1L, "Anatomia");
		Deck deckB = deckComId(2L, "Fisiologia");
		Deck deckVazio = deckComId(3L, "Sem flashcards");

		when(deckRepository.findByUsuarioId(USUARIO_ID)).thenReturn(List.of(deckA, deckB, deckVazio));

		LocalDate hoje = LocalDate.now();
		// deckA: 2 dominados em 2 -> 100%
		UltimaRevisaoDoUsuarioProjecao dominadoA1 = new UltimaRevisaoDoUsuarioProjecao(1L, "Anatomia", 3, 5, hoje.plusDays(5));
		UltimaRevisaoDoUsuarioProjecao dominadoA2 = new UltimaRevisaoDoUsuarioProjecao(1L, "Anatomia", 4, 4, hoje.plusDays(5));
		// deckB: 1 dominado em 4 -> 25%
		UltimaRevisaoDoUsuarioProjecao dominadoB = new UltimaRevisaoDoUsuarioProjecao(2L, "Fisiologia", 3, 5, hoje.plusDays(5));
		UltimaRevisaoDoUsuarioProjecao neutroB1 = new UltimaRevisaoDoUsuarioProjecao(2L, "Fisiologia", 1, 4, hoje.plusDays(5));
		UltimaRevisaoDoUsuarioProjecao neutroB2 = new UltimaRevisaoDoUsuarioProjecao(2L, "Fisiologia", 1, 4, hoje.plusDays(5));
		UltimaRevisaoDoUsuarioProjecao emRiscoB = new UltimaRevisaoDoUsuarioProjecao(2L, "Fisiologia", 0, 1, hoje.plusDays(5));

		when(dashboardRepository.buscarUltimaRevisaoPorUsuario(USUARIO_ID)).thenReturn(
				List.of(dominadoA1, dominadoA2, dominadoB, neutroB1, neutroB2, emRiscoB));

		when(tentativaQuizRepository.calcularEstatisticasPorUsuario(USUARIO_ID))
				.thenReturn(new EstatisticaTentativaProjecao(4L, 75.5));
		when(dashboardRepository.buscarDatasDeRevisoesPorUsuario(USUARIO_ID)).thenReturn(List.of(
				hoje.atTime(9, 0), hoje.minusDays(1).atTime(9, 0), hoje.minusDays(2).atTime(9, 0)));

		DashboardGeralResponseDTO resposta = dashboardService.obterDashboardGeral();

		assertThat(resposta.totalDecks()).isEqualTo(3);
		assertThat(resposta.totalFlashcards()).isEqualTo(6);
		// 3 dominados em 6 no total = 50%
		assertThat(resposta.percentualDominadoGeral()).isEqualByComparingTo("50.00");
		assertThat(resposta.totalTentativasQuiz()).isEqualTo(4L);
		assertThat(resposta.pontuacaoMediaQuiz()).isEqualByComparingTo("75.50");
		assertThat(resposta.streakDias()).isEqualTo(3);

		assertThat(resposta.decks()).hasSize(3);
		assertThat(resposta.decks().get(0).titulo()).isEqualTo("Anatomia");
		assertThat(resposta.decks().get(0).percentualDominado()).isEqualByComparingTo("100.00");
		assertThat(resposta.decks().get(1).titulo()).isEqualTo("Fisiologia");
		assertThat(resposta.decks().get(1).percentualDominado()).isEqualByComparingTo("25.00");
		assertThat(resposta.decks().get(2).titulo()).isEqualTo("Sem flashcards");
		assertThat(resposta.decks().get(2).percentualDominado()).isEqualByComparingTo("0.00");
	}

	@Test
	void deveQuebrarStreakQuandoHaUmDiaSemRevisaoNoMeio() {
		autenticarUsuario();
		when(deckRepository.findByUsuarioId(USUARIO_ID)).thenReturn(List.of());
		when(dashboardRepository.buscarUltimaRevisaoPorUsuario(USUARIO_ID)).thenReturn(List.of());
		when(tentativaQuizRepository.calcularEstatisticasPorUsuario(USUARIO_ID))
				.thenReturn(new EstatisticaTentativaProjecao(0L, null));

		LocalDate hoje = LocalDate.now();
		// hoje e ontem com revisao, anteontem SEM revisao (lacuna), 3 dias atras com revisao de novo.
		when(dashboardRepository.buscarDatasDeRevisoesPorUsuario(USUARIO_ID)).thenReturn(List.of(
				hoje.atTime(9, 0), hoje.minusDays(1).atTime(9, 0), hoje.minusDays(3).atTime(9, 0)));

		DashboardGeralResponseDTO resposta = dashboardService.obterDashboardGeral();

		assertThat(resposta.streakDias()).isEqualTo(2);
	}

}
