package com.tcc.plataformaestudos.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.context.request.WebRequest;

/**
 * B18 (auditoria 2026-09) — corrida "check-then-act" no cadastro/atualização
 * de perfil (unicidade de e-mail/nomeUsuario checada antes do save): duas
 * requisições concorrentes podem passar a checagem antes de qualquer commit,
 * e o segundo INSERT/UPDATE estoura DataIntegrityViolationException no
 * banco. Sem handler dedicado, caía no fallback genérico (500) em vez do 409
 * já usado para os outros casos de duplicidade
 * (EmailJaCadastradoException/NomeUsuarioJaCadastradoException).
 */
class TratamentoErrosGlobalTest {

	private final TratamentoErrosGlobal tratamentoErrosGlobal = new TratamentoErrosGlobal();

	@Test
	void deveMapearDataIntegrityViolationExceptionPara409() {
		WebRequest request = mock(WebRequest.class);
		when(request.getDescription(false)).thenReturn("uri=/api/auth/cadastro");

		ResponseEntity<ErrorResponseDTO> resposta = tratamentoErrosGlobal.tratarViolacaoDeIntegridade(
				new DataIntegrityViolationException("duplicate key value violates unique constraint"), request);

		assertThat(resposta.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
		assertThat(resposta.getBody()).isNotNull();
		assertThat(resposta.getBody().status()).isEqualTo(409);
		assertThat(resposta.getBody().path()).isEqualTo("/api/auth/cadastro");
	}

}
