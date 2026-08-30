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
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

	private static final String MENSAGEM_GENERICA =
			"Se o e-mail existir em nossa base, você receberá instruções de redefinição.";

	@Mock
	private UsuarioRepository usuarioRepository;

	@Mock
	private TokenRedefinicaoSenhaRepository tokenRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private EmailService emailService;

	@InjectMocks
	private PasswordResetService passwordResetService;

	private Usuario usuarioComId(Long id, String email) {
		Usuario usuario = new Usuario();
		usuario.setId(id);
		usuario.setNome("Ana Estudante");
		usuario.setNomeUsuario("ana_estudante");
		usuario.setEmail(email);
		usuario.setSenhaHash("hash-antigo");
		return usuario;
	}

	private TokenRedefinicaoSenha tokenComEstado(Usuario usuario, LocalDateTime expiraEm) {
		TokenRedefinicaoSenha token = new TokenRedefinicaoSenha();
		token.setUsuario(usuario);
		token.setToken("token-fake");
		token.setExpiraEm(expiraEm);
		token.setUsado(false);
		return token;
	}

	@Test
	void deveGerarTokenEEnviarEmailQuandoEmailExiste() {
		Usuario usuario = usuarioComId(1L, "ana@email.com");
		when(usuarioRepository.findByEmail("ana@email.com")).thenReturn(Optional.of(usuario));

		MensagemResponseDTO resposta = passwordResetService.solicitarRedefinicao("ana@email.com");

		assertThat(resposta.mensagem()).isEqualTo(MENSAGEM_GENERICA);

		ArgumentCaptor<TokenRedefinicaoSenha> tokenCaptor = ArgumentCaptor.forClass(TokenRedefinicaoSenha.class);
		verify(tokenRepository).save(tokenCaptor.capture());
		assertThat(tokenCaptor.getValue().getUsuario()).isEqualTo(usuario);
		assertThat(tokenCaptor.getValue().getToken()).isNotBlank();
		assertThat(tokenCaptor.getValue().getExpiraEm()).isAfter(LocalDateTime.now());

		verify(emailService).enviarEmail(eq("ana@email.com"), anyString(), anyString());
	}

	@Test
	void naoDeveGerarTokenNemEnviarEmailQuandoEmailNaoExisteMasRespostaEIgual() {
		when(usuarioRepository.findByEmail("desconhecido@email.com")).thenReturn(Optional.empty());

		MensagemResponseDTO resposta = passwordResetService.solicitarRedefinicao("desconhecido@email.com");

		assertThat(resposta.mensagem()).isEqualTo(MENSAGEM_GENERICA);
		verify(tokenRepository, never()).save(any());
		verify(emailService, never()).enviarEmail(any(), any(), any());
	}

	@Test
	void deveRedefinirSenhaComSucessoQuandoTokenValido() {
		Usuario usuario = usuarioComId(1L, "ana@email.com");
		TokenRedefinicaoSenha token = tokenComEstado(usuario, LocalDateTime.now().plusMinutes(30));

		when(tokenRepository.findByTokenAndUsadoFalse("token-fake")).thenReturn(Optional.of(token));
		when(passwordEncoder.encode("nova-senha-123")).thenReturn("hash-novo");

		MensagemResponseDTO resposta = passwordResetService.redefinirSenha("token-fake", "nova-senha-123");

		assertThat(resposta.mensagem()).isEqualTo("Senha redefinida com sucesso.");
		assertThat(usuario.getSenhaHash()).isEqualTo("hash-novo");
		assertThat(token.isUsado()).isTrue();
		verify(usuarioRepository).save(usuario);
		verify(tokenRepository).save(token);
	}

	@Test
	void deveLancarTokenRedefinicaoInvalidoExceptionQuandoTokenExpirado() {
		Usuario usuario = usuarioComId(1L, "ana@email.com");
		TokenRedefinicaoSenha token = tokenComEstado(usuario, LocalDateTime.now().minusMinutes(1));

		when(tokenRepository.findByTokenAndUsadoFalse("token-fake")).thenReturn(Optional.of(token));

		assertThatThrownBy(() -> passwordResetService.redefinirSenha("token-fake", "nova-senha-123"))
				.isInstanceOf(TokenRedefinicaoInvalidoException.class);

		verify(usuarioRepository, never()).save(any());
		verify(tokenRepository, never()).save(any());
	}

	@Test
	void deveLancarTokenRedefinicaoInvalidoExceptionQuandoTokenJaUsado() {
		// findByTokenAndUsadoFalse nao encontra tokens ja usados por definicao -
		// mesmo caminho de "token inexistente" do ponto de vista do service.
		when(tokenRepository.findByTokenAndUsadoFalse("token-usado")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> passwordResetService.redefinirSenha("token-usado", "nova-senha-123"))
				.isInstanceOf(TokenRedefinicaoInvalidoException.class);
	}

	@Test
	void deveLancarTokenRedefinicaoInvalidoExceptionQuandoTokenInexistente() {
		when(tokenRepository.findByTokenAndUsadoFalse("token-inexistente")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> passwordResetService.redefinirSenha("token-inexistente", "nova-senha-123"))
				.isInstanceOf(TokenRedefinicaoInvalidoException.class);
	}

}
