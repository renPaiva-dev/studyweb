package com.tcc.plataformaestudos.usuario;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

	@Mock
	private UsuarioRepository usuarioRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private JwtService jwtService;

	@InjectMocks
	private UsuarioService usuarioService;

	@Test
	void deveCadastrarUsuarioQuandoEmailAindaNaoExiste() {
		CadastroRequestDTO request = new CadastroRequestDTO("Ana Estudante", "ana@email.com", "senha123");

		when(usuarioRepository.findByEmail(request.email())).thenReturn(Optional.empty());
		when(passwordEncoder.encode(request.senha())).thenReturn("hash-fake");
		when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
			Usuario usuario = invocation.getArgument(0);
			usuario.setId(1L);
			usuario.setCriadoEm(LocalDateTime.now());
			return usuario;
		});

		UsuarioResponseDTO resposta = usuarioService.cadastrar(request);

		assertThat(resposta.id()).isEqualTo(1L);
		assertThat(resposta.nome()).isEqualTo("Ana Estudante");
		assertThat(resposta.email()).isEqualTo("ana@email.com");
		verify(passwordEncoder).encode("senha123");
	}

	@Test
	void deveLancarEmailJaCadastradoExceptionQuandoEmailJaExisteNoCadastro() {
		CadastroRequestDTO request = new CadastroRequestDTO("Ana", "ana@email.com", "senha123");
		Usuario existente = new Usuario();
		existente.setEmail("ana@email.com");

		when(usuarioRepository.findByEmail(request.email())).thenReturn(Optional.of(existente));

		assertThatThrownBy(() -> usuarioService.cadastrar(request))
				.isInstanceOf(EmailJaCadastradoException.class);
	}

	@Test
	void deveAutenticarComSucessoQuandoCredenciaisSaoValidas() {
		LoginRequestDTO request = new LoginRequestDTO("ana@email.com", "senha123");
		Usuario usuario = new Usuario();
		usuario.setId(1L);
		usuario.setEmail("ana@email.com");
		usuario.setSenhaHash("hash-fake");

		JwtService.TokenGerado tokenGerado = new JwtService.TokenGerado("token-fake", Instant.now().plusSeconds(3600));

		when(usuarioRepository.findByEmail(request.email())).thenReturn(Optional.of(usuario));
		when(passwordEncoder.matches("senha123", "hash-fake")).thenReturn(true);
		when(jwtService.gerarToken(usuario)).thenReturn(tokenGerado);

		LoginResponseDTO resposta = usuarioService.autenticar(request);

		assertThat(resposta.token()).isEqualTo("token-fake");
		assertThat(resposta.tipo()).isEqualTo("Bearer");
	}

	@Test
	void deveLancarCredenciaisInvalidasExceptionQuandoSenhaEstaErrada() {
		LoginRequestDTO request = new LoginRequestDTO("ana@email.com", "senha-errada");
		Usuario usuario = new Usuario();
		usuario.setEmail("ana@email.com");
		usuario.setSenhaHash("hash-fake");

		when(usuarioRepository.findByEmail(request.email())).thenReturn(Optional.of(usuario));
		when(passwordEncoder.matches("senha-errada", "hash-fake")).thenReturn(false);

		assertThatThrownBy(() -> usuarioService.autenticar(request))
				.isInstanceOf(CredenciaisInvalidasException.class);
	}

	@Test
	void deveLancarCredenciaisInvalidasExceptionQuandoEmailNaoExisteNoLogin() {
		LoginRequestDTO request = new LoginRequestDTO("desconhecido@email.com", "qualquer");

		when(usuarioRepository.findByEmail(request.email())).thenReturn(Optional.empty());

		assertThatThrownBy(() -> usuarioService.autenticar(request))
				.isInstanceOf(CredenciaisInvalidasException.class);
	}

}
