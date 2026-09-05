package com.tcc.plataformaestudos.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tcc.plataformaestudos.config.AcessoNegadoException;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardService;
import com.tcc.plataformaestudos.material.MaterialOrigem;
import com.tcc.plataformaestudos.material.MaterialOrigemRepository;
import com.tcc.plataformaestudos.material.StatusProcessamento;

/**
 * UC14/RN19 — ver Docs/extensao-explicacao-rag-lite.md §6 para o roteiro de
 * teste manual complementar a estes testes unitários.
 */
@ExtendWith(MockitoExtension.class)
class ExplicacaoServiceTest {

	private static final Long FLASHCARD_ID = 100L;
	private static final Long DECK_ID = 10L;

	@Mock
	private FlashcardService flashcardService;

	@Mock
	private MaterialOrigemRepository materialOrigemRepository;

	@Mock
	private GeminiClient geminiClient;

	private ExplicacaoService explicacaoService;

	private Flashcard flashcardComDeck() {
		Deck deck = new Deck();
		deck.setId(DECK_ID);

		Flashcard flashcard = new Flashcard();
		flashcard.setId(FLASHCARD_ID);
		flashcard.setDeck(deck);
		flashcard.setPergunta("O que é mitose?");
		flashcard.setResposta("Divisão celular.");
		return flashcard;
	}

	@org.junit.jupiter.api.BeforeEach
	void configurar() {
		explicacaoService = new ExplicacaoService(flashcardService, materialOrigemRepository, geminiClient);
	}

	@Test
	void deveGerarExplicacaoAncoradaQuandoDeckTemMaterialProcessado() {
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenReturn(flashcardComDeck());

		MaterialOrigem material = new MaterialOrigem();
		material.setTextoExtraido("Texto do PDF sobre divisão celular.");
		when(materialOrigemRepository.findFirstByDeckIdAndStatusProcessamentoAndTextoExtraidoIsNotNullOrderByCriadoEmDesc(
				eq(DECK_ID), eq(StatusProcessamento.PROCESSADO))).thenReturn(Optional.of(material));

		when(geminiClient.gerarConteudo(any())).thenReturn("Explicação ancorada no material.");

		ExplicacaoResponseDTO resposta = explicacaoService.gerarExplicacao(FLASHCARD_ID);

		assertThat(resposta.ancoradaNoMaterial()).isTrue();
		assertThat(resposta.explicacao()).isEqualTo("Explicação ancorada no material.");

		verify(geminiClient).gerarConteudo(org.mockito.ArgumentMatchers.contains("Texto do PDF sobre divisão celular."));
	}

	@Test
	void deveGerarExplicacaoSemAncoragemQuandoDeckNaoTemMaterialProcessado() {
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenReturn(flashcardComDeck());
		when(materialOrigemRepository.findFirstByDeckIdAndStatusProcessamentoAndTextoExtraidoIsNotNullOrderByCriadoEmDesc(
				eq(DECK_ID), eq(StatusProcessamento.PROCESSADO))).thenReturn(Optional.empty());

		when(geminiClient.gerarConteudo(any())).thenReturn("Explicação genérica.");

		ExplicacaoResponseDTO resposta = explicacaoService.gerarExplicacao(FLASHCARD_ID);

		assertThat(resposta.ancoradaNoMaterial()).isFalse();
		assertThat(resposta.explicacao()).isEqualTo("Explicação genérica.");
	}

	@Test
	void deveLancarAcessoNegadoExceptionQuandoFlashcardNaoPertenceAoUsuario() {
		AcessoNegadoException excecao = new AcessoNegadoException("Você não tem permissão para acessar este flashcard");
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenThrow(excecao);

		assertThatThrownBy(() -> explicacaoService.gerarExplicacao(FLASHCARD_ID)).isSameAs(excecao);

		verifyNoInteractions(materialOrigemRepository, geminiClient);
	}

	@Test
	void deveLancarGeracaoExplicacaoExceptionQuandoIaRetornaTextoEmBrancoEmTodasAsTentativas() {
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenReturn(flashcardComDeck());
		when(materialOrigemRepository.findFirstByDeckIdAndStatusProcessamentoAndTextoExtraidoIsNotNullOrderByCriadoEmDesc(
				eq(DECK_ID), eq(StatusProcessamento.PROCESSADO))).thenReturn(Optional.empty());
		when(geminiClient.gerarConteudo(any())).thenReturn("   ");

		assertThatThrownBy(() -> explicacaoService.gerarExplicacao(FLASHCARD_ID))
				.isInstanceOf(GeracaoExplicacaoException.class);

		verify(geminiClient, times(2)).gerarConteudo(any());
	}

	// B10: GeminiClient.gerarConteudo lança GeracaoConteudoIAException (não
	// GeracaoExplicacaoException) para falha real de infraestrutura (timeout,
	// rate limit, rede) — o retry precisa cobrir esse caso, não só resposta em
	// branco.
	@Test
	void deveTentarNovamenteQuandoFalhaDeInfraestruturaNaPrimeiraTentativaESucessoNaSegunda() {
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenReturn(flashcardComDeck());
		when(materialOrigemRepository.findFirstByDeckIdAndStatusProcessamentoAndTextoExtraidoIsNotNullOrderByCriadoEmDesc(
				eq(DECK_ID), eq(StatusProcessamento.PROCESSADO))).thenReturn(Optional.empty());
		when(geminiClient.gerarConteudo(any()))
				.thenThrow(new GeracaoConteudoIAException("Serviço de IA retornou status 429"))
				.thenReturn("Explicação gerada após retry.");

		ExplicacaoResponseDTO resposta = explicacaoService.gerarExplicacao(FLASHCARD_ID);

		assertThat(resposta.explicacao()).isEqualTo("Explicação gerada após retry.");
		verify(geminiClient, times(2)).gerarConteudo(any());
	}

}
