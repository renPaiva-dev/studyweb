package com.tcc.plataformaestudos.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tcc.plataformaestudos.config.RecursoNaoEncontradoException;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.material.MaterialOrigem;
import com.tcc.plataformaestudos.material.MaterialOrigemRepository;
import com.tcc.plataformaestudos.material.StatusProcessamento;

import tools.jackson.databind.ObjectMapper;

/**
 * UC32/RN41 — ver Docs/extensao-pergunta-material.md §6 para o roteiro de
 * teste manual complementar a estes testes unitários.
 */
@ExtendWith(MockitoExtension.class)
class PerguntaMaterialServiceTest {

	private static final Long DECK_ID = 10L;

	@Mock
	private DeckService deckService;

	@Mock
	private MaterialOrigemRepository materialOrigemRepository;

	@Mock
	private GeminiClient geminiClient;

	private PerguntaMaterialService perguntaMaterialService;

	private Deck deck() {
		Deck deck = new Deck();
		deck.setId(DECK_ID);
		return deck;
	}

	private MaterialOrigem materialProcessado(String nomeArquivo, String texto) {
		MaterialOrigem material = new MaterialOrigem();
		material.setNomeArquivo(nomeArquivo);
		material.setTextoExtraido(texto);
		material.setStatusProcessamento(StatusProcessamento.PROCESSADO);
		return material;
	}

	@BeforeEach
	void configurar() {
		perguntaMaterialService = new PerguntaMaterialService(deckService, materialOrigemRepository, geminiClient, new ObjectMapper());
	}

	@Test
	void deveResponderAncoradaQuandoDeckTemMateriaisProcessados() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck());
		when(materialOrigemRepository.findByDeckIdAndStatusProcessamentoAndTextoExtraidoIsNotNull(
				eq(DECK_ID), eq(StatusProcessamento.PROCESSADO)))
				.thenReturn(List.of(
						materialProcessado("aula1.pdf", "Texto sobre mitose."),
						materialProcessado("aula2.pdf", "Texto sobre meiose.")));
		// GeminiClient força responseMimeType=application/json (ver sua javadoc) -
		// a resposta real nunca é texto puro, mesmo o prompt pedindo isso.
		when(geminiClient.gerarConteudo(any())).thenReturn("{\"resposta\": \"Resposta ancorada nos dois materiais.\"}");

		PerguntaMaterialResponseDTO resposta = perguntaMaterialService.perguntar(
				DECK_ID, new PerguntaMaterialRequestDTO("Qual a diferença entre mitose e meiose?"));

		assertThat(resposta.resposta()).isEqualTo("Resposta ancorada nos dois materiais.");
		assertThat(resposta.materiaisConsultados()).isEqualTo(2);

		ArgumentCaptor<String> promptCapturado = ArgumentCaptor.forClass(String.class);
		verify(geminiClient).gerarConteudo(promptCapturado.capture());
		assertThat(promptCapturado.getValue()).contains("Texto sobre mitose.", "Texto sobre meiose.");
	}

	@Test
	void deveLancarMaterialNaoDisponivelExceptionQuandoDeckNaoTemMaterialProcessado() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck());
		when(materialOrigemRepository.findByDeckIdAndStatusProcessamentoAndTextoExtraidoIsNotNull(
				eq(DECK_ID), eq(StatusProcessamento.PROCESSADO))).thenReturn(List.of());

		assertThatThrownBy(() -> perguntaMaterialService.perguntar(DECK_ID, new PerguntaMaterialRequestDTO("Alguma pergunta?")))
				.isInstanceOf(MaterialNaoDisponivelException.class);

		verifyNoInteractions(geminiClient);
	}

	@Test
	void deveLancarRecursoNaoEncontradoExceptionQuandoDeckNaoPertenceAoUsuario() {
		RecursoNaoEncontradoException excecao = new RecursoNaoEncontradoException("Deck não encontrado");
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenThrow(excecao);

		assertThatThrownBy(() -> perguntaMaterialService.perguntar(DECK_ID, new PerguntaMaterialRequestDTO("Alguma pergunta?")))
				.isSameAs(excecao);

		verifyNoInteractions(materialOrigemRepository, geminiClient);
	}

	@Test
	void deveLancarGeracaoRespostaMaterialExceptionQuandoIaRetornaTextoEmBrancoEmTodasAsTentativas() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck());
		when(materialOrigemRepository.findByDeckIdAndStatusProcessamentoAndTextoExtraidoIsNotNull(
				eq(DECK_ID), eq(StatusProcessamento.PROCESSADO)))
				.thenReturn(List.of(materialProcessado("aula1.pdf", "Texto qualquer.")));
		when(geminiClient.gerarConteudo(any())).thenReturn("   ");

		assertThatThrownBy(() -> perguntaMaterialService.perguntar(DECK_ID, new PerguntaMaterialRequestDTO("Alguma pergunta?")))
				.isInstanceOf(GeracaoRespostaMaterialException.class);

		verify(geminiClient, times(2)).gerarConteudo(any());
	}

	// Regressão: sem interpretar o JSON que o GeminiClient sempre força, o
	// objeto cru vazava pro usuário (mesma classe de bug corrigida em
	// RecomendacaoEstudoService/ExplicacaoService).
	@Test
	void deveExtrairTextoDeDentroDoObjetoJsonRetornadoPelaIa() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck());
		when(materialOrigemRepository.findByDeckIdAndStatusProcessamentoAndTextoExtraidoIsNotNull(
				eq(DECK_ID), eq(StatusProcessamento.PROCESSADO)))
				.thenReturn(List.of(materialProcessado("aula1.pdf", "Texto qualquer.")));
		when(geminiClient.gerarConteudo(any())).thenReturn("{\"resposta\": \"A resposta está no material enviado.\"}");

		PerguntaMaterialResponseDTO resposta = perguntaMaterialService.perguntar(
				DECK_ID, new PerguntaMaterialRequestDTO("Alguma pergunta?"));

		assertThat(resposta.resposta()).isEqualTo("A resposta está no material enviado.");
	}

	@Test
	void deveLancarGeracaoRespostaMaterialExceptionQuandoIaRetornaJsonMalFormado() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck());
		when(materialOrigemRepository.findByDeckIdAndStatusProcessamentoAndTextoExtraidoIsNotNull(
				eq(DECK_ID), eq(StatusProcessamento.PROCESSADO)))
				.thenReturn(List.of(materialProcessado("aula1.pdf", "Texto qualquer.")));
		when(geminiClient.gerarConteudo(any())).thenReturn("Resposta em texto puro, sem JSON.");

		assertThatThrownBy(() -> perguntaMaterialService.perguntar(DECK_ID, new PerguntaMaterialRequestDTO("Alguma pergunta?")))
				.isInstanceOf(GeracaoRespostaMaterialException.class);

		verify(geminiClient, times(2)).gerarConteudo(any());
	}

	// B10: GeminiClient.gerarConteudo lança GeracaoConteudoIAException (não
	// GeracaoRespostaMaterialException) para falha real de infraestrutura
	// (timeout, rate limit, rede) — o retry precisa cobrir esse caso, não só
	// resposta em branco.
	@Test
	void deveTentarNovamenteQuandoFalhaDeInfraestruturaNaPrimeiraTentativaESucessoNaSegunda() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck());
		when(materialOrigemRepository.findByDeckIdAndStatusProcessamentoAndTextoExtraidoIsNotNull(
				eq(DECK_ID), eq(StatusProcessamento.PROCESSADO)))
				.thenReturn(List.of(materialProcessado("aula1.pdf", "Texto qualquer.")));
		when(geminiClient.gerarConteudo(any()))
				.thenThrow(new GeracaoConteudoIAException("Serviço de IA retornou status 429"))
				.thenReturn("{\"resposta\": \"Resposta gerada após retry.\"}");

		PerguntaMaterialResponseDTO resposta = perguntaMaterialService.perguntar(
				DECK_ID, new PerguntaMaterialRequestDTO("Alguma pergunta?"));

		assertThat(resposta.resposta()).isEqualTo("Resposta gerada após retry.");
		verify(geminiClient, times(2)).gerarConteudo(any());
	}

}
