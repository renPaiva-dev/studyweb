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
import java.util.Set;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tcc.plataformaestudos.config.AcessoNegadoException;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardService;
import com.tcc.plataformaestudos.material.MaterialOrigem;
import com.tcc.plataformaestudos.material.MaterialOrigemRepository;
import com.tcc.plataformaestudos.material.StatusProcessamento;

import tools.jackson.databind.ObjectMapper;

/** UC34/RN43 — ver Docs/extensao-elaboracao-flashcard.md §9 para o teste manual. */
@ExtendWith(MockitoExtension.class)
class ElaboracaoServiceTest {

	private static final Long FLASHCARD_ID = 100L;
	private static final Long DECK_ID = 10L;
	private static final String TEXTO_ESTUDANTE = "A mitose divide a célula em duas células iguais.";
	private static final String FEEDBACK_VALIDO = """
			{ "veredito": "CONSISTENTE", "comentarioGeral": "Você acertou o essencial.",
			  "anotacoes": [ { "trecho": "duas células iguais", "tipo": "ACERTO", "comentario": "Isso mesmo." } ],
			  "faltou": null }
			""";

	@Mock
	private FlashcardService flashcardService;

	@Mock
	private MaterialOrigemRepository materialOrigemRepository;

	@Mock
	private GeminiClient geminiClient;

	private ElaboracaoService elaboracaoService;

	@BeforeEach
	void configurar() {
		elaboracaoService = new ElaboracaoService(flashcardService, materialOrigemRepository, geminiClient, new ObjectMapper());
	}

	private Flashcard flashcardComDeck() {
		Deck deck = new Deck();
		deck.setId(DECK_ID);

		Flashcard flashcard = new Flashcard();
		flashcard.setId(FLASHCARD_ID);
		flashcard.setDeck(deck);
		flashcard.setPergunta("O que é mitose?");
		flashcard.setResposta("Divisão celular que gera duas células idênticas.");
		return flashcard;
	}

	private void comMaterial(String textoExtraido) {
		MaterialOrigem material = new MaterialOrigem();
		material.setTextoExtraido(textoExtraido);
		when(materialOrigemRepository.findFirstByDeckIdAndStatusProcessamentoAndTextoExtraidoIsNotNullOrderByCriadoEmDesc(
				eq(DECK_ID), eq(StatusProcessamento.PROCESSADO))).thenReturn(Optional.of(material));
	}

	private void semMaterial() {
		when(materialOrigemRepository.findFirstByDeckIdAndStatusProcessamentoAndTextoExtraidoIsNotNullOrderByCriadoEmDesc(
				eq(DECK_ID), eq(StatusProcessamento.PROCESSADO))).thenReturn(Optional.empty());
	}

	private String promptEnviado() {
		ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
		verify(geminiClient).gerarConteudo(captor.capture());
		return captor.getValue();
	}

	@Test
	void deveGerarFeedbackAncoradoComMaterialETextoDoEstudanteEntreMarcadores() {
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenReturn(flashcardComDeck());
		comMaterial("Texto do PDF sobre mitose.");
		when(geminiClient.gerarConteudo(any())).thenReturn(FEEDBACK_VALIDO);

		AutoexplicacaoResponseDTO resposta = elaboracaoService.gerarFeedbackAutoexplicacao(FLASHCARD_ID, TEXTO_ESTUDANTE);

		assertThat(resposta.ancoradaNoMaterial()).isTrue();
		assertThat(resposta.veredito()).isEqualTo(VereditoAutoexplicacao.CONSISTENTE);
		assertThat(resposta.anotacoes()).singleElement()
				.satisfies(anotacao -> assertThat(anotacao.trecho()).isEqualTo("duas células iguais"));

		String prompt = promptEnviado();
		assertThat(prompt).contains("<<<REFERENCIA", "Texto do PDF sobre mitose.");
		assertThat(prompt).contains("<<<EXPLICACAO_DO_ESTUDANTE\n" + TEXTO_ESTUDANTE + "\nEXPLICACAO_DO_ESTUDANTE>>>");
	}

	@Test
	void deveGerarFeedbackSemAncoragemQuandoDeckNaoTemMaterialProcessado() {
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenReturn(flashcardComDeck());
		semMaterial();
		when(geminiClient.gerarConteudo(any())).thenReturn(FEEDBACK_VALIDO);

		AutoexplicacaoResponseDTO resposta = elaboracaoService.gerarFeedbackAutoexplicacao(FLASHCARD_ID, TEXTO_ESTUDANTE);

		assertThat(resposta.ancoradaNoMaterial()).isFalse();
		assertThat(promptEnviado()).doesNotContain("<<<REFERENCIA");
	}

	@Test
	void devePropagarRn01SemChamarAIaQuandoFlashcardNaoPertenceAoUsuario() {
		AcessoNegadoException excecao = new AcessoNegadoException("Você não tem permissão para acessar este flashcard");
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenThrow(excecao);

		assertThatThrownBy(() -> elaboracaoService.gerarFeedbackAutoexplicacao(FLASHCARD_ID, TEXTO_ESTUDANTE)).isSameAs(excecao);
		assertThatThrownBy(() -> elaboracaoService.gerarAnalogia(FLASHCARD_ID, null)).isSameAs(excecao);

		verifyNoInteractions(materialOrigemRepository, geminiClient);
	}

	@Test
	void deveTentarDeNovoQuandoAPrimeiraRespostaVierComJsonInvalido() {
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenReturn(flashcardComDeck());
		semMaterial();
		when(geminiClient.gerarConteudo(any())).thenReturn("isto não é json", FEEDBACK_VALIDO);

		AutoexplicacaoResponseDTO resposta = elaboracaoService.gerarFeedbackAutoexplicacao(FLASHCARD_ID, TEXTO_ESTUDANTE);

		assertThat(resposta.veredito()).isEqualTo(VereditoAutoexplicacao.CONSISTENTE);
		verify(geminiClient, times(2)).gerarConteudo(any());
	}

	@Test
	void deveTratarVereditoForaDoEnumComoFalhaERetentar() {
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenReturn(flashcardComDeck());
		semMaterial();
		when(geminiClient.gerarConteudo(any())).thenReturn(
				"{ \"veredito\": \"NOTA_10\", \"comentarioGeral\": \"Ok.\" }", FEEDBACK_VALIDO);

		elaboracaoService.gerarFeedbackAutoexplicacao(FLASHCARD_ID, TEXTO_ESTUDANTE);

		verify(geminiClient, times(2)).gerarConteudo(any());
	}

	@Test
	void deveLancarGeracaoElaboracaoExceptionQuandoAsDuasTentativasFalham() {
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenReturn(flashcardComDeck());
		semMaterial();
		when(geminiClient.gerarConteudo(any())).thenReturn("   ");

		assertThatThrownBy(() -> elaboracaoService.gerarFeedbackAutoexplicacao(FLASHCARD_ID, TEXTO_ESTUDANTE))
				.isInstanceOf(GeracaoElaboracaoException.class);

		verify(geminiClient, times(2)).gerarConteudo(any());
	}

	@Test
	void deveGerarAnalogiaAncoradaEIncluirAAnteriorQuandoInformada() {
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenReturn(flashcardComDeck());
		comMaterial("Texto do PDF sobre mitose.");
		when(geminiClient.gerarConteudo(any())).thenReturn(
				"{ \"tipo\": \"EXEMPLO\", \"texto\": \"Como uma fotocopiadora de células.\" }");

		AnalogiaResponseDTO resposta = elaboracaoService.gerarAnalogia(FLASHCARD_ID, "Como dividir uma pizza.");

		assertThat(resposta.tipo()).isEqualTo(TipoAnalogia.EXEMPLO);
		assertThat(resposta.texto()).isEqualTo("Como uma fotocopiadora de células.");
		assertThat(resposta.ancoradaNoMaterial()).isTrue();
		assertThat(promptEnviado()).contains("<<<ANTERIOR\nComo dividir uma pizza.\nANTERIOR>>>");
	}

	@Test
	void deveGerarAnalogiaSemBlocoAnteriorQuandoEvitarForOmitido() {
		when(flashcardService.buscarFlashcardDoUsuarioAutenticado(FLASHCARD_ID)).thenReturn(flashcardComDeck());
		semMaterial();
		when(geminiClient.gerarConteudo(any())).thenReturn("{ \"texto\": \"Como uma fotocopiadora.\" }");

		AnalogiaResponseDTO resposta = elaboracaoService.gerarAnalogia(FLASHCARD_ID, null);

		assertThat(resposta.tipo()).isEqualTo(TipoAnalogia.ANALOGIA);
		assertThat(resposta.ancoradaNoMaterial()).isFalse();
		assertThat(promptEnviado()).doesNotContain("<<<ANTERIOR");
	}

	@Test
	void deveRejeitarTextoDeAutoexplicacaoForaDoTamanhoPermitido() {
		Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

		Set<ConstraintViolation<AutoexplicacaoRequestDTO>> curto = validator.validate(new AutoexplicacaoRequestDTO("a".repeat(19)));
		Set<ConstraintViolation<AutoexplicacaoRequestDTO>> longo = validator.validate(new AutoexplicacaoRequestDTO("a".repeat(1001)));
		Set<ConstraintViolation<AutoexplicacaoRequestDTO>> vazio = validator.validate(new AutoexplicacaoRequestDTO("   "));
		Set<ConstraintViolation<AutoexplicacaoRequestDTO>> valido = validator.validate(new AutoexplicacaoRequestDTO("a".repeat(20)));

		assertThat(curto).isNotEmpty();
		assertThat(longo).isNotEmpty();
		assertThat(vazio).isNotEmpty();
		assertThat(valido).isEmpty();
	}

}
