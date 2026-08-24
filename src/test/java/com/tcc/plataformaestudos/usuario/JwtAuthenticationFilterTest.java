package com.tcc.plataformaestudos.usuario;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

	@Mock
	private JwtService jwtService;

	@Mock
	private HttpServletRequest request;

	@Mock
	private HttpServletResponse response;

	@Mock
	private FilterChain filterChain;

	@InjectMocks
	private JwtAuthenticationFilter filtro;

	@AfterEach
	void limparContextoDeSeguranca() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void devePopularContextoDeSegurancaQuandoTokenValido() throws ServletException, IOException {
		when(request.getHeader("Authorization")).thenReturn("Bearer token-valido");
		when(jwtService.validar("token-valido")).thenReturn(true);
		when(jwtService.extrairUsuarioId("token-valido")).thenReturn(1L);
		when(jwtService.extrairEmail("token-valido")).thenReturn("ana@email.com");

		filtro.doFilter(request, response, filterChain);

		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		assertThat(authentication).isNotNull();
		assertThat(authentication.getPrincipal()).isInstanceOf(UsuarioAutenticado.class);

		UsuarioAutenticado principal = (UsuarioAutenticado) authentication.getPrincipal();
		assertThat(principal.id()).isEqualTo(1L);
		assertThat(principal.email()).isEqualTo("ana@email.com");

		verify(filterChain).doFilter(request, response);
	}

	@Test
	void deveSeguirSemAutenticarQuandoHeaderAusente() throws ServletException, IOException {
		when(request.getHeader("Authorization")).thenReturn(null);

		filtro.doFilter(request, response, filterChain);

		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
		verify(filterChain).doFilter(request, response);
	}

	@Test
	void deveSeguirSemAutenticarQuandoTokenInvalidoOuExpirado() throws ServletException, IOException {
		when(request.getHeader("Authorization")).thenReturn("Bearer token-invalido");
		when(jwtService.validar("token-invalido")).thenReturn(false);

		filtro.doFilter(request, response, filterChain);

		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
		verify(filterChain).doFilter(request, response);
	}

}
