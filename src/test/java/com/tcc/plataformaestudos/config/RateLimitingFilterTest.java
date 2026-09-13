package com.tcc.plataformaestudos.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.PrintWriter;
import java.io.StringWriter;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tcc.plataformaestudos.usuario.UsuarioAutenticado;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

class RateLimitingFilterTest {

	private final RateLimitingFilter filtro = new RateLimitingFilter(false);

	@AfterEach
	void limparContextoDeSeguranca() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void devePermitirAteOLimiteEBloquearAsExcedentesNoLogin() throws Exception {
		FilterChain chain = mock(FilterChain.class);

		for (int i = 0; i < 10; i++) {
			HttpServletRequest request = requisicao("POST", "/api/auth/login", "203.0.113.10");
			filtro.doFilterInternal(request, respostaMock(), chain);
		}
		verify(chain, times(10)).doFilter(any(), any());

		HttpServletRequest decimaPrimeira = requisicao("POST", "/api/auth/login", "203.0.113.10");
		HttpServletResponse resposta = respostaMock();
		StringWriter corpoEscrito = capturarCorpo(resposta);

		filtro.doFilterInternal(decimaPrimeira, resposta, chain);

		verify(chain, times(10)).doFilter(any(), any());
		verify(resposta).setStatus(429);
		assertThat(corpoEscrito.toString()).contains("\"status\":429");
	}

	@Test
	void devePermitirAteOLimiteEBloquearAsExcedentesNoCadastro() throws Exception {
		FilterChain chain = mock(FilterChain.class);

		for (int i = 0; i < 5; i++) {
			filtro.doFilterInternal(requisicao("POST", "/api/auth/cadastro", "203.0.113.20"), respostaMock(), chain);
		}
		verify(chain, times(5)).doFilter(any(), any());

		HttpServletResponse resposta = respostaMock();
		capturarCorpo(resposta);
		filtro.doFilterInternal(requisicao("POST", "/api/auth/cadastro", "203.0.113.20"), resposta, chain);

		verify(chain, times(5)).doFilter(any(), any());
		verify(resposta).setStatus(429);
	}

	@Test
	void deveLimitarReenvioDeVerificacaoDeEmailParaEvitarSpam() throws Exception {
		FilterChain chain = mock(FilterChain.class);

		for (int i = 0; i < 5; i++) {
			filtro.doFilterInternal(requisicao("POST", "/api/auth/reenviar-verificacao", "203.0.113.21"), respostaMock(), chain);
		}
		verify(chain, times(5)).doFilter(any(), any());

		HttpServletResponse resposta = respostaMock();
		capturarCorpo(resposta);
		filtro.doFilterInternal(requisicao("POST", "/api/auth/reenviar-verificacao", "203.0.113.21"), resposta, chain);

		verify(chain, times(5)).doFilter(any(), any());
		verify(resposta).setStatus(429);
	}

	@Test
	void naoDeveMisturarContadorDeIpsDiferentes() throws Exception {
		FilterChain chain = mock(FilterChain.class);

		for (int i = 0; i < 5; i++) {
			filtro.doFilterInternal(requisicao("POST", "/api/auth/esqueci-senha", "198.51.100.1"), respostaMock(), chain);
		}
		// IP diferente ainda deve passar, mesmo com o primeiro IP já no limite de 5.
		HttpServletResponse resposta = respostaMock();
		filtro.doFilterInternal(requisicao("POST", "/api/auth/esqueci-senha", "198.51.100.2"), resposta, chain);

		verify(chain, times(6)).doFilter(any(), any());
	}

	// B13: sem app.rate-limit.confiar-x-forwarded-for=true, o header enviado
	// pelo próprio cliente não pode ser usado para burlar o limite por IP.
	@Test
	void naoDeveConfiarEmXForwardedForPorPadrao() throws Exception {
		FilterChain chain = mock(FilterChain.class);

		for (int i = 0; i < 5; i++) {
			HttpServletRequest request = requisicao("POST", "/api/auth/cadastro", "203.0.113.30");
			when(request.getHeader("X-Forwarded-For")).thenReturn("1.2.3." + i);
			filtro.doFilterInternal(request, respostaMock(), chain);
		}
		verify(chain, times(5)).doFilter(any(), any());

		HttpServletRequest sexta = requisicao("POST", "/api/auth/cadastro", "203.0.113.30");
		when(sexta.getHeader("X-Forwarded-For")).thenReturn("9.9.9.9");
		HttpServletResponse resposta = respostaMock();
		capturarCorpo(resposta);
		filtro.doFilterInternal(sexta, resposta, chain);

		verify(chain, times(5)).doFilter(any(), any());
		verify(resposta).setStatus(429);
	}

	// B13: com confiarXForwardedFor=true (deploy atrás de proxy confiável), o
	// limite deve seguir o cliente real (primeiro IP do header), não o IP do
	// proxy — que é igual para todo mundo.
	@Test
	void deveConfiarEmXForwardedForQuandoConfigurado() throws Exception {
		RateLimitingFilter filtroComProxy = new RateLimitingFilter(true);
		FilterChain chain = mock(FilterChain.class);

		for (int i = 0; i < 5; i++) {
			HttpServletRequest request = requisicao("POST", "/api/auth/cadastro", "10.0.0.1");
			when(request.getHeader("X-Forwarded-For")).thenReturn("198.51.100.77, 10.0.0.1");
			filtroComProxy.doFilterInternal(request, respostaMock(), chain);
		}
		verify(chain, times(5)).doFilter(any(), any());

		HttpServletRequest outroCliente = requisicao("POST", "/api/auth/cadastro", "10.0.0.1");
		when(outroCliente.getHeader("X-Forwarded-For")).thenReturn("198.51.100.99, 10.0.0.1");
		filtroComProxy.doFilterInternal(outroCliente, respostaMock(), chain);

		verify(chain, times(6)).doFilter(any(), any());
	}

	@Test
	void deveLimitarGeracaoDeQuizPorUsuarioAutenticadoEm10PorMinuto() throws Exception {
		autenticarUsuario(42L);
		FilterChain chain = mock(FilterChain.class);

		for (int i = 0; i < 10; i++) {
			filtro.doFilterInternal(requisicao("POST", "/api/decks/5/quizzes", "203.0.113.99"), respostaMock(), chain);
		}
		verify(chain, times(10)).doFilter(any(), any());

		HttpServletResponse resposta = respostaMock();
		capturarCorpo(resposta);
		filtro.doFilterInternal(requisicao("POST", "/api/decks/5/quizzes", "203.0.113.99"), resposta, chain);

		verify(chain, times(10)).doFilter(any(), any());
		verify(resposta).setStatus(429);
	}

	// B11: /api/flashcards/{id}/explicacao e /api/decks/{id}/recomendacao-estudo
	// também chamam geminiClient.gerarConteudo e não tinham nenhuma regra.
	@Test
	void deveLimitarExplicacaoDeFlashcardPorUsuarioAutenticadoEm10PorMinuto() throws Exception {
		autenticarUsuario(42L);
		FilterChain chain = mock(FilterChain.class);

		for (int i = 0; i < 10; i++) {
			filtro.doFilterInternal(requisicao("POST", "/api/flashcards/7/explicacao", "203.0.113.98"), respostaMock(), chain);
		}
		verify(chain, times(10)).doFilter(any(), any());

		HttpServletResponse resposta = respostaMock();
		capturarCorpo(resposta);
		filtro.doFilterInternal(requisicao("POST", "/api/flashcards/7/explicacao", "203.0.113.98"), resposta, chain);

		verify(chain, times(10)).doFilter(any(), any());
		verify(resposta).setStatus(429);
	}

	@Test
	void deveLimitarRecomendacaoDeFocoDeEstudoPorUsuarioAutenticadoEm10PorMinuto() throws Exception {
		autenticarUsuario(42L);
		FilterChain chain = mock(FilterChain.class);

		for (int i = 0; i < 10; i++) {
			filtro.doFilterInternal(requisicao("POST", "/api/decks/5/recomendacao-estudo", "203.0.113.97"), respostaMock(), chain);
		}
		verify(chain, times(10)).doFilter(any(), any());

		HttpServletResponse resposta = respostaMock();
		capturarCorpo(resposta);
		filtro.doFilterInternal(requisicao("POST", "/api/decks/5/recomendacao-estudo", "203.0.113.97"), resposta, chain);

		verify(chain, times(10)).doFilter(any(), any());
		verify(resposta).setStatus(429);
	}

	// B14 (Docs/auditoria-erros-2026-09.md): janelasPorChave nao pode crescer
	// para sempre - chaves paradas ha muito tempo devem ser expurgadas.
	@Test
	void deveExpurgarJanelasAntigasDoMapaEmMemoria() throws Exception {
		long[] agora = { 0L };
		RateLimitingFilter filtroComRelogio = new RateLimitingFilter(false, () -> agora[0]);
		FilterChain chain = mock(FilterChain.class);

		filtroComRelogio.doFilterInternal(requisicao("POST", "/api/auth/login", "203.0.113.40"), respostaMock(), chain);
		assertThat(filtroComRelogio.quantidadeDeChavesRastreadas()).isEqualTo(1);

		// Avanca alem do intervalo de limpeza (5min) e da retencao minima (2min,
		// bem alem da janela de 60s de qualquer regra) antes da proxima requisicao.
		agora[0] += 6 * 60_000L;
		filtroComRelogio.doFilterInternal(requisicao("POST", "/api/auth/cadastro", "203.0.113.41"), respostaMock(), chain);

		// A chave antiga (login) foi expurgada durante a checagem da nova
		// requisicao; so sobra a chave recem-criada (cadastro).
		assertThat(filtroComRelogio.quantidadeDeChavesRastreadas()).isEqualTo(1);
	}

	@Test
	void naoDeveExpurgarJanelasAindaDentroDaRetencaoMinima() throws Exception {
		long[] agora = { 0L };
		RateLimitingFilter filtroComRelogio = new RateLimitingFilter(false, () -> agora[0]);
		FilterChain chain = mock(FilterChain.class);

		// t=0: janela do IP A.
		filtroComRelogio.doFilterInternal(requisicao("POST", "/api/auth/login", "203.0.113.42"), respostaMock(), chain);

		// t=4min50s: ainda antes do intervalo de limpeza (5min) - janela do IP B.
		agora[0] = 4 * 60_000L + 50_000L;
		filtroComRelogio.doFilterInternal(requisicao("POST", "/api/auth/cadastro", "203.0.113.43"), respostaMock(), chain);
		assertThat(filtroComRelogio.quantidadeDeChavesRastreadas()).isEqualTo(2);

		// t=5min10s: dispara a limpeza - IP A (parado ha 5min10s, alem da
		// retencao minima de 2min) e removido; IP B (parado ha so 20s) fica.
		agora[0] = 5 * 60_000L + 10_000L;
		filtroComRelogio.doFilterInternal(requisicao("POST", "/api/auth/esqueci-senha", "203.0.113.44"), respostaMock(), chain);

		// IP B sobrevive + a nova chave (esqueci-senha) criada agora = 2.
		assertThat(filtroComRelogio.quantidadeDeChavesRastreadas()).isEqualTo(2);
	}

	@Test
	void naoDeveLimitarRotasSemRegraConfigurada() throws Exception {
		FilterChain chain = mock(FilterChain.class);

		for (int i = 0; i < 30; i++) {
			filtro.doFilterInternal(requisicao("GET", "/api/decks", "203.0.113.50"), respostaMock(), chain);
		}

		verify(chain, times(30)).doFilter(any(), any());
	}

	private void autenticarUsuario(Long usuarioId) {
		UsuarioAutenticado principal = new UsuarioAutenticado(usuarioId, "usuario@email.com");
		SecurityContextHolder.getContext()
				.setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, java.util.List.of()));
	}

	private HttpServletRequest requisicao(String metodo, String uri, String ip) {
		HttpServletRequest request = mock(HttpServletRequest.class);
		when(request.getMethod()).thenReturn(metodo);
		when(request.getRequestURI()).thenReturn(uri);
		when(request.getRemoteAddr()).thenReturn(ip);
		return request;
	}

	private HttpServletResponse respostaMock() {
		return mock(HttpServletResponse.class);
	}

	private StringWriter capturarCorpo(HttpServletResponse resposta) throws Exception {
		StringWriter escritor = new StringWriter();
		when(resposta.getWriter()).thenReturn(new PrintWriter(escritor));
		return escritor;
	}

}
