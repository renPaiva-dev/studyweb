package com.tcc.plataformaestudos.usuario;

import java.time.LocalDateTime;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UC21 — Verificar e-mail de cadastro. RN26: toda conta criada permanece
 * com {@code emailVerificado=false} até confirmar a posse do e-mail via
 * token de uso único (24h) — {@link #enviarTokenVerificacao(Usuario)} é
 * chamado por {@link UsuarioService#cadastrar(CadastroRequestDTO)} logo
 * após o cadastro. Mesmo padrão de {@link PasswordResetService} (UC18):
 * token UUID de uso único e uma única exceção de token inválido/expirado.
 *
 * <p>{@link #reenviarVerificacao(String)} segue o mesmo raciocínio
 * anti-enumeração de RN24 (a resposta é sempre a mesma mensagem genérica,
 * exista ou não o e-mail na base) — estendido aqui para também não
 * distinguir "e-mail já verificado" de "e-mail inexistente", evitando
 * vazar esse status a quem não é o dono da conta.
 */
@Service
public class VerificacaoEmailService {

	private static final Logger log = LoggerFactory.getLogger(VerificacaoEmailService.class);
	private static final long VALIDADE_HORAS = 24;
	private static final String MENSAGEM_REENVIO =
			"Se o e-mail existir e ainda não estiver verificado, você receberá um novo link de confirmação.";

	private final UsuarioRepository usuarioRepository;
	private final TokenVerificacaoEmailRepository tokenRepository;
	private final EmailService emailService;
	private final String frontendUrl;

	public VerificacaoEmailService(
			UsuarioRepository usuarioRepository,
			TokenVerificacaoEmailRepository tokenRepository,
			EmailService emailService,
			@Value("${app.frontend-url}") String frontendUrl) {
		this.usuarioRepository = usuarioRepository;
		this.tokenRepository = tokenRepository;
		this.emailService = emailService;
		this.frontendUrl = frontendUrl;
	}

	@Transactional
	public void enviarTokenVerificacao(Usuario usuario) {
		String token = UUID.randomUUID().toString();

		TokenVerificacaoEmail tokenVerificacao = new TokenVerificacaoEmail();
		tokenVerificacao.setUsuario(usuario);
		tokenVerificacao.setToken(token);
		tokenVerificacao.setExpiraEm(LocalDateTime.now().plusHours(VALIDADE_HORAS));
		tokenRepository.save(tokenVerificacao);

		log.info("Token de verificação de e-mail gerado: usuarioId={}", usuario.getId());

		// O e-mail traz um link clicavel (nao so o token cru) para a tela de
		// verificacao do frontend, que ja sabe ler ?token= e chamar a API.
		String link = frontendUrl + "/verificar-email?token=" + token;
		emailService.enviarEmail(
				usuario.getEmail(),
				"Confirme seu e-mail",
				"Clique no link a seguir para confirmar seu e-mail (válido por 24 horas): " + link);
	}

	@Transactional
	public MensagemResponseDTO reenviarVerificacao(String email) {
		usuarioRepository.findByEmail(email)
				.filter(usuario -> !usuario.isEmailVerificado())
				.ifPresent(this::enviarTokenVerificacao);

		return new MensagemResponseDTO(MENSAGEM_REENVIO);
	}

	@Transactional
	public MensagemResponseDTO verificarEmail(String token) {
		TokenVerificacaoEmail tokenVerificacao = tokenRepository.findByTokenAndUsadoFalse(token)
				.orElseThrow(() -> new TokenVerificacaoInvalidoException("Token inválido ou já utilizado"));

		if (tokenVerificacao.getExpiraEm().isBefore(LocalDateTime.now())) {
			throw new TokenVerificacaoInvalidoException("Token expirado");
		}

		Usuario usuario = tokenVerificacao.getUsuario();
		usuario.setEmailVerificado(true);
		usuarioRepository.save(usuario);

		tokenVerificacao.setUsado(true);
		tokenRepository.save(tokenVerificacao);

		log.info("E-mail verificado com sucesso: usuarioId={}", usuario.getId());

		return new MensagemResponseDTO("E-mail verificado com sucesso.");
	}

}
