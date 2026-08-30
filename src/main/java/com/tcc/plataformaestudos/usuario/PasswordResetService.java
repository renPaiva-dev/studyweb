package com.tcc.plataformaestudos.usuario;

import java.time.LocalDateTime;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/**
 * UC18 — Esqueci/Redefinir senha. RN24: token de uso único, válido por 1h;
 * a resposta de {@link #solicitarRedefinicao(String)} é sempre a mesma
 * mensagem genérica, exista ou não o e-mail na base (evita enumeração de
 * contas).
 */
@Service
@RequiredArgsConstructor
public class PasswordResetService {

	private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
	private static final long VALIDADE_HORAS = 1;
	private static final String MENSAGEM_SOLICITACAO =
			"Se o e-mail existir em nossa base, você receberá instruções de redefinição.";

	private final UsuarioRepository usuarioRepository;
	private final TokenRedefinicaoSenhaRepository tokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final EmailService emailService;

	@Transactional
	public MensagemResponseDTO solicitarRedefinicao(String email) {
		usuarioRepository.findByEmail(email).ifPresent(usuario -> {
			String token = UUID.randomUUID().toString();

			TokenRedefinicaoSenha tokenRedefinicao = new TokenRedefinicaoSenha();
			tokenRedefinicao.setUsuario(usuario);
			tokenRedefinicao.setToken(token);
			tokenRedefinicao.setExpiraEm(LocalDateTime.now().plusHours(VALIDADE_HORAS));
			tokenRepository.save(tokenRedefinicao);

			log.info("Token de redefinição de senha gerado: usuarioId={}", usuario.getId());

			emailService.enviarEmail(
					usuario.getEmail(),
					"Redefinição de senha",
					"Use o token a seguir para redefinir sua senha (válido por 1 hora): " + token);
		});

		// RN24: mesma resposta independente de o e-mail existir ou não.
		return new MensagemResponseDTO(MENSAGEM_SOLICITACAO);
	}

	@Transactional
	public MensagemResponseDTO redefinirSenha(String token, String novaSenha) {
		TokenRedefinicaoSenha tokenRedefinicao = tokenRepository.findByTokenAndUsadoFalse(token)
				.orElseThrow(() -> new TokenRedefinicaoInvalidoException("Token inválido ou já utilizado"));

		if (tokenRedefinicao.getExpiraEm().isBefore(LocalDateTime.now())) {
			throw new TokenRedefinicaoInvalidoException("Token expirado");
		}

		Usuario usuario = tokenRedefinicao.getUsuario();
		usuario.setSenhaHash(passwordEncoder.encode(novaSenha));
		usuarioRepository.save(usuario);

		tokenRedefinicao.setUsado(true);
		tokenRepository.save(tokenRedefinicao);

		log.info("Senha redefinida com sucesso: usuarioId={}", usuario.getId());

		return new MensagemResponseDTO("Senha redefinida com sucesso.");
	}

}
