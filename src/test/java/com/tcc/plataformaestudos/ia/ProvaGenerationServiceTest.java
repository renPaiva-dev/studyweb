package com.tcc.plataformaestudos.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.quiz.EstiloProva;

import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class ProvaGenerationServiceTest {

	@Mock
	private GeminiClient geminiClient;

	private ProvaGenerationService provaGenerationService;

	@BeforeEach
	void configurar() {
		provaGenerationService = new ProvaGenerationService(geminiClient, new ObjectMapper());
	}

	private Flashcard flashcard(String pergunta, String resposta) {
		Flashcard flashcard = new Flashcard();
		flashcard.setPergunta(pergunta);
		flashcard.setResposta(resposta);
		return flashcard;
	}

	@Test
	void deveGerarQuestoesComSucessoNaPrimeiraTentativa() {
		when(geminiClient.gerarConteudo(any())).thenReturn(
				"[{\"enunciado\":\"Qual estrutura leva sangue oxigenado ao corpo?\","
						+ "\"alternativas\":[\"Aorta\",\"Veia cava\",\"Artéria pulmonar\",\"Veia porta\"],"
						+ "\"respostaCorreta\":\"Aorta\","
						+ "\"explicacao\":\"A aorta parte do ventrículo esquerdo e distribui sangue oxigenado.\"}]");

		List<ProvaSugestaoDTO> questoes = provaGenerationService.gerarQuestoes(
				List.of(flashcard("O que é a aorta?", "A maior artéria do corpo")), EstiloProva.ENEM);

		assertThat(questoes).hasSize(1);
		assertThat(questoes.get(0).respostaCorreta()).isEqualTo("Aorta");
		assertThat(questoes.get(0).alternativas()).hasSize(4);
		verify(geminiClient, times(1)).gerarConteudo(any());
	}

	@Test
	void deveDescartarQuestaoQuandoRespostaCorretaNaoEstaEntreAsAlternativas() {
		when(geminiClient.gerarConteudo(any())).thenReturn(
				"[{\"enunciado\":\"Pergunta\",\"alternativas\":[\"A\",\"B\",\"C\",\"D\"],"
						+ "\"respostaCorreta\":\"Não está na lista\",\"explicacao\":\"Explicação\"},"
						+ "{\"enunciado\":\"Pergunta válida\",\"alternativas\":[\"A\",\"B\",\"C\",\"D\"],"
						+ "\"respostaCorreta\":\"B\",\"explicacao\":\"Explicação válida\"}]");

		List<ProvaSugestaoDTO> questoes = provaGenerationService.gerarQuestoes(
				List.of(flashcard("Pergunta", "Resposta")), EstiloProva.GERAL);

		assertThat(questoes).hasSize(1);
		assertThat(questoes.get(0).enunciado()).isEqualTo("Pergunta válida");
	}

	@Test
	void deveDescartarQuestaoSemExplicacao() {
		when(geminiClient.gerarConteudo(any())).thenReturn(
				"[{\"enunciado\":\"Pergunta\",\"alternativas\":[\"A\",\"B\",\"C\",\"D\"],"
						+ "\"respostaCorreta\":\"A\",\"explicacao\":\"\"}]");

		assertThatThrownBy(() -> provaGenerationService.gerarQuestoes(List.of(flashcard("P", "R")), EstiloProva.VESTIBULAR))
				.isInstanceOf(GeracaoProvaException.class);
	}

	@Test
	void deveDescartarQuestaoComNumeroDeAlternativasDiferenteDeQuatro() {
		when(geminiClient.gerarConteudo(any())).thenReturn(
				"[{\"enunciado\":\"Pergunta\",\"alternativas\":[\"A\",\"B\"],"
						+ "\"respostaCorreta\":\"A\",\"explicacao\":\"Explicação\"}]");

		assertThatThrownBy(() -> provaGenerationService.gerarQuestoes(List.of(flashcard("P", "R")), EstiloProva.ENEM))
				.isInstanceOf(GeracaoProvaException.class);
	}

	@Test
	void deveTentarNovamenteQuandoJsonMalFormadoNaPrimeiraTentativaESucessoNaSegunda() {
		when(geminiClient.gerarConteudo(any()))
				.thenReturn("isto não é um JSON válido")
				.thenReturn("[{\"enunciado\":\"Pergunta ok\",\"alternativas\":[\"A\",\"B\",\"C\",\"D\"],"
						+ "\"respostaCorreta\":\"A\",\"explicacao\":\"Explicação\"}]");

		List<ProvaSugestaoDTO> questoes = provaGenerationService.gerarQuestoes(List.of(flashcard("P", "R")), EstiloProva.GERAL);

		assertThat(questoes).hasSize(1);
		verify(geminiClient, times(2)).gerarConteudo(any());
	}

	@Test
	void deveLancarGeracaoProvaExceptionQuandoJsonMalFormadoEmTodasAsTentativas() {
		when(geminiClient.gerarConteudo(any())).thenReturn("isto não é um JSON válido");

		assertThatThrownBy(() -> provaGenerationService.gerarQuestoes(List.of(flashcard("P", "R")), EstiloProva.ENEM))
				.isInstanceOf(GeracaoProvaException.class);

		verify(geminiClient, times(2)).gerarConteudo(any());
	}

}
