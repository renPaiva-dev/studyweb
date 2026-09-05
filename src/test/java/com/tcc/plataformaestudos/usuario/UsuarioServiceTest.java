package com.tcc.plataformaestudos.usuario;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

	private static final Long USUARIO_ID = 1L;

	@Mock
	private UsuarioRepository usuarioRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private JwtService jwtService;

	@Mock
	private VerificacaoEmailService verificacaoEmailService;

	@InjectMocks
	private UsuarioService usuarioService;

	@AfterEach
	void limparContextoDeSeguranca() {
		SecurityContextHolder.clearContext();
	}

	private void autenticarUsuario() {
		UsuarioAutenticado principal = new UsuarioAutenticado(USUARIO_ID, "ana@email.com");
		var authentication = new UsernamePasswordAuthenticationToken(principal, null, List.of());
		SecurityContextHolder.getContext().setAuthentication(authentication);
	}

	private Usuario usuarioExistente() {
		Usuario usuario = new Usuario();
		usuario.setId(USUARIO_ID);
		usuario.setNome("Ana Estudante");
		usuario.setNomeUsuario("ana_estudante");
		usuario.setEmail("ana@email.com");
		return usuario;
	}

	@Test
	void deveCadastrarUsuarioQuandoEmailENomeUsuarioAindaNaoExistem() {
		CadastroRequestDTO request = new CadastroRequestDTO("Ana Estudante", "ana_estudante", "ana@email.com", "senha123", true);

		when(usuarioRepository.findByEmail(request.email())).thenReturn(Optional.empty());
		when(usuarioRepository.findByNomeUsuarioIgnoreCase(request.nomeUsuario())).thenReturn(Optional.empty());
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
		assertThat(resposta.nomeUsuario()).isEqualTo("ana_estudante");
		assertThat(resposta.email()).isEqualTo("ana@email.com");
		assertThat(resposta.papel()).isEqualTo(PapelUsuario.ESTUDANTE);
		verify(passwordEncoder).encode("senha123");
		// UC21/RN26: cadastro dispara o token de verificação de e-mail.
		verify(verificacaoEmailService).enviarTokenVerificacao(any());
	}

	@Test
	void deveLancarEmailJaCadastradoExceptionQuandoEmailJaExisteNoCadastro() {
		CadastroRequestDTO request = new CadastroRequestDTO("Ana", "ana_estudante", "ana@email.com", "senha123", true);
		Usuario existente = new Usuario();
		existente.setEmail("ana@email.com");

		when(usuarioRepository.findByEmail(request.email())).thenReturn(Optional.of(existente));

		assertThatThrownBy(() -> usuarioService.cadastrar(request))
				.isInstanceOf(EmailJaCadastradoException.class);

		verify(usuarioRepository, never()).findByNomeUsuarioIgnoreCase(any());
	}

	@Test
	void deveLancarNomeUsuarioJaCadastradoExceptionQuandoNomeUsuarioJaExisteNoCadastro() {
		CadastroRequestDTO request = new CadastroRequestDTO("Ana", "ana_estudante", "ana@email.com", "senha123", true);
		Usuario existente = new Usuario();
		existente.setNomeUsuario("ana_estudante");

		when(usuarioRepository.findByEmail(request.email())).thenReturn(Optional.empty());
		when(usuarioRepository.findByNomeUsuarioIgnoreCase(request.nomeUsuario())).thenReturn(Optional.of(existente));

		assertThatThrownBy(() -> usuarioService.cadastrar(request))
				.isInstanceOf(NomeUsuarioJaCadastradoException.class);

		verify(usuarioRepository, never()).save(any());
	}

	@Test
	void deveObterPerfilDoUsuarioAutenticado() {
		autenticarUsuario();
		when(usuarioRepository.findById(USUARIO_ID)).thenReturn(Optional.of(usuarioExistente()));

		UsuarioResponseDTO resposta = usuarioService.obterPerfil();

		assertThat(resposta.id()).isEqualTo(USUARIO_ID);
		assertThat(resposta.nomeUsuario()).isEqualTo("ana_estudante");
	}

	/**
	 * B17/RN32 — token ainda válido, mas a conta já foi excluída (direito ao
	 * esquecimento): antes lançava IllegalStateException (500 não tratado),
	 * agora deve lançar uma exceção de negócio mapeada para 401.
	 */
	@Test
	void deveLancarUsuarioNaoEncontradoExceptionQuandoTokenValidoApontaParaContaJaExcluida() {
		autenticarUsuario();
		when(usuarioRepository.findById(USUARIO_ID)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> usuarioService.obterPerfil())
				.isInstanceOf(UsuarioNaoEncontradoException.class);
	}

	@Test
	void deveAtualizarPerfilComSucessoQuandoNomeUsuarioNaoEstaEmUsoPorOutro() {
		autenticarUsuario();
		Usuario usuario = usuarioExistente();
		when(usuarioRepository.findById(USUARIO_ID)).thenReturn(Optional.of(usuario));
		when(usuarioRepository.findByNomeUsuarioIgnoreCase("novo_nome")).thenReturn(Optional.empty());
		when(usuarioRepository.save(usuario)).thenReturn(usuario);

		UsuarioResponseDTO resposta = usuarioService.atualizarPerfil(new AtualizarPerfilRequestDTO("Ana Nova", "novo_nome"));

		assertThat(resposta.nome()).isEqualTo("Ana Nova");
		assertThat(resposta.nomeUsuario()).isEqualTo("novo_nome");
	}

	@Test
	void devePermitirAtualizarPerfilMantendoOMesmoNomeUsuarioDoProprioUsuario() {
		autenticarUsuario();
		Usuario usuario = usuarioExistente();
		when(usuarioRepository.findById(USUARIO_ID)).thenReturn(Optional.of(usuario));
		when(usuarioRepository.findByNomeUsuarioIgnoreCase("ana_estudante")).thenReturn(Optional.of(usuario));
		when(usuarioRepository.save(usuario)).thenReturn(usuario);

		UsuarioResponseDTO resposta = usuarioService.atualizarPerfil(new AtualizarPerfilRequestDTO("Ana Estudante", "ana_estudante"));

		assertThat(resposta.nomeUsuario()).isEqualTo("ana_estudante");
	}

	@Test
	void deveLancarNomeUsuarioJaCadastradoExceptionAoAtualizarPerfilComNomeUsadoPorOutroUsuario() {
		autenticarUsuario();
		Usuario usuario = usuarioExistente();
		Usuario outroUsuario = new Usuario();
		outroUsuario.setId(2L);
		outroUsuario.setNomeUsuario("nome_em_uso");

		when(usuarioRepository.findById(USUARIO_ID)).thenReturn(Optional.of(usuario));
		when(usuarioRepository.findByNomeUsuarioIgnoreCase("nome_em_uso")).thenReturn(Optional.of(outroUsuario));

		assertThatThrownBy(() -> usuarioService.atualizarPerfil(new AtualizarPerfilRequestDTO("Ana", "nome_em_uso")))
				.isInstanceOf(NomeUsuarioJaCadastradoException.class);

		verify(usuarioRepository, never()).save(any());
	}

	@Test
	void deveAutenticarComSucessoQuandoCredenciaisSaoValidas() {
		LoginRequestDTO request = new LoginRequestDTO("ana@email.com", "senha123");
		Usuario usuario = new Usuario();
		usuario.setId(1L);
		usuario.setEmail("ana@email.com");
		usuario.setSenhaHash("hash-fake");
		usuario.setEmailVerificado(true);

		JwtService.TokenGerado tokenGerado = new JwtService.TokenGerado("token-fake", Instant.now().plusSeconds(3600));

		when(usuarioRepository.findByEmail(request.email())).thenReturn(Optional.of(usuario));
		when(passwordEncoder.matches("senha123", "hash-fake")).thenReturn(true);
		when(jwtService.gerarToken(usuario)).thenReturn(tokenGerado);

		LoginResponseDTO resposta = usuarioService.autenticar(request);

		assertThat(resposta.token()).isEqualTo("token-fake");
		assertThat(resposta.tipo()).isEqualTo("Bearer");
	}

	@Test
	void deveLancarEmailNaoVerificadoExceptionQuandoEmailAindaNaoFoiVerificado() {
		LoginRequestDTO request = new LoginRequestDTO("ana@email.com", "senha123");
		Usuario usuario = new Usuario();
		usuario.setId(1L);
		usuario.setEmail("ana@email.com");
		usuario.setSenhaHash("hash-fake");
		usuario.setEmailVerificado(false);

		when(usuarioRepository.findByEmail(request.email())).thenReturn(Optional.of(usuario));
		when(passwordEncoder.matches("senha123", "hash-fake")).thenReturn(true);

		assertThatThrownBy(() -> usuarioService.autenticar(request))
				.isInstanceOf(EmailNaoVerificadoException.class);

		verify(jwtService, never()).gerarToken(any());
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

	@Test
	void deveTrocarSenhaComSucessoQuandoSenhaAtualEstaCorreta() {
		autenticarUsuario();
		Usuario usuario = usuarioExistente();
		usuario.setSenhaHash("hash-antigo");

		when(usuarioRepository.findById(USUARIO_ID)).thenReturn(Optional.of(usuario));
		when(passwordEncoder.matches("senhaAtual123!", "hash-antigo")).thenReturn(true);
		when(passwordEncoder.encode("novaSenha456@")).thenReturn("hash-novo");

		usuarioService.trocarSenha(new TrocarSenhaRequestDTO("senhaAtual123!", "novaSenha456@"));

		assertThat(usuario.getSenhaHash()).isEqualTo("hash-novo");
	}

	@Test
	void deveLancarSenhaAtualIncorretaExceptionAoTrocarSenhaComSenhaAtualErrada() {
		autenticarUsuario();
		Usuario usuario = usuarioExistente();
		usuario.setSenhaHash("hash-antigo");

		when(usuarioRepository.findById(USUARIO_ID)).thenReturn(Optional.of(usuario));
		when(passwordEncoder.matches("senha-errada", "hash-antigo")).thenReturn(false);

		assertThatThrownBy(() -> usuarioService.trocarSenha(new TrocarSenhaRequestDTO("senha-errada", "novaSenha456@")))
				.isInstanceOf(SenhaAtualIncorretaException.class);

		verify(usuarioRepository, never()).save(any());
	}

	@Test
	void deveExcluirContaComSucessoQuandoSenhaEstaCorreta() {
		autenticarUsuario();
		Usuario usuario = usuarioExistente();
		usuario.setSenhaHash("hash-fake");

		when(usuarioRepository.findById(USUARIO_ID)).thenReturn(Optional.of(usuario));
		when(passwordEncoder.matches("senhaCorreta", "hash-fake")).thenReturn(true);

		usuarioService.excluirConta("senhaCorreta");

		verify(usuarioRepository).delete(usuario);
	}

	@Test
	void deveLancarSenhaIncorretaExceptionAoExcluirContaComSenhaErrada() {
		autenticarUsuario();
		Usuario usuario = usuarioExistente();
		usuario.setSenhaHash("hash-fake");

		when(usuarioRepository.findById(USUARIO_ID)).thenReturn(Optional.of(usuario));
		when(passwordEncoder.matches("senha-errada", "hash-fake")).thenReturn(false);

		assertThatThrownBy(() -> usuarioService.excluirConta("senha-errada"))
				.isInstanceOf(SenhaIncorretaException.class);

		verify(usuarioRepository, never()).delete(any());
	}

}
