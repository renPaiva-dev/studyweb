package com.tcc.plataformaestudos.ia;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Chamada HTTP pura (java.net.http.HttpClient, sem SDK) à API Gemini — ver
 * docs/integracao-ia.md. Força responseMimeType=application/json na
 * resposta e devolve apenas o texto gerado; quem interpreta esse texto como
 * sugestões de flashcard é o FlashcardGenerationService.
 */
@Component
public class GeminiClient {

	private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);
	// UC27: a geração de prova (várias questões com raciocínio/explicação)
	// mede-se, na prática, em até ~80s com o modelo configurado — 30s
	// cortava a chamada no meio antes de completar (HttpTimeoutException).
	private static final Duration TIMEOUT = Duration.ofSeconds(120);

	private final HttpClient httpClient = HttpClient.newHttpClient();
	private final ObjectMapper objectMapper;
	private final String apiKey;
	private final String apiUrl;

	public GeminiClient(
			ObjectMapper objectMapper,
			@Value("${gemini.api.key}") String apiKey,
			@Value("${gemini.api.url}") String apiUrl) {
		this.objectMapper = objectMapper;
		this.apiKey = apiKey;
		this.apiUrl = apiUrl;
	}

	public String gerarConteudo(String prompt) {
		HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(apiUrl + "?key=" + apiKey))
				.timeout(TIMEOUT)
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString(montarCorpoRequisicao(prompt)))
				.build();

		HttpResponse<String> response = enviar(request);

		if (response.statusCode() != 200) {
			log.error("Chamada à API Gemini falhou: status={}", response.statusCode());
			throw new GeracaoFlashcardsException("Serviço de IA retornou status " + response.statusCode());
		}

		log.info("Chamada à API Gemini concluída com sucesso: status={}", response.statusCode());
		return extrairTexto(response.body());
	}

	private HttpResponse<String> enviar(HttpRequest request) {
		try {
			return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
		} catch (IOException e) {
			log.error("Falha de E/S ao chamar o serviço de IA", e);
			throw new GeracaoFlashcardsException("Falha ao chamar o serviço de IA", e);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new GeracaoFlashcardsException("Chamada ao serviço de IA interrompida", e);
		}
	}

	private String montarCorpoRequisicao(String prompt) {
		try {
			GeminiRequest corpo = new GeminiRequest(
					List.of(new Conteudo(List.of(new Parte(prompt)))),
					new ConfiguracaoGeracao("application/json"));

			return objectMapper.writeValueAsString(corpo);
		} catch (JacksonException e) {
			throw new GeracaoFlashcardsException("Falha ao montar a requisição para o serviço de IA", e);
		}
	}

	private String extrairTexto(String corpoResposta) {
		try {
			JsonNode raiz = objectMapper.readTree(corpoResposta);
			JsonNode texto = raiz.path("candidates").path(0).path("content").path("parts").path(0).path("text");

			if (texto.isMissingNode() || texto.asText().isBlank()) {
				throw new GeracaoFlashcardsException("Resposta da API Gemini não contém texto gerado");
			}

			return texto.asText();
		} catch (JacksonException e) {
			throw new GeracaoFlashcardsException("Falha ao interpretar a resposta do serviço de IA", e);
		}
	}

	private record GeminiRequest(List<Conteudo> contents, ConfiguracaoGeracao generationConfig) {
	}

	private record Conteudo(List<Parte> parts) {
	}

	private record Parte(String text) {
	}

	private record ConfiguracaoGeracao(String responseMimeType) {
	}

}
