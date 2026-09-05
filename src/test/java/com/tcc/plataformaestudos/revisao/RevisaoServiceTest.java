package com.tcc.plataformaestudos.revisao;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tcc.plataformaestudos.config.AcessoNegadoException;
import com.tcc.plataformaestudos.config.RecursoNaoEncontradoException;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;
import com.tcc.plataformaestudos.flashcard.FlashcardService;
import com.tcc.plataformaestudos.usuario.Usuario;

@ExtendWith(MockitoExtension.class)
class RevisaoServiceTest {

	private static final Long DECK_ID = 10L;
	private static final Long FLASHCARD_ID = 100L;

	@Mock
	private RevisaoFlashcardRepository revisaoFlashcardRepository;

	@Mock
	private FlashcardRepository flashcardRepository;

	@Mock
	private DeckService deckService;

	@Mock
	private FlashcardService flashcardService;

	@Mock
	private Sm2CalculatorService sm2CalculatorService;

	@InjectMocks
	private RevisaoService revisaoService;

	private Flashcard flashcardComId(Long id) {
		Usuario usuario = new Usuario();
		usuario.setId(1L);

		Deck deck = new Deck();
		deck.setId(DECK_ID);
		deck.setUsuario(usuario);

		Flashcard flashcard = new Flashcard();
		flashcard.setId(id);
		flashcard.setDeck(deck);
		flashcard.setPergunta("Pergunta " + id);
		flashcard.setResposta("Resposta " + id);
		return flashcard;
	}

	private RevisaoFlashcard revisaoComEstado(BigDecimal fatorFacilidade, int intervaloDias, int repeticoes, LocalDate proximaRevisao) {
		RevisaoFlashcard revisao = new RevisaoFlashcard();
		revisao.setFatorFacilidade(fatorFacilidade);
		revisao.setIntervaloDias(intervaloDias);
		revisao.setRepeticoes(repeticoes);
		revisao.setProximaRevisao(proximaRevisao);
		return revisao;
	}

	/** B8 — registro de revisão associado a um flashcard específico, para os testes de {@code findByFlashcardIdIn}. */
	private RevisaoFlashcard revisaoDeFlashcard(Flashcard flashcard, LocalDateTime dataRevisao, LocalDate proximaRevisao) {
		RevisaoFlashcard revisao = new RevisaoFlashcard();
		revisao.setFlashcard(flashcard);
		revisao.setDataRevisao(dataRevisao);
		revisao.setFatorFacilidade(new BigDecimal("2.50"));
		revisao.setIntervaloDias(1);
		revisao.setRepeticoes(1);
		revisao.setProximaRevisao(proximaRevisao);
		return revisao;
	}

	@Test
	void deveRetornarFilaDeEstudoOrdenadaPelosMaisAtrasadosPrimeiro() {
		Flashcard flashcardAtrasado5Dias = flashcardComId(1L);
		Flashcard flashcardAtrasado2Dias = flashcardComId(2L);
		Flashcard flashcardNuncaEstudado = flashcardComId(3L);

		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(new Deck());
		when(revisaoFlashcardRepository.findFlashcardsPendentesDeRevisao(eq(DECK_ID), any(LocalDate.class)))
				.thenReturn(List.of(flashcardAtrasado5Dias, flashcardAtrasado2Dias, flashcardNuncaEstudado));

		RevisaoFlashcard revisaoFlashcard1 = revisaoDeFlashcard(
				flashcardAtrasado5Dias, LocalDateTime.now().minusDays(6), LocalDate.now().minusDays(5));
		RevisaoFlashcard revisaoFlashcard2 = revisaoDeFlashcard(
				flashcardAtrasado2Dias, LocalDateTime.now().minusDays(3), LocalDate.now().minusDays(2));
		when(revisaoFlashcardRepository.findByFlashcardIdIn(List.of(1L, 2L, 3L)))
				.thenReturn(List.of(revisaoFlashcard1, revisaoFlashcard2));

		List<FilaEstudoItemDTO> fila = revisaoService.obterFilaDeEstudo(DECK_ID, false);

		assertThat(fila).extracting(FilaEstudoItemDTO::flashcardId)
				.containsExactly(3L, 1L, 2L);

		// B8 — a ordenação busca todas as revisões de uma vez (findByFlashcardIdIn),
		// nunca uma query por comparação do sort.
		verify(revisaoFlashcardRepository, never()).findFirstByFlashcardIdOrderByDataRevisaoDesc(any());
	}

	@Test
	void deveAplicarRn01AoObterFilaDeEstudoENaoConsultarRevisoesQuandoDeckNaoPertenceAoUsuario() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID))
				.thenThrow(new AcessoNegadoException("Você não tem permissão para acessar este deck"));

		assertThatThrownBy(() -> revisaoService.obterFilaDeEstudo(DECK_ID, false))
				.isInstanceOf(AcessoNegadoException.class);

		verify(revisaoFlashcardRepository, never()).findFlashcardsPendentesDeRevisao(any(), any());
	}

	@Test
	void deveIgnorarRn10ETrazerDeckInteiroQuandoIncluirTodosForVerdadeiro() {
		Flashcard flashcard1 = flashcardComId(1L);
		Flashcard flashcard2 = flashcardComId(2L);

		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(new Deck());
		when(flashcardRepository.findByDeckId(DECK_ID)).thenReturn(List.of(flashcard1, flashcard2));
		when(revisaoFlashcardRepository.findByFlashcardIdIn(List.of(1L, 2L))).thenReturn(List.of());

		List<FilaEstudoItemDTO> fila = revisaoService.obterFilaDeEstudo(DECK_ID, true);

		assertThat(fila).extracting(FilaEstudoItemDTO::flashcardId).containsExactlyInAnyOrder(1L, 2L);
		verify(revisaoFlashcardRepository, never()).findFlashcardsPendentesDeRevisao(any(), any());
	}

	@Test
	void devePersistirPrimeiraRevisaoUsandoEstadoInicialQuandoNaoHaHistorico() {
		Flashcard flashcard = flashcardComId(FLASHCARD_ID);
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenReturn(flashcard);
		when(flashcardRepository.findByIdParaAtualizacaoDeRevisao(FLASHCARD_ID)).thenReturn(Optional.of(flashcard));
		when(revisaoFlashcardRepository.findFirstByFlashcardIdOrderByDataRevisaoDesc(FLASHCARD_ID)).thenReturn(Optional.empty());

		EstadoRevisao novoEstado = new EstadoRevisao(new BigDecimal("2.60"), 1, 1);
		when(sm2CalculatorService.calcularNovoEstado(EstadoRevisao.inicial(), 5)).thenReturn(novoEstado);
		when(revisaoFlashcardRepository.save(any(RevisaoFlashcard.class))).thenAnswer(invocation -> {
			RevisaoFlashcard revisao = invocation.getArgument(0);
			revisao.setId(500L);
			return revisao;
		});

		RevisaoResponseDTO resposta = revisaoService.avaliarResposta(FLASHCARD_ID, new AvaliarRespostaRequestDTO(5));

		verify(sm2CalculatorService).calcularNovoEstado(EstadoRevisao.inicial(), 5);
		assertThat(resposta.flashcardId()).isEqualTo(FLASHCARD_ID);
		assertThat(resposta.fatorFacilidade()).isEqualByComparingTo("2.60");
		assertThat(resposta.intervaloDias()).isEqualTo(1);
		assertThat(resposta.repeticoes()).isEqualTo(1);
		assertThat(resposta.proximaRevisao()).isEqualTo(LocalDate.now().plusDays(1));
	}

	@Test
	void deveRecuperarEstadoAnteriorCorretamenteEmRevisaoSubsequente() {
		Flashcard flashcard = flashcardComId(FLASHCARD_ID);
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenReturn(flashcard);
		when(flashcardRepository.findByIdParaAtualizacaoDeRevisao(FLASHCARD_ID)).thenReturn(Optional.of(flashcard));

		RevisaoFlashcard ultimaRevisao = revisaoComEstado(new BigDecimal("2.60"), 6, 2, LocalDate.now());
		when(revisaoFlashcardRepository.findFirstByFlashcardIdOrderByDataRevisaoDesc(FLASHCARD_ID)).thenReturn(Optional.of(ultimaRevisao));

		when(sm2CalculatorService.calcularNovoEstado(any(EstadoRevisao.class), eq(4)))
				.thenReturn(new EstadoRevisao(new BigDecimal("2.60"), 17, 3));
		when(revisaoFlashcardRepository.save(any(RevisaoFlashcard.class))).thenAnswer(invocation -> invocation.getArgument(0));

		revisaoService.avaliarResposta(FLASHCARD_ID, new AvaliarRespostaRequestDTO(4));

		ArgumentCaptor<EstadoRevisao> estadoCapturado = ArgumentCaptor.forClass(EstadoRevisao.class);
		verify(sm2CalculatorService).calcularNovoEstado(estadoCapturado.capture(), eq(4));

		EstadoRevisao estadoUsado = estadoCapturado.getValue();
		assertThat(estadoUsado.fatorFacilidade()).isEqualByComparingTo("2.60");
		assertThat(estadoUsado.intervaloDias()).isEqualTo(6);
		assertThat(estadoUsado.repeticoes()).isEqualTo(2);
	}

	@Test
	void deveAplicarRn01AoAvaliarRespostaSemChamarCalculadoraQuandoFlashcardNaoPertenceAoUsuario() {
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID))
				.thenThrow(new AcessoNegadoException("Você não tem permissão para acessar este flashcard"));

		assertThatThrownBy(() -> revisaoService.avaliarResposta(FLASHCARD_ID, new AvaliarRespostaRequestDTO(5)))
				.isInstanceOf(AcessoNegadoException.class);

		verify(sm2CalculatorService, never()).calcularNovoEstado(any(), anyInt());
		verify(flashcardRepository, never()).findByIdParaAtualizacaoDeRevisao(any());
	}

	/**
	 * B9 — avaliarResposta precisa travar a linha do flashcard (lock
	 * pessimista) ANTES de ler o estado anterior do SM-2, para serializar
	 * avaliações concorrentes do mesmo flashcard. Concorrência real não é
	 * testável num teste unitário; o que se verifica aqui é que o método de
	 * repository com lock é de fato chamado, e chamado antes da leitura do
	 * último estado.
	 */
	@Test
	void deveTravarLinhaDoFlashcardAntesDeLerEstadoAnteriorAoAvaliarResposta() {
		Flashcard flashcard = flashcardComId(FLASHCARD_ID);
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenReturn(flashcard);
		when(flashcardRepository.findByIdParaAtualizacaoDeRevisao(FLASHCARD_ID)).thenReturn(Optional.of(flashcard));
		when(revisaoFlashcardRepository.findFirstByFlashcardIdOrderByDataRevisaoDesc(FLASHCARD_ID)).thenReturn(Optional.empty());
		when(sm2CalculatorService.calcularNovoEstado(EstadoRevisao.inicial(), 5))
				.thenReturn(new EstadoRevisao(new BigDecimal("2.60"), 1, 1));
		when(revisaoFlashcardRepository.save(any(RevisaoFlashcard.class))).thenAnswer(invocation -> invocation.getArgument(0));

		revisaoService.avaliarResposta(FLASHCARD_ID, new AvaliarRespostaRequestDTO(5));

		verify(flashcardRepository).findByIdParaAtualizacaoDeRevisao(FLASHCARD_ID);

		InOrder ordem = inOrder(flashcardRepository, revisaoFlashcardRepository);
		ordem.verify(flashcardRepository).findByIdParaAtualizacaoDeRevisao(FLASHCARD_ID);
		ordem.verify(revisaoFlashcardRepository).findFirstByFlashcardIdOrderByDataRevisaoDesc(FLASHCARD_ID);
	}

	@Test
	void deveLancarExcecaoAoAvaliarRespostaQuandoFlashcardNaoForMaisEncontradoAoTravarALinha() {
		Flashcard flashcard = flashcardComId(FLASHCARD_ID);
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenReturn(flashcard);
		when(flashcardRepository.findByIdParaAtualizacaoDeRevisao(FLASHCARD_ID)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> revisaoService.avaliarResposta(FLASHCARD_ID, new AvaliarRespostaRequestDTO(5)))
				.isInstanceOf(RecursoNaoEncontradoException.class);

		verify(sm2CalculatorService, never()).calcularNovoEstado(any(), anyInt());
		verify(revisaoFlashcardRepository, never()).save(any());
	}

}
