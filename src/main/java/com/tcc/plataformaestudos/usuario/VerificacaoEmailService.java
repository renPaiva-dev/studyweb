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
 * token de uso único (10min) — {@link #enviarTokenVerificacao(Usuario)} é
 * chamado por {@link UsuarioService#cadastrar(CadastroRequestDTO)} logo
 * após o cadastro. Mesmo padrão de {@link PasswordResetService} (UC18):
 * token UUID de uso único e uma única exceção de token inválido/expirado.
 * Contas que nunca confirmam dentro da janela são removidas por
 * {@link LimpezaContasNaoVerificadasService}, para não travar o e-mail/
 * nomeUsuario de alguém que nunca voltou a confirmar (RN26).
 *
 * <p>{@link #reenviarVerificacao(String)} segue o mesmo raciocínio
 * anti-enumeração de RN24 (a resposta é sempre a mesma mensagem genérica,
 * exista ou não o e-mail cadastrado) — estendido aqui para também não
 * distinguir "e-mail já verificado" de "e-mail inexistente", evitando
 * vazar esse status a quem não é o dono da conta.
 */
@Service
public class VerificacaoEmailService {

	private static final Logger log = LoggerFactory.getLogger(VerificacaoEmailService.class);
	private static final long VALIDADE_MINUTOS = 10;
	private static final String MENSAGEM_REENVIO =
			"Se este e-mail estiver cadastrado e ainda não confirmado, enviamos um novo link de confirmação.";
	// C4 (Docs/auditoria-coerencia-seguranca-2026-09.md): destinatário usado
	// para simular o envio de e-mail quando não há nada real para reenviar
	// (e-mail inexistente ou já verificado) - nunca o e-mail informado pelo
	// cliente, só para gastar o mesmo tempo de rede do envio real.
	private static final String DESTINATARIO_DUMMY_ANTI_TIMING = "timing-dummy@plataformaestudos.local";

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
		tokenVerificacao.setExpiraEm(LocalDateTime.now().plusMinutes(VALIDADE_MINUTOS));
		tokenRepository.save(tokenVerificacao);

		log.info("Token de verificação de e-mail gerado: usuarioId={}", usuario.getId());

		// O e-mail traz um link clicavel (nao so o token cru) para a tela de
		// verificacao do frontend, que ja sabe ler ?token= e chamar a API.
		String link = frontendUrl + "/verificar-email?token=" + token;
		emailService.enviarEmail(
				usuario.getEmail(),
				"Confirme seu e-mail",
				"Clique no link a seguir para confirmar seu e-mail (válido por 10 minutos): " + link);
	}

	@Transactional
	public MensagemResponseDTO reenviarVerificacao(String email) {
		Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
		boolean deveReenviarDeVerdade = usuario != null && !usuario.isEmailVerificado();

		if (deveReenviarDeVerdade) {
			enviarTokenVerificacao(usuario);
		} else {
			// C4: mesmo quando não há nada real para reenviar (e-mail
			// inexistente ou já verificado), simula o envio para um
			// destinatário descartado, para que o tempo de resposta não
			// distinga os três cenários por timing - mesmo cuidado da
			// mensagem genérica de MENSAGEM_REENVIO, mas para o tempo de
			// resposta.
			simularReenvio();
		}

		return new MensagemResponseDTO(MENSAGEM_REENVIO);
	}

	private void simularReenvio() {
		String tokenDescartado = UUID.randomUUID().toString();
		String link = frontendUrl + "/verificar-email?token=" + tokenDescartado;
		emailService.enviarEmail(
				DESTINATARIO_DUMMY_ANTI_TIMING,
				"Confirme seu e-mail",
				"Clique no link a seguir para confirmar seu e-mail (válido por 10 minutos): " + link);
	}

	@Transactional
	public MensagemResponseDTO verificarEmail(String token) {
		// N9 (Docs/auditoria-coerencia-seguranca-2026-09.md): mensagem em
		// linguagem humana ("link"), não jargão técnico ("token") - esse
		// texto chega cru ao usuário via toast no frontend.
		TokenVerificacaoEmail tokenVerificacao = tokenRepository.findByTokenAndUsadoFalse(token)
				.orElseThrow(() -> new TokenVerificacaoInvalidoException(
						"Link inválido ou já utilizado. Solicite um novo link de confirmação."));

		if (tokenVerificacao.getExpiraEm().isBefore(LocalDateTime.now())) {
			throw new TokenVerificacaoInvalidoException("Link expirado. Solicite um novo link de confirmação.");
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
