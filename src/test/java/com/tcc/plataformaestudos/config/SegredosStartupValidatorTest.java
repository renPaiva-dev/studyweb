package com.tcc.plataformaestudos.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

class SegredosStartupValidatorTest {

	private ListAppender<ILoggingEvent> appender;
	private Logger logger;

	@BeforeEach
	void configurarCapturaDeLog() {
		logger = (Logger) LoggerFactory.getLogger(SegredosStartupValidator.class);
		appender = new ListAppender<>();
		appender.start();
		logger.addAppender(appender);
	}

	@AfterEach
	void limparAppender() {
		logger.detachAppender(appender);
	}

	@Test
	void deveAvisarQuandoJwtSecretNaoEstaDefinidoNoAmbiente() {
		Map<String, String> variaveisDefinidas = Map.of("GEMINI_API_KEY", "valor-configurado-qualquer");

		new SegredosStartupValidator(variaveisDefinidas::get).validarAoSubir();

		assertThat(appender.list)
				.anyMatch(evento -> evento.getLevel() == Level.WARN && evento.getFormattedMessage().contains("JWT_SECRET"));
	}

	@Test
	void deveAvisarQuandoGeminiApiKeyNaoEstaDefinidaNoAmbiente() {
		Map<String, String> variaveisDefinidas = Map.of("JWT_SECRET", "valor-configurado-qualquer");

		new SegredosStartupValidator(variaveisDefinidas::get).validarAoSubir();

		assertThat(appender.list)
				.anyMatch(evento -> evento.getLevel() == Level.WARN && evento.getFormattedMessage().contains("GEMINI_API_KEY"));
	}

	@Test
	void naoDeveAvisarQuandoAmbasAsVariaveisEstaoDefinidas() {
		Map<String, String> variaveisDefinidas = Map.of("JWT_SECRET", "valor-a", "GEMINI_API_KEY", "valor-b");

		new SegredosStartupValidator(variaveisDefinidas::get).validarAoSubir();

		assertThat(appender.list).isEmpty();
	}

	@Test
	void deveAvisarParaAmbasQuandoNenhumaVariavelEstaDefinida() {
		new SegredosStartupValidator(variavel -> null).validarAoSubir();

		assertThat(appender.list).hasSize(2);
	}

}
