package com.tcc.plataformaestudos.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** UC34/RN43 — Docs/extensao-elaboracao-flashcard.md §5.3. */
class SanitizadorFeedbackAutoexplicacaoTest {

	private static final String TEXTO = "O ventrículo esquerdo é mais grosso porque bombeia sangue pro pulmão, que fica longe.";

	private final ObjectMapper objectMapper = new ObjectMapper();

	private AutoexplicacaoResponseDTO sanitizar(String json, String texto) {
		JsonNode raiz = objectMapper.readTree(json);
		return SanitizadorFeedbackAutoexplicacao.sanitizar(raiz, texto, true);
	}

	@Test
	void deveManterTrechoLiteralEDevolverComAGrafiaOriginalDoEstudante() {
		AutoexplicacaoResponseDTO resposta = sanitizar("""
				{ "veredito": "PARCIAL", "comentarioGeral": "Bom começo.",
				  "anotacoes": [ { "trecho": "VENTRÍCULO   esquerdo", "tipo": "ACERTO", "comentario": "Certo." } ] }
				""", TEXTO);

		assertThat(resposta.veredito()).isEqualTo(VereditoAutoexplicacao.PARCIAL);
		assertThat(resposta.anotacoes()).singleElement()
				.satisfies(anotacao -> assertThat(anotacao.trecho()).isEqualTo("ventrículo esquerdo"));
	}

	@Test
	void deveDescartarTrechoInventadoMantendoAAnotacaoComoNotaGeral() {
		AutoexplicacaoResponseDTO resposta = sanitizar("""
				{ "veredito": "EQUIVOCADA", "comentarioGeral": "Reveja o destino do sangue.",
				  "anotacoes": [ { "trecho": "átrio direito", "tipo": "ERRO", "comentario": "Não é o átrio." } ] }
				""", TEXTO);

		assertThat(resposta.anotacoes()).singleElement().satisfies(anotacao -> {
			assertThat(anotacao.trecho()).isNull();
			assertThat(anotacao.tipo()).isEqualTo(TipoAnotacao.ERRO);
		});
	}

	@Test
	void deveCompararComEspacosNormalizadosQuandoOEstudanteQuebraLinha() {
		AutoexplicacaoResponseDTO resposta = sanitizar("""
				{ "veredito": "PARCIAL", "comentarioGeral": "Ok.",
				  "anotacoes": [ { "trecho": "bombeia sangue", "tipo": "ACERTO", "comentario": "Isso." } ] }
				""", "O ventrículo bombeia\n   sangue para a aorta.");

		assertThat(resposta.anotacoes().get(0).trecho()).isEqualTo("bombeia\n   sangue");
	}

	@Test
	void deveTruncarEmQuatroAnotacoesEDescartarAsComTipoInvalido() {
		AutoexplicacaoResponseDTO resposta = sanitizar("""
				{ "veredito": "PARCIAL", "comentarioGeral": "Ok.",
				  "anotacoes": [
				    { "trecho": "O", "tipo": "SUPER_ERRO", "comentario": "tipo inválido" },
				    { "trecho": null, "tipo": "ACERTO", "comentario": "1" },
				    { "trecho": null, "tipo": "ACERTO", "comentario": "2" },
				    { "trecho": null, "tipo": "ACERTO", "comentario": "3" },
				    { "trecho": null, "tipo": "ACERTO", "comentario": "4" },
				    { "trecho": null, "tipo": "ACERTO", "comentario": "5" } ] }
				""", TEXTO);

		assertThat(resposta.anotacoes()).hasSize(4)
				.extracting(AnotacaoAutoexplicacaoDTO::comentario)
				.containsExactly("1", "2", "3", "4");
	}

	@Test
	void deveOrdenarPelaPosicaoNoTextoComAsSemTrechoNoFim() {
		AutoexplicacaoResponseDTO resposta = sanitizar("""
				{ "veredito": "PARCIAL", "comentarioGeral": "Ok.",
				  "anotacoes": [
				    { "trecho": "pro pulmão", "tipo": "ERRO", "comentario": "b" },
				    { "trecho": "inexistente", "tipo": "IMPRECISAO", "comentario": "c" },
				    { "trecho": "mais grosso", "tipo": "ACERTO", "comentario": "a" } ] }
				""", TEXTO);

		assertThat(resposta.anotacoes()).extracting(AnotacaoAutoexplicacaoDTO::comentario).containsExactly("a", "b", "c");
	}

	@Test
	void deveDescartarTrechoQueSobrepoeOutroJaAceito() {
		AutoexplicacaoResponseDTO resposta = sanitizar("""
				{ "veredito": "PARCIAL", "comentarioGeral": "Ok.",
				  "anotacoes": [
				    { "trecho": "bombeia sangue", "tipo": "ACERTO", "comentario": "a" },
				    { "trecho": "sangue pro pulmão", "tipo": "ERRO", "comentario": "b" } ] }
				""", TEXTO);

		assertThat(resposta.anotacoes().get(0).trecho()).isEqualTo("bombeia sangue");
		assertThat(resposta.anotacoes().get(1).trecho()).isNull();
	}

	@Test
	void deveConverterFaltouEmBrancoParaNulo() {
		AutoexplicacaoResponseDTO resposta = sanitizar("""
				{ "veredito": "consistente", "comentarioGeral": "Perfeito.", "anotacoes": [], "faltou": "  " }
				""", TEXTO);

		assertThat(resposta.veredito()).isEqualTo(VereditoAutoexplicacao.CONSISTENTE);
		assertThat(resposta.faltou()).isNull();
		assertThat(resposta.anotacoes()).isEmpty();
	}

	@Test
	void deveFalharQuandoVereditoForInvalido() {
		assertThatThrownBy(() -> sanitizar("""
				{ "veredito": "OTIMO", "comentarioGeral": "Ok." }
				""", TEXTO)).isInstanceOf(GeracaoElaboracaoException.class);
	}

	@Test
	void deveFalharQuandoComentarioGeralVierEmBranco() {
		assertThatThrownBy(() -> sanitizar("""
				{ "veredito": "PARCIAL", "comentarioGeral": "   " }
				""", TEXTO)).isInstanceOf(GeracaoElaboracaoException.class);
	}

}
