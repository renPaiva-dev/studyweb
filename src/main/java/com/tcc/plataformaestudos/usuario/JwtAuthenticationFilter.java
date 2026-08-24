package com.tcc.plataformaestudos.usuario;

import java.io.IOException;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private static final String PREFIXO_BEARER = "Bearer ";

	private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

	private final JwtService jwtService;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {

		String header = request.getHeader("Authorization");

		if (header != null && header.startsWith(PREFIXO_BEARER)) {
			autenticarSeTokenValido(header.substring(PREFIXO_BEARER.length()));
		}

		filterChain.doFilter(request, response);
	}

	private void autenticarSeTokenValido(String token) {
		try {
			if (!jwtService.validar(token)) {
				return;
			}

			UsuarioAutenticado principal = new UsuarioAutenticado(jwtService.extrairUsuarioId(token), jwtService.extrairEmail(token));
			var authentication = new UsernamePasswordAuthenticationToken(principal, null, List.of());

			SecurityContextHolder.getContext().setAuthentication(authentication);
		} catch (RuntimeException e) {
			// Captura qualquer RuntimeException (não só JwtException/IllegalArgumentException)
			// para garantir que este filtro NUNCA deixe uma exceção escapar (o que causaria um
			// forward interno do Spring para /error, mascarado como 401 por essa rota não ser
			// permitAll). Loga em ERROR com stack trace completa para diagnóstico.
			log.error("Falha ao processar token JWT — requisição seguirá sem autenticação", e);
		}
	}

}
