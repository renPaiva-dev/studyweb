package com.tcc.plataformaestudos.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.tcc.plataformaestudos.usuario.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

/**
 * RNF03: todas as rotas exigem JWT, exceto POST /api/auth/cadastro,
 * POST /api/auth/login (marcadas com (**) no contrato de API), /api/health
 * e GET /api/compartilhamentos/** (UC29 — acesso público a deck compartilhado).
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
	private final RateLimitingFilter rateLimitingFilter = new RateLimitingFilter();

	@Value("${app.cors.allowed-origins}")
	private String allowedOrigins;

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	// Frontend (Vite) roda em outra origem (porta) que o backend - sem isso o
	// navegador bloqueia o preflight de toda chamada do frontend, mesmo em
	// rotas com permitAll() (o preflight OPTIONS nao e um dos metodos
	// liberados abaixo, entao cairia em anyRequest().authenticated()).
	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(List.of(allowedOrigins.split(",")));
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("*"));

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.csrf(csrf -> csrf.disable())
			.cors(cors -> cors.configurationSource(corsConfigurationSource()))
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.httpBasic(basic -> basic.disable())
			.formLogin(form -> form.disable())
			.exceptionHandling(handling -> handling.authenticationEntryPoint(jwtAuthenticationEntryPoint))
			.authorizeHttpRequests(auth -> auth
				.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/auth/cadastro", "/api/auth/login",
						"/api/auth/esqueci-senha", "/api/auth/redefinir-senha").permitAll()
				.requestMatchers(HttpMethod.GET, "/api/health").permitAll()
				// UC29: acesso publico ao deck compartilhado nao exige conta/JWT.
				.requestMatchers(HttpMethod.GET, "/api/compartilhamentos/**").permitAll()
				// /error é a página de erro interna do Spring Boot, não um recurso de negócio —
				// liberá-la evita que um forward interno (ex.: exceção não tratada em algum
				// controller) seja mascarado como 401 por essa rota exigir autenticação.
				.requestMatchers("/error").permitAll()
				.anyRequest().authenticated())
			.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
			// Roda depois do filtro JWT para poder limitar os endpoints de geração
			// via IA por usuário autenticado (mais preciso que IP, ver RateLimitingFilter).
			.addFilterAfter(rateLimitingFilter, JwtAuthenticationFilter.class);

		return http.build();
	}

}
