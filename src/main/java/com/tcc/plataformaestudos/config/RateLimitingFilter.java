package com.tcc.plataformaestudos.config;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.LongSupplier;

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
 *
 * B14: {@code janelasPorChave} expurga periodicamente as chaves cuja janela
 * já expirou há muito tempo (ver {@link #purgarJanelasExpiradasSeNecessario()}),
 * em vez de crescer para sempre com um IP/usuário novo a cada entrada — sem
 * isso, um processo de vida longa acumula uma entrada por IP/usuário
 * distinto já visto, indefinidamente.
 *

 * B13: por padrão, o limite por IP usa {@code request.getRemoteAddr()}, não
 * o header {@code X-Forwarded-For}. Confiar nesse header sem um proxy
 * reverso confiável na frente é, em si, uma falha de segurança — qualquer
 * cliente pode enviar um {@code X-Forwarded-For} diferente a cada
 * requisição e furar o limite por completo. Só passa a ler o header quando
 * {@code confiarXForwardedFor=true} for explicitamente configurado (ver
 * {@code app.rate-limit.confiar-x-forwarded-for}), o que só deve ser feito
 * quando o backend estiver de fato atrás de um proxy/CDN confiável que
 * sobrescreve esse header (nunca repassa o valor do cliente original).
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
			// UC32: também chama geminiClient.gerarConteudo — mesmo limite dos demais
			// endpoints de IA acima, desde a implementação (não é achado de auditoria).
			new Regra("POST", "/api/decks/*/perguntas", 10, 60_000, true),
			new Regra("POST", "/api/usuario/lembrete-revisao/teste", 3, 60_000, true));

	private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

	// B14: intervalo entre varreduras de limpeza e margem de retenção de uma
	// janela parada (maior janela configurada acima é 60_000ms — o dobro já
	// garante que nenhuma janela ainda "quente" seja removida por engano).
	private static final long INTERVALO_LIMPEZA_MILLIS = 5 * 60_000L;
	private static final long RETENCAO_MINIMA_MILLIS = 2 * 60_000L;

	private final Map<String, Janela> janelasPorChave = new ConcurrentHashMap<>();
	private final boolean confiarXForwardedFor;
	private final LongSupplier relogio;
	private final AtomicLong ultimaLimpeza;

	public RateLimitingFilter(boolean confiarXForwardedFor) {
		this(confiarXForwardedFor, System::currentTimeMillis);
	}

	/** Pacote-privado: permite controlar o tempo em teste, sem esperar de verdade os minutos do intervalo de limpeza (B14). */
	RateLimitingFilter(boolean confiarXForwardedFor, LongSupplier relogio) {
		this.confiarXForwardedFor = confiarXForwardedFor;
		this.relogio = relogio;
		this.ultimaLimpeza = new AtomicLong(relogio.getAsLong());
	}

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
		return regra.padraoPath() + ":ip:" + resolverIpCliente(request);
	}

	private String resolverIpCliente(HttpServletRequest request) {
		if (confiarXForwardedFor) {
			String encaminhadoPara = request.getHeader("X-Forwarded-For");
			if (encaminhadoPara != null && !encaminhadoPara.isBlank()) {
				// primeiro IP da lista = cliente original; os demais são proxies intermediários.
				return encaminhadoPara.split(",")[0].trim();
			}
		}
		return request.getRemoteAddr();
	}

	private boolean permitir(Regra regra, String chave) {
		purgarJanelasExpiradasSeNecessario();

		Janela janela = janelasPorChave.computeIfAbsent(chave, k -> new Janela(relogio.getAsLong()));

		synchronized (janela) {
			long agora = relogio.getAsLong();

			if (agora - janela.inicioJanela > regra.janelaMillis()) {
				janela.inicioJanela = agora;
				janela.contagem = 0;
			}

			janela.contagem++;
			return janela.contagem <= regra.limite();
		}
	}

	/**
	 * B14: varre {@code janelasPorChave} no máximo uma vez a cada
	 * {@value #INTERVALO_LIMPEZA_MILLIS}ms (checagem barata via
	 * {@link AtomicLong#compareAndSet}, não uma thread/scheduler dedicado —
	 * este filtro é deliberadamente simples, sem ciclo de vida de bean, ver
	 * javadoc da classe), removendo entradas cuja janela está parada há mais
	 * de {@value #RETENCAO_MINIMA_MILLIS}ms. Uma chave removida por engano
	 * antes da hora não corrompe nada: na pior hipótese, a próxima requisição
	 * daquela chave recria a janela do zero, exatamente como já aconteceria
	 * naturalmente quando a janela expira (linha do {@code permitir} logo
	 * acima).
	 */
	private void purgarJanelasExpiradasSeNecessario() {
		long agora = relogio.getAsLong();
		long ultima = ultimaLimpeza.get();

		if (agora - ultima < INTERVALO_LIMPEZA_MILLIS || !ultimaLimpeza.compareAndSet(ultima, agora)) {
			return;
		}

		janelasPorChave.entrySet().removeIf(entrada -> {
			synchronized (entrada.getValue()) {
				return agora - entrada.getValue().inicioJanela > RETENCAO_MINIMA_MILLIS;
			}
		});
	}

	/** Pacote-privado: só para teste (B14) — inspeciona o tamanho do mapa sem expor um getter público desnecessário. */
	int quantidadeDeChavesRastreadas() {
		return janelasPorChave.size();
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
		private long inicioJanela;
		private int contagem = 0;

		private Janela(long inicioJanela) {
			this.inicioJanela = inicioJanela;
		}
	}

}
