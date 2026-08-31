package com.tcc.plataformaestudos;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.client.RestTemplate;

/**
 * Único teste do projeto que sobe o contexto Spring inteiro e faz uma
 * chamada HTTP real de ponta a ponta (os demais são unitários com
 * repositório mockado, ou @DataJpaTest de fatia). @ActiveProfiles("test")
 * usa H2 (ver application-test.properties) em vez do Postgres real do
 * application.properties — sem isso, este teste falhava fora de uma máquina
 * com Postgres local configurado.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class PlataformaEstudosApplicationTests {

	@LocalServerPort
	private int port;

	@Test
	void contextLoads() {
	}

	@Test
	void deveResponderHealthCheckComStatusOk() {
		RestTemplate restTemplate = new RestTemplate();

		ResponseEntity<String> resposta = restTemplate.getForEntity("http://localhost:" + port + "/api/health", String.class);

		assertThat(resposta.getStatusCode().value()).isEqualTo(200);
		assertThat(resposta.getBody()).contains("\"status\":\"ok\"");
	}

}
