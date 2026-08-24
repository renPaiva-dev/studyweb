package com.tcc.plataformaestudos.usuario;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class JwtServiceTest {

	private final JwtService jwtService = new JwtService("sdjhifbsdjhfbjhsdfasdasdasdasdsdfsdfsdfb", 3600000L);

	@Test
	void deveGerarValidarEExtrairClaimsDeUmTokenReal() {
		Usuario usuario = new Usuario();
		usuario.setId(1L);
		usuario.setEmail("ana@email.com");

		JwtService.TokenGerado tokenGerado = jwtService.gerarToken(usuario);
		String token = tokenGerado.valor();

		assertThat(jwtService.validar(token)).isTrue();
		assertThat(jwtService.extrairEmail(token)).isEqualTo("ana@email.com");
		assertThat(jwtService.extrairUsuarioId(token)).isEqualTo(1L);
	}

}
