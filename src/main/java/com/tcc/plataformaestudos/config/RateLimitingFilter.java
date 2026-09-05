package com.tcc.plataformaestudos.config;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import com.tcc.plataformaestudos.usuario.UsuarioAutenticado;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Rate limiting em janela fixa, em memória, para grupos de rota sem nenhum
 * limite hoje: login (força bruta de senha), cadastro/esqueci-senha/
 * redefinir-senha/verificar-email/reenviar-verificação (spam de e-mail e
 * geração de tokens — reenviar-verificação em especial dispara um e-mail
 * real para qualquer endereço informado, sem autenticação) e os endpoints
 * de geração via IA (Gemini — chamada externa paga, sem limite hoje permite
 * esgotar cota ou gerar cobrança inesperada com um script simples).
 *
 * Deliberadamente NÃO é {@code @Component}: é instanciado diretamente por
 * {@link SecurityConfig} e adicionado uma única vez à cadeia de filtros do
 * Spring Security (via {@code addFilterAfter}) — se fosse um bean gerenciado
 * pelo Spring, o Spring Boot o registraria também como filtro genérico do
 * servlet container, executando a checagem duas vezes por requisição e
 * reduzindo o limite efetivo pela metade.
 *
 * Limitação conhecida e aceitável para uma única instância: o contador é
 * local em memória, não é compartilhado entre réplicas caso o sistema seja
 * escalado horizontalmente no futuro.
 */
public class RateLimitingFilter extends OncePerRequestFilter {

	private record Regra(String metodo, String padraoPath, int limite, long janelaMillis, boolean porUsuarioAutenticado) {
	}

	private static final List<Regra> REGRAS = List.of(
			new Regra("POST", "/api/auth/login", 10, 60_000, false),
			new Regra("POST", "/api/auth/cadastro", 5, 60_000, false),
			new Regra("POST", "/api/auth/esqueci-senha", 5, 60_000, false),
			new Regra("POST", "/api/auth/redefinir-senha", 5, 60_000, false),
			new Regra("POST", "/api/auth/verificar-email", 10, 60_000, false),
			new Regra("POST", "/api/auth/reenviar-verificacao", 5, 60_000, false),
			new Regra("POST", "/api/materiais/*/gerar-flashcards", 10, 60_000, true),
			new Regra("POST", "/api/decks/*/quizzes", 10, 60_000, true),
			new Regra("POST", "/api/decks/*/provas", 10, 60_000, true),
			// B11: também chamam geminiClient.gerarConteudo (UC14/UC13) e não tinham
			// nenhum limite — mesmo padrão dos demais endpoints de IA acima.
			new Regra("POST", "/api/flashcards/*/explicacao", 10, 60_000, true),
			new Regra("POST", "/api/decks/*/recomendacao-estudo", 10, 60_000, true),
			new Regra("POST", "/api/usuario/lembrete-revisao/teste", 3, 60_000, true));

	private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

	private final Map<String, Janela> janelasPorChave = new ConcurrentHashMap<>();

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {

		Regra regra = encontrarRegra(request);

		if (regra != null && !permitir(regra, resolverChaveCliente(request, regra))) {
			responderExcedido(response, request.getRequestURI());
			return;
		}

		filterChain.doFilter(request, response);
	}

	private Regra encontrarRegra(HttpServletRequest request) {
		for (Regra regra : REGRAS) {
			if (regra.metodo().equals(request.getMethod()) && PATH_MATCHER.match(regra.padraoPath(), request.getRequestURI())) {
				return regra;
			}
		}
		return null;
	}

	private String resolverChaveCliente(HttpServletRequest request, Regra regra) {
		if (regra.porUsuarioAutenticado()) {
			Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
			if (authentication != null && authentication.getPrincipal() instanceof UsuarioAutenticado usuarioAutenticado) {
				return regra.padraoPath() + ":usuario:" + usuarioAutenticado.id();
			}
		}
		return regra.padraoPath() + ":ip:" + request.getRemoteAddr();
	}

	private boolean permitir(Regra regra, String chave) {
		Janela janela = janelasPorChave.computeIfAbsent(chave, k -> new Janela());

		synchronized (janela) {
			long agora = System.currentTimeMillis();

			if (agora - janela.inicioJanela > regra.janelaMillis()) {
				janela.inicioJanela = agora;
				janela.contagem = 0;
			}

			janela.contagem++;
			return janela.contagem <= regra.limite();
		}
	}

	private void responderExcedido(HttpServletResponse response, String path) throws IOException {
		ErrorResponseDTO corpo = new ErrorResponseDTO(
				Instant.now(),
				HttpStatus.TOO_MANY_REQUESTS.value(),
				HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase(),
				"Muitas requisições em um curto período. Aguarde um momento e tente novamente.",
				path);

		response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.getWriter().write(paraJson(corpo));
	}

	// Mesmo padrão de JwtAuthenticationEntryPoint: JSON montado manualmente
	// para não acoplar este filtro à biblioteca Jackson escolhida pelo
	// autoconfig do Spring Boot.
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

	private static final class Janela {
		private long inicioJanela = System.currentTimeMillis();
		private int contagem = 0;
	}

}
