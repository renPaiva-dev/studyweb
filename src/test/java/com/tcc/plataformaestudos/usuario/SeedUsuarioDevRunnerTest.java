package com.tcc.plataformaestudos.usuario;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class SeedUsuarioDevRunnerTest {

	@Mock
	private UsuarioRepository usuarioRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Test
	void naoDeveCriarNadaQuandoDesabilitado() {
		SeedUsuarioDevRunner runner = new SeedUsuarioDevRunner(usuarioRepository, passwordEncoder, false, "1.0");

		runner.semearAoSubir();

		verify(usuarioRepository, never()).findByEmail(any());
		verify(usuarioRepository, never()).save(any());
	}

	@Test
	void naoDeveDuplicarQuandoContaDeDesenvolvimentoJaExiste() {
		when(usuarioRepository.findByEmail("dev@studyweb.local")).thenReturn(Optional.of(new Usuario()));
		SeedUsuarioDevRunner runner = new SeedUsuarioDevRunner(usuarioRepository, passwordEncoder, true, "1.0");

		runner.semearAoSubir();

		verify(usuarioRepository, never()).save(any());
	}

	@Test
	void deveCriarUsuarioJaVerificadoQuandoHabilitadoENaoExiste() {
		when(usuarioRepository.findByEmail("dev@studyweb.local")).thenReturn(Optional.empty());
		when(passwordEncoder.encode("Dev@12345")).thenReturn("hash-dev");
		SeedUsuarioDevRunner runner = new SeedUsuarioDevRunner(usuarioRepository, passwordEncoder, true, "1.0");

		runner.semearAoSubir();

		ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
		verify(usuarioRepository).save(captor.capture());
		assertThat(captor.getValue().getEmail()).isEqualTo("dev@studyweb.local");
		assertThat(captor.getValue().getSenhaHash()).isEqualTo("hash-dev");
		assertThat(captor.getValue().isEmailVerificado()).isTrue();
	}

}
