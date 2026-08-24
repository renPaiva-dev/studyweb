package com.tcc.plataformaestudos.config;

import java.io.IOException;
import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Requisições sem autenticação são rejeitadas pela cadeia de filtros do Spring
 * Security antes de chegar ao DispatcherServlet — por isso não passam pelo
 * TratamentoErrosGlobal (@RestControllerAdvice). Este ponto de entrada gera o
 * mesmo formato de erro padrão do contrato de API para o 401 nesse caso.
 *
 * O JSON é montado manualmente (sem ObjectMapper) porque os campos são fixos
 * e conhecidos, evitando acoplar esta classe à biblioteca Jackson escolhida
 * pelo autoconfig do Spring Boot.
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
			throws IOException {

		ErrorResponseDTO corpo = new ErrorResponseDTO(
				Instant.now(),
				HttpStatus.UNAUTHORIZED.value(),
				HttpStatus.UNAUTHORIZED.getReasonPhrase(),
				"Token de autenticação ausente ou inválido",
				request.getRequestURI());

		response.setStatus(HttpStatus.UNAUTHORIZED.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.getWriter().write(paraJson(corpo));
	}

	private String paraJson(ErrorResponseDTO corpo) {
		return "{"
				+ "\"timestamp\":\"" + corpo.timestamp() + "\","
				+ "\"status\":" + corpo.status() + ","
				+ "\"error\":\"" + escapar(corpo.error()) + "\","
				+ "\"message\":\"" + escapar(corpo.message()) + "\","
				+ "\"path\":\"" + escapar(corpo.path()) + "\""
				+ "}";
	}

	private String escapar(String valor) {
		return valor == null ? "" : valor.replace("\\", "\\\\").replace("\"", "\\\"");
	}

}
