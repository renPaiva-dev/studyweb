package com.tcc.plataformaestudos.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tcc.plataformaestudos.config.AcessoNegadoException;
import com.tcc.plataformaestudos.dashboard.DashboardRepository;
import com.tcc.plataformaestudos.dashboard.UltimaRevisaoComTopicoProjecao;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;

import tools.jackson.databind.ObjectMapper;

/**
 * UC13/RN18 — ver Docs/extensao-recomendacao-foco-estudo.md §7 para a lista
 * de casos cobertos.
 */
@ExtendWith(MockitoExtension.class)
class RecomendacaoEstudoServiceTest {

	private static final Long DECK_ID = 10L;
	private static final LocalDate HOJE = LocalDate.now();

	@Mock
	private DeckService deckService;

	@Mock
	private DashboardRepository dashboardRepository;

	@Mock
	private FlashcardRepository flashcardRepository;

	@Mock
	private GeminiClient geminiClient;

	// Real, não mock: precisa interpretar o JSON de verdade (ver
	// RecomendacaoEstudoService.interpretarResposta), não apenas registrar chamadas.
	@Spy
	private ObjectMapper objectMapper = new ObjectMapper();

	@InjectMocks
	private RecomendacaoEstudoService recomendacaoEstudoService;

	@BeforeEach
	void configurarDeck() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(new Deck());
	}

	private UltimaRevisaoComTopicoProjecao emRiscoPorQualidadeBaixa(long flashcardId, String topico) {
		return new UltimaRevisaoComTopicoProjecao(flashcardId, topico, 0, 1, HOJE.plusDays(5));
	}

	private UltimaRevisaoComTopicoProjecao dominado(long flashcardId, String topico) {
		return new UltimaRevisaoComTopicoProjecao(flashcardId, topico, 3, 5, HOJE.plusDays(10));
	}

	@Test
	void deveChamarIaERetornarRecomendacaoQuandoTopicoAtingeOLimiarDeFlashcardsEmRisco() {
		List<UltimaRevisaoComTopicoProjecao> estados = List.of(
				emRiscoPorQualidadeBaixa(1L, "Anatomia"),
				emRiscoPorQualidadeBaixa(2L, "Anatomia"),
				emRiscoPorQualidadeBaixa(3L, "Anatomia"),
				dominado(4L, "Anatomia"),
				emRiscoPorQualidadeBaixa(5L, "Fisiologia"));
		when(dashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(DECK_ID)).thenReturn(estados);

		Flashcard flashcard = new Flashcard();
		flashcard.setPergunta("O que é a mitose?");
		when(flashcardRepository.findAllById(anyList())).thenReturn(List.of(flashcard));
		// GeminiClient força responseMimeType=application/json (ver sua javadoc) -
		// a resposta real nunca é texto puro, mesmo o prompt pedindo isso.
		when(geminiClient.gerarConteudo(any())).thenReturn("{\"recomendacao\": \"Foque em revisar os conceitos básicos de Anatomia.\"}");

		RecomendacaoEstudoResponseDTO resposta = recomendacaoEstudoService.gerarRecomendacao(DECK_ID);

		assertThat(resposta.baseadoEmDados()).isTrue();
		assertThat(resposta.topicoFoco()).isEqualTo("Anatomia");
		assertThat(resposta.recomendacao()).isEqualTo("Foque em revisar os conceitos básicos de Anatomia.");
		verify(geminiClient, times(1)).gerarConteudo(any());
	}

	// Limiar = 2 (revisado de 3 — ver javadoc de LIMIAR_MINIMO_FLASHCARDS_EM_RISCO):
	// granularidade de tópico típica de um deck real raramente concentra 3+
	// cartões em risco no mesmo tópico; 2 já preserva a intenção da RN
	// (1 cartão isolado não conta como "concentração", ver o teste abaixo).
	@Test
	void deveChamarIaQuandoTopicoTemExatamenteDoisFlashcardsEmRisco() {
		List<UltimaRevisaoComTopicoProjecao> estados = List.of(
				emRiscoPorQualidadeBaixa(1L, "Anatomia"),
				emRiscoPorQualidadeBaixa(2L, "Anatomia"),
				dominado(3L, "Anatomia"));
		when(dashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(DECK_ID)).thenReturn(estados);

		Flashcard flashcard = new Flashcard();
		flashcard.setPergunta("O que é a mitose?");
		when(flashcardRepository.findAllById(anyList())).thenReturn(List.of(flashcard));
		when(geminiClient.gerarConteudo(any())).thenReturn("{\"recomendacao\": \"Foque em Anatomia.\"}");

		RecomendacaoEstudoResponseDTO resposta = recomendacaoEstudoService.gerarRecomendacao(DECK_ID);

		assertThat(resposta.baseadoEmDados()).isTrue();
		assertThat(resposta.topicoFoco()).isEqualTo("Anatomia");
	}

	@Test
	void deveRetornarMensagemPadraoSemChamarIaQuandoNenhumFlashcardEstaEmRisco() {
		List<UltimaRevisaoComTopicoProjecao> estados = List.of(dominado(1L, "Anatomia"), dominado(2L, "Anatomia"));
		when(dashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(DECK_ID)).thenReturn(estados);

		RecomendacaoEstudoResponseDTO resposta = recomendacaoEstudoService.gerarRecomendacao(DECK_ID);

		assertThat(resposta.baseadoEmDados()).isFalse();
		assertThat(resposta.topicoFoco()).isNull();
		assertThat(resposta.recomendacao()).isNotBlank();
		verifyNoInteractions(geminiClient);
	}

	@Test
	void deveRetornarMensagemPadraoQuandoTopicoVencedorFicaAbaixoDoLimiarMinimo() {
		// Limiar = 2 (ver LIMIAR_MINIMO_FLASHCARDS_EM_RISCO): 1 flashcard em risco
		// isolado não é "concentração" — fica abaixo do limiar.
		List<UltimaRevisaoComTopicoProjecao> estados = List.of(
				emRiscoPorQualidadeBaixa(1L, "Anatomia"),
				dominado(2L, "Anatomia"),
				dominado(3L, "Anatomia"));
		when(dashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(DECK_ID)).thenReturn(estados);

		RecomendacaoEstudoResponseDTO resposta = recomendacaoEstudoService.gerarRecomendacao(DECK_ID);

		assertThat(resposta.baseadoEmDados()).isFalse();
		assertThat(resposta.topicoFoco()).isNull();
		verifyNoInteractions(geminiClient);
	}

	@Test
	void deveTratarFlashcardsSemTopicoComoDadosInsuficientesMesmoComMuitosEmRisco() {
		List<UltimaRevisaoComTopicoProjecao> estados = List.of(
				emRiscoPorQualidadeBaixa(1L, null),
				emRiscoPorQualidadeBaixa(2L, null),
				emRiscoPorQualidadeBaixa(3L, null),
				emRiscoPorQualidadeBaixa(4L, null));
		when(dashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(DECK_ID)).thenReturn(estados);

		RecomendacaoEstudoResponseDTO resposta = recomendacaoEstudoService.gerarRecomendacao(DECK_ID);

		assertThat(resposta.baseadoEmDados()).isFalse();
		assertThat(resposta.topicoFoco()).isNull();
		verifyNoInteractions(geminiClient);
	}

	@Test
	void deveEscolherTopicoComMaiorContagemAbsolutaDeFlashcardsEmRiscoEmVezDoMaiorPercentual() {
		// "Fisiologia" tem 100% em risco (1 de 1), mas "Anatomia" tem mais
		// flashcards em risco em termos absolutos (3 de 4) — RN18/seção 1 da
		// spec: concentração = contagem absoluta, não percentual.
		List<UltimaRevisaoComTopicoProjecao> estados = List.of(
				emRiscoPorQualidadeBaixa(1L, "Anatomia"),
				emRiscoPorQualidadeBaixa(2L, "Anatomia"),
				emRiscoPorQualidadeBaixa(3L, "Anatomia"),
				dominado(4L, "Anatomia"),
				emRiscoPorQualidadeBaixa(5L, "Fisiologia"));
		when(dashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(DECK_ID)).thenReturn(estados);
		when(flashcardRepository.findAllById(anyList())).thenReturn(List.of());
		when(geminiClient.gerarConteudo(any())).thenReturn("{\"recomendacao\": \"Recomendação qualquer.\"}");

		RecomendacaoEstudoResponseDTO resposta = recomendacaoEstudoService.gerarRecomendacao(DECK_ID);

		assertThat(resposta.topicoFoco()).isEqualTo("Anatomia");
	}

	@Test
	void deveLancarAcessoNegadoExceptionQuandoDeckNaoPertenceAoUsuario() {
		AcessoNegadoException excecao = new AcessoNegadoException("Você não tem permissão para acessar este deck");
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenThrow(excecao);

		assertThatThrownBy(() -> recomendacaoEstudoService.gerarRecomendacao(DECK_ID)).isSameAs(excecao);

		verifyNoInteractions(dashboardRepository, geminiClient);
	}

	@Test
	void deveLancarGeracaoRecomendacaoExceptionQuandoIaRetornaTextoEmBranco() {
		List<UltimaRevisaoComTopicoProjecao> estados = List.of(
				emRiscoPorQualidadeBaixa(1L, "Anatomia"),
				emRiscoPorQualidadeBaixa(2L, "Anatomia"),
				emRiscoPorQualidadeBaixa(3L, "Anatomia"));
		when(dashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(DECK_ID)).thenReturn(estados);
		when(flashcardRepository.findAllById(anyList())).thenReturn(List.of());
		when(geminiClient.gerarConteudo(any())).thenReturn("   ");

		assertThatThrownBy(() -> recomendacaoEstudoService.gerarRecomendacao(DECK_ID))
				.isInstanceOf(GeracaoRecomendacaoException.class);

		verify(geminiClient, times(2)).gerarConteudo(any());
	}

	// Regressão: GeminiClient força responseMimeType=application/json em toda
	// chamada, mesmo o prompt desta feature pedindo apenas texto simples -
	// sem interpretar o JSON, o objeto cru (ex.: {"recomendacao": "..."})
	// vazava para a tela. Ver RecomendacaoEstudoService.interpretarResposta.
	@Test
	void deveExtrairTextoDeDentroDoObjetoJsonRetornadoPelaIa() {
		List<UltimaRevisaoComTopicoProjecao> estados = List.of(
				emRiscoPorQualidadeBaixa(1L, "Anatomia"),
				emRiscoPorQualidadeBaixa(2L, "Anatomia"),
				emRiscoPorQualidadeBaixa(3L, "Anatomia"));
		when(dashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(DECK_ID)).thenReturn(estados);
		when(flashcardRepository.findAllById(anyList())).thenReturn(List.of());
		when(geminiClient.gerarConteudo(any()))
				.thenReturn("{\"recomendacao\": \"Priorize os cartões de Anatomia hoje.\"}");

		RecomendacaoEstudoResponseDTO resposta = recomendacaoEstudoService.gerarRecomendacao(DECK_ID);

		assertThat(resposta.recomendacao()).isEqualTo("Priorize os cartões de Anatomia hoje.");
	}

	@Test
	void deveLancarGeracaoRecomendacaoExceptionQuandoIaRetornaJsonMalFormado() {
		List<UltimaRevisaoComTopicoProjecao> estados = List.of(
				emRiscoPorQualidadeBaixa(1L, "Anatomia"),
				emRiscoPorQualidadeBaixa(2L, "Anatomia"),
				emRiscoPorQualidadeBaixa(3L, "Anatomia"));
		when(dashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(DECK_ID)).thenReturn(estados);
		when(flashcardRepository.findAllById(anyList())).thenReturn(List.of());
		when(geminiClient.gerarConteudo(any())).thenReturn("Foque em Anatomia.");

		assertThatThrownBy(() -> recomendacaoEstudoService.gerarRecomendacao(DECK_ID))
				.isInstanceOf(GeracaoRecomendacaoException.class);

		verify(geminiClient, times(2)).gerarConteudo(any());
	}

	@Test
	void deveTentarNovamenteQuandoIaRetornaTextoEmBrancoNaPrimeiraTentativaESucessoNaSegunda() {
		List<UltimaRevisaoComTopicoProjecao> estados = List.of(
				emRiscoPorQualidadeBaixa(1L, "Anatomia"),
				emRiscoPorQualidadeBaixa(2L, "Anatomia"),
				emRiscoPorQualidadeBaixa(3L, "Anatomia"));
		when(dashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(DECK_ID)).thenReturn(estados);
		when(flashcardRepository.findAllById(anyList())).thenReturn(List.of());
		when(geminiClient.gerarConteudo(any()))
				.thenReturn("")
				.thenReturn("{\"recomendacao\": \"Foque em Anatomia.\"}");

		RecomendacaoEstudoResponseDTO resposta = recomendacaoEstudoService.gerarRecomendacao(DECK_ID);

		assertThat(resposta.recomendacao()).isEqualTo("Foque em Anatomia.");
		verify(geminiClient, times(2)).gerarConteudo(any());
	}

	// B10: GeminiClient.gerarConteudo lança GeracaoConteudoIAException (não
	// GeracaoRecomendacaoException) para falha real de infraestrutura (timeout,
	// rate limit, rede) — o retry precisa cobrir esse caso, não só resposta em
	// branco.
	@Test
	void deveTentarNovamenteQuandoFalhaDeInfraestruturaNaPrimeiraTentativaESucessoNaSegunda() {
		List<UltimaRevisaoComTopicoProjecao> estados = List.of(
				emRiscoPorQualidadeBaixa(1L, "Anatomia"),
				emRiscoPorQualidadeBaixa(2L, "Anatomia"),
				emRiscoPorQualidadeBaixa(3L, "Anatomia"));
		when(dashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(DECK_ID)).thenReturn(estados);
		when(flashcardRepository.findAllById(anyList())).thenReturn(List.of());
		when(geminiClient.gerarConteudo(any()))
				.thenThrow(new com.tcc.plataformaestudos.ia.GeracaoConteudoIAException("Serviço de IA retornou status 429"))
				.thenReturn("{\"recomendacao\": \"Foque em Anatomia.\"}");

		RecomendacaoEstudoResponseDTO resposta = recomendacaoEstudoService.gerarRecomendacao(DECK_ID);

		assertThat(resposta.recomendacao()).isEqualTo("Foque em Anatomia.");
		verify(geminiClient, times(2)).gerarConteudo(any());
	}

}
