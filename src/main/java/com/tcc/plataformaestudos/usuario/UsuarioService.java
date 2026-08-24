package com.tcc.plataformaestudos.usuario;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UsuarioService {

	private static final Logger log = LoggerFactory.getLogger(UsuarioService.class);

	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	@Transactional
	public UsuarioResponseDTO cadastrar(CadastroRequestDTO request) {
		usuarioRepository.findByEmail(request.email()).ifPresent(usuarioExistente -> {
			throw new EmailJaCadastradoException(request.email());
		});

		Usuario usuario = new Usuario();
		usuario.setNome(request.nome());
		usuario.setEmail(request.email());
		usuario.setSenhaHash(passwordEncoder.encode(request.senha()));

		Usuario salvo = usuarioRepository.save(usuario);
		log.info("Usuário cadastrado com sucesso: usuarioId={}", salvo.getId());

		return UsuarioResponseDTO.fromEntity(salvo);
	}

	@Transactional(readOnly = true)
	public LoginResponseDTO autenticar(LoginRequestDTO request) {
		Usuario usuario = usuarioRepository.findByEmail(request.email())
				.orElseThrow(CredenciaisInvalidasException::new);

		if (!passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
			throw new CredenciaisInvalidasException();
		}

		log.info("Login realizado com sucesso: usuarioId={}", usuario.getId());

		return LoginResponseDTO.de(jwtService.gerarToken(usuario));
	}

}
