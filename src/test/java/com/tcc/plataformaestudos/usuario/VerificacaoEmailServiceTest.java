package com.tcc.plataformaestudos.usuario;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** UC21/RN26 — ver PasswordResetServiceTest (UC18/RN24) para o mesmo padrão de token de uso único. */
@ExtendWith(MockitoExtension.class)
class VerificacaoEmailServiceTest {

	private static final String MENSAGEM_REENVIO =
			"Se este e-mail estiver cadastrado e ainda não confirmado, enviamos um novo link de confirmação.";

	@Mock
	private UsuarioRepository usuarioRepository;

	@Mock
	private TokenVerificacaoEmailRepository tokenRepository;

	@Mock
	private EmailService emailService;

	@InjectMocks
	private VerificacaoEmailService verificacaoEmailService;

	private Usuario usuarioComId(Long id, String email, boolean emailVerificado) {
		Usuario usuario = new Usuario();
		usuario.setId(id);
		usuario.setNome("Ana Estudante");
		usuario.setNomeUsuario("ana_estudante");
		usuario.setEmail(email);
		usuario.setEmailVerificado(emailVerificado);
		return usuario;
	}

	private TokenVerificacaoEmail tokenComEstado(Usuario usuario, LocalDateTime expiraEm) {
		TokenVerificacaoEmail token = new TokenVerificacaoEmail();
		token.setUsuario(usuario);
		token.setToken("token-fake");
		token.setExpiraEm(expiraEm);
		token.setUsado(false);
		return token;
	}

	@Test
	void deveGerarTokenEEnviarEmailAoEnviarTokenVerificacao() {
		Usuario usuario = usuarioComId(1L, "ana@email.com", false);

		verificacaoEmailService.enviarTokenVerificacao(usuario);

		ArgumentCaptor<TokenVerificacaoEmail> tokenCaptor = ArgumentCaptor.forClass(TokenVerificacaoEmail.class);
		verify(tokenRepository).save(tokenCaptor.capture());
		assertThat(tokenCaptor.getValue().getUsuario()).isEqualTo(usuario);
		assertThat(tokenCaptor.getValue().getToken()).isNotBlank();
		assertThat(tokenCaptor.getValue().getExpiraEm()).isAfter(LocalDateTime.now().plusHours(23));

		verify(emailService).enviarEmail(eq("ana@email.com"), anyString(), anyString());
	}

	@Test
	void deveReenviarTokenQuandoEmailExisteENaoEstaVerificado() {
		Usuario usuario = usuarioComId(1L, "ana@email.com", false);
		when(usuarioRepository.findByEmail("ana@email.com")).thenReturn(Optional.of(usuario));

		MensagemResponseDTO resposta = verificacaoEmailService.reenviarVerificacao("ana@email.com");

		assertThat(resposta.mensagem()).isEqualTo(MENSAGEM_REENVIO);
		verify(tokenRepository).save(any());
		verify(emailService).enviarEmail(eq("ana@email.com"), anyString(), anyString());
	}

	@Test
	void naoDeveReenviarTokenQuandoEmailNaoExisteMasRespostaEIgual() {
		when(usuarioRepository.findByEmail("desconhecido@email.com")).thenReturn(Optional.empty());

		MensagemResponseDTO resposta = verificacaoEmailService.reenviarVerificacao("desconhecido@email.com");

		assertThat(resposta.mensagem()).isEqualTo(MENSAGEM_REENVIO);
		verify(tokenRepository, never()).save(any());
		verify(emailService, never()).enviarEmail(any(), any(), any());
	}

	@Test
	void naoDeveReenviarTokenQuandoEmailJaEstaVerificadoMasRespostaEIgual() {
		Usuario usuario = usuarioComId(1L, "ana@email.com", true);
		when(usuarioRepository.findByEmail("ana@email.com")).thenReturn(Optional.of(usuario));

		MensagemResponseDTO resposta = verificacaoEmailService.reenviarVerificacao("ana@email.com");

		assertThat(resposta.mensagem()).isEqualTo(MENSAGEM_REENVIO);
		verify(tokenRepository, never()).save(any());
		verify(emailService, never()).enviarEmail(any(), any(), any());
	}

	@Test
	void deveVerificarEmailComSucessoQuandoTokenValido() {
		Usuario usuario = usuarioComId(1L, "ana@email.com", false);
		TokenVerificacaoEmail token = tokenComEstado(usuario, LocalDateTime.now().plusHours(12));

		when(tokenRepository.findByTokenAndUsadoFalse("token-fake")).thenReturn(Optional.of(token));

		MensagemResponseDTO resposta = verificacaoEmailService.verificarEmail("token-fake");

		assertThat(resposta.mensagem()).isEqualTo("E-mail verificado com sucesso.");
		assertThat(usuario.isEmailVerificado()).isTrue();
		assertThat(token.isUsado()).isTrue();
		verify(usuarioRepository).save(usuario);
		verify(tokenRepository).save(token);
	}

	@Test
	void deveLancarTokenVerificacaoInvalidoExceptionQuandoTokenExpirado() {
		Usuario usuario = usuarioComId(1L, "ana@email.com", false);
		TokenVerificacaoEmail token = tokenComEstado(usuario, LocalDateTime.now().minusMinutes(1));

		when(tokenRepository.findByTokenAndUsadoFalse("token-fake")).thenReturn(Optional.of(token));

		assertThatThrownBy(() -> verificacaoEmailService.verificarEmail("token-fake"))
				.isInstanceOf(TokenVerificacaoInvalidoException.class);

		assertThat(usuario.isEmailVerificado()).isFalse();
		verify(usuarioRepository, never()).save(any());
	}

	@Test
	void deveLancarTokenVerificacaoInvalidoExceptionQuandoTokenJaUsadoOuInexistente() {
		when(tokenRepository.findByTokenAndUsadoFalse("token-invalido")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> verificacaoEmailService.verificarEmail("token-invalido"))
				.isInstanceOf(TokenVerificacaoInvalidoException.class);
	}

}
