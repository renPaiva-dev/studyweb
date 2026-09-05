package com.tcc.plataformaestudos.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tcc.plataformaestudos.material.MaterialOrigem;
import com.tcc.plataformaestudos.material.MaterialOrigemService;
import com.tcc.plataformaestudos.material.StatusProcessamento;

import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class FlashcardGenerationServiceTest {

	private static final Long MATERIAL_ID = 1L;
	private static final String TEXTO_LONGO_SUFICIENTE =
			"Texto extraído do PDF com conteúdo suficiente para gerar flashcards de estudo.";

	@Mock
	private MaterialOrigemService materialOrigemService;

	@Mock
	private GeminiClient geminiClient;

	private FlashcardGenerationService flashcardGenerationService;

	@BeforeEach
	void configurar() {
		flashcardGenerationService = new FlashcardGenerationService(materialOrigemService, geminiClient, new ObjectMapper());
	}

	private MaterialOrigem materialProcessado() {
		MaterialOrigem material = new MaterialOrigem();
		material.setId(MATERIAL_ID);
		material.setStatusProcessamento(StatusProcessamento.PROCESSADO);
		material.setTextoExtraido(TEXTO_LONGO_SUFICIENTE);
		return material;
	}

	@Test
	void deveGerarSugestoesComSucessoNaPrimeiraTentativa() {
		when(materialOrigemService.buscarMaterialDoUsuarioAutenticado(MATERIAL_ID)).thenReturn(materialProcessado());
		when(geminiClient.gerarConteudo(org.mockito.ArgumentMatchers.any())).thenReturn(
				"[{\"pergunta\":\"O que é mitose?\",\"resposta\":\"Divisão celular.\",\"topico\":\"Biologia\"}]");

		SugestoesFlashcardsResponseDTO resposta = flashcardGenerationService.gerarSugestoes(MATERIAL_ID);

		assertThat(resposta.sugestoes()).hasSize(1);
		assertThat(resposta.sugestoes().get(0).pergunta()).isEqualTo("O que é mitose?");
		assertThat(resposta.sugestoes().get(0).topico()).isEqualTo("Biologia");
		verify(geminiClient, times(1)).gerarConteudo(org.mockito.ArgumentMatchers.any());
	}

	@Test
	void deveGerarSugestaoComTopicoNuloQuandoIaNaoRetornaOCampoTopico() {
		// RN17/UC12: o campo "topico" é pedido no prompt, mas não é
		// obrigatório na resposta da IA — sua ausência não pode quebrar
		// RN08 (limite de sugestões) nem RN05 (fluxo de revisão/confirmação).
		when(materialOrigemService.buscarMaterialDoUsuarioAutenticado(MATERIAL_ID)).thenReturn(materialProcessado());
		when(geminiClient.gerarConteudo(org.mockito.ArgumentMatchers.any())).thenReturn(
				"[{\"pergunta\":\"O que é mitose?\",\"resposta\":\"Divisão celular.\"}]");

		SugestoesFlashcardsResponseDTO resposta = flashcardGenerationService.gerarSugestoes(MATERIAL_ID);

		assertThat(resposta.sugestoes()).hasSize(1);
		assertThat(resposta.sugestoes().get(0).pergunta()).isEqualTo("O que é mitose?");
		assertThat(resposta.sugestoes().get(0).resposta()).isEqualTo("Divisão celular.");
		assertThat(resposta.sugestoes().get(0).topico()).isNull();
	}

	@Test
	void deveLancarMaterialNaoProcessadoExceptionQuandoStatusNaoEhProcessado() {
		MaterialOrigem material = new MaterialOrigem();
		material.setId(MATERIAL_ID);
		material.setStatusProcessamento(StatusProcessamento.ERRO);

		when(materialOrigemService.buscarMaterialDoUsuarioAutenticado(MATERIAL_ID)).thenReturn(material);

		assertThatThrownBy(() -> flashcardGenerationService.gerarSugestoes(MATERIAL_ID))
				.isInstanceOf(MaterialNaoProcessadoException.class);

		verifyNoInteractions(geminiClient);
	}

	@Test
	void deveLancarMaterialNaoProcessadoExceptionQuandoTextoExtraidoEstaVazio() {
		MaterialOrigem material = new MaterialOrigem();
		material.setId(MATERIAL_ID);
		material.setStatusProcessamento(StatusProcessamento.PROCESSADO);
		material.setTextoExtraido(" ");

		when(materialOrigemService.buscarMaterialDoUsuarioAutenticado(MATERIAL_ID)).thenReturn(material);

		assertThatThrownBy(() -> flashcardGenerationService.gerarSugestoes(MATERIAL_ID))
				.isInstanceOf(MaterialNaoProcessadoException.class);

		verifyNoInteractions(geminiClient);
	}

	@Test
	void deveLimitarA15SugestoesConformeRN08MesmoQueIaRetorneMais() {
		StringBuilder json = new StringBuilder("[");
		for (int i = 0; i < 20; i++) {
			if (i > 0) {
				json.append(",");
			}
			json.append("{\"pergunta\":\"Pergunta ").append(i).append("\",\"resposta\":\"Resposta ").append(i).append("\"}");
		}
		json.append("]");

		when(materialOrigemService.buscarMaterialDoUsuarioAutenticado(MATERIAL_ID)).thenReturn(materialProcessado());
		when(geminiClient.gerarConteudo(org.mockito.ArgumentMatchers.any())).thenReturn(json.toString());

		SugestoesFlashcardsResponseDTO resposta = flashcardGenerationService.gerarSugestoes(MATERIAL_ID);

		assertThat(resposta.sugestoes()).hasSize(15);
	}

	@Test
	void deveDescartarSugestoesComPerguntaOuRespostaVazia() {
		when(materialOrigemService.buscarMaterialDoUsuarioAutenticado(MATERIAL_ID)).thenReturn(materialProcessado());
		when(geminiClient.gerarConteudo(org.mockito.ArgumentMatchers.any())).thenReturn(
				"[{\"pergunta\":\"\",\"resposta\":\"Resposta válida\"},"
						+ "{\"pergunta\":\"Pergunta válida\",\"resposta\":\"\"},"
						+ "{\"pergunta\":\"Pergunta ok\",\"resposta\":\"Resposta ok\"}]");

		SugestoesFlashcardsResponseDTO resposta = flashcardGenerationService.gerarSugestoes(MATERIAL_ID);

		assertThat(resposta.sugestoes()).hasSize(1);
		assertThat(resposta.sugestoes().get(0).pergunta()).isEqualTo("Pergunta ok");
	}

	@Test
	void deveTentarNovamenteQuandoJsonMalFormadoNaPrimeiraTentativaESucessoNaSegunda() {
		when(materialOrigemService.buscarMaterialDoUsuarioAutenticado(MATERIAL_ID)).thenReturn(materialProcessado());
		when(geminiClient.gerarConteudo(org.mockito.ArgumentMatchers.any()))
				.thenReturn("isto não é um JSON válido")
				.thenReturn("[{\"pergunta\":\"Pergunta ok\",\"resposta\":\"Resposta ok\"}]");

		SugestoesFlashcardsResponseDTO resposta = flashcardGenerationService.gerarSugestoes(MATERIAL_ID);

		assertThat(resposta.sugestoes()).hasSize(1);
		verify(geminiClient, times(2)).gerarConteudo(org.mockito.ArgumentMatchers.any());
	}

	@Test
	void deveLancarGeracaoFlashcardsExceptionQuandoJsonMalFormadoEmTodasAsTentativas() {
		when(materialOrigemService.buscarMaterialDoUsuarioAutenticado(MATERIAL_ID)).thenReturn(materialProcessado());
		when(geminiClient.gerarConteudo(org.mockito.ArgumentMatchers.any())).thenReturn("isto não é um JSON válido");

		assertThatThrownBy(() -> flashcardGenerationService.gerarSugestoes(MATERIAL_ID))
				.isInstanceOf(GeracaoFlashcardsException.class);

		verify(geminiClient, times(2)).gerarConteudo(org.mockito.ArgumentMatchers.any());
	}

	// B10: GeminiClient.gerarConteudo lança GeracaoConteudoIAException (não
	// GeracaoFlashcardsException) para falha real de infraestrutura (timeout,
	// rate limit, rede) — o retry precisa cobrir esse caso, não só JSON mal
	// formado.
	@Test
	void deveTentarNovamenteQuandoFalhaDeInfraestruturaNaPrimeiraTentativaESucessoNaSegunda() {
		when(materialOrigemService.buscarMaterialDoUsuarioAutenticado(MATERIAL_ID)).thenReturn(materialProcessado());
		when(geminiClient.gerarConteudo(org.mockito.ArgumentMatchers.any()))
				.thenThrow(new GeracaoConteudoIAException("Serviço de IA retornou status 429"))
				.thenReturn("[{\"pergunta\":\"Pergunta ok\",\"resposta\":\"Resposta ok\"}]");

		SugestoesFlashcardsResponseDTO resposta = flashcardGenerationService.gerarSugestoes(MATERIAL_ID);

		assertThat(resposta.sugestoes()).hasSize(1);
		verify(geminiClient, times(2)).gerarConteudo(org.mockito.ArgumentMatchers.any());
	}

	@Test
	void deveLancarGeracaoConteudoIAExceptionQuandoFalhaDeInfraestruturaEmTodasAsTentativas() {
		when(materialOrigemService.buscarMaterialDoUsuarioAutenticado(MATERIAL_ID)).thenReturn(materialProcessado());
		when(geminiClient.gerarConteudo(org.mockito.ArgumentMatchers.any()))
				.thenThrow(new GeracaoConteudoIAException("Falha ao chamar o serviço de IA"));

		assertThatThrownBy(() -> flashcardGenerationService.gerarSugestoes(MATERIAL_ID))
				.isInstanceOf(GeracaoConteudoIAException.class)
				.isNotInstanceOf(GeracaoFlashcardsException.class);

		verify(geminiClient, times(2)).gerarConteudo(org.mockito.ArgumentMatchers.any());
	}

}
