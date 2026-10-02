package com.tcc.plataformaestudos.usuario;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {

	private static final Logger log = LoggerFactory.getLogger(UsuarioService.class);

	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final VerificacaoEmailService verificacaoEmailService;
	private final EmailService emailService;
	private final String termosVersaoAtual;
	private final String hashSenhaDummy;

	public UsuarioService(
			UsuarioRepository usuarioRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService,
			VerificacaoEmailService verificacaoEmailService,
			EmailService emailService,
			@Value("${app.termos.versao-atual}") String termosVersaoAtual) {
		this.usuarioRepository = usuarioRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.verificacaoEmailService = verificacaoEmailService;
		this.emailService = emailService;
		this.termosVersaoAtual = termosVersaoAtual;
		// C4 (Docs/auditoria-coerencia-seguranca-2026-09.md): hash BCrypt
		// válido de uma senha aleatória descartada, gerado uma única vez na
		// inicialização - usado em autenticar() só para gastar o mesmo tempo
		// de CPU de passwordEncoder.matches quando o e-mail não existe.
		this.hashSenhaDummy = passwordEncoder.encode(UUID.randomUUID().toString());
	}

	@Transactional
	public UsuarioResponseDTO cadastrar(CadastroRequestDTO request) {
		// Honeypot anti-bot: se o campo tecnico veio preenchido, finge sucesso
		// sem tocar o banco nem disparar e-mail - nao ensina ao bot o que foi
		// detectado (ver Docs/seguranca.md). Usuarios reais nunca preenchem
		// este campo (invisivel, fora da ordem de tab).
		if (request.telefoneConfirmacao() != null && !request.telefoneConfirmacao().isBlank()) {
			log.warn("Tentativa de cadastro bloqueada por honeypot preenchido (e-mail informado: {})", request.email());
			return respostaSemPersistir(request);
		}

		// I1 (Docs/auditoria-coerencia-seguranca-2026-09.md): nao revela que o
		// e-mail ja existe (mesmo raciocinio anti-enumeracao de RN24, aplicado
		// aqui ao cadastro) - notifica o dono real da conta por e-mail e
		// devolve a mesma resposta sintetica do honeypot, sem criar conta
		// duplicada nem confirmar a existencia da conta a quem preencheu o
		// formulario. nomeUsuario continua verificado normalmente logo abaixo:
		// e um identificador PUBLICO (RN22), nao um dado sensivel - revelar
		// que ja esta em uso nao e um problema de enumeracao.
		Optional<Usuario> usuarioComEsteEmail = usuarioRepository.findByEmail(request.email());
		if (usuarioComEsteEmail.isPresent()) {
			notificarTentativaDeCadastroComEmailExistente(usuarioComEsteEmail.get());
			return respostaSemPersistir(request);
		}

		// RN34: unicidade de nomeUsuario e case-insensitive.
		usuarioRepository.findByNomeUsuarioIgnoreCase(request.nomeUsuario()).ifPresent(usuarioExistente -> {
			throw new NomeUsuarioJaCadastradoException(request.nomeUsuario());
		});

		Usuario usuario = new Usuario();
		usuario.setNome(request.nome());
		usuario.setNomeUsuario(request.nomeUsuario());
		usuario.setEmail(request.email());
		usuario.setSenhaHash(passwordEncoder.encode(request.senha()));
		// RN30 (LGPD): a versao do termo vem do backend, nunca do cliente.
		usuario.setTermosAceitosEm(LocalDateTime.now());
		usuario.setTermosVersao(termosVersaoAtual);

		Usuario salvo = usuarioRepository.save(usuario);
		log.info("Usuário cadastrado com sucesso: usuarioId={}", salvo.getId());

		// UC21/RN26: emailVerificado nasce false (default do campo); dispara o
		// token de confirmação no mesmo fluxo do cadastro.
		verificacaoEmailService.enviarTokenVerificacao(salvo);

		return UsuarioResponseDTO.fromEntity(salvo);
	}

	/**
	 * Resposta sintetica para uma tentativa de cadastro bloqueada por honeypot
	 * ou para um e-mail ja cadastrado (achado I1) - mesmo formato/status (201)
	 * de um cadastro real, sem persistir nada nem revelar ao requisitante por
	 * que a conta "criada" nao existe de verdade.
	 */
	private UsuarioResponseDTO respostaSemPersistir(CadastroRequestDTO request) {
		return new UsuarioResponseDTO(-1L, request.nome(), request.nomeUsuario(), request.email(),
				PapelUsuario.ESTUDANTE, LocalDateTime.now());
	}

	private void notificarTentativaDeCadastroComEmailExistente(Usuario usuarioExistente) {
		emailService.enviarEmail(
				usuarioExistente.getEmail(),
				"Tentativa de cadastro com seu e-mail",
				"Alguém tentou criar uma nova conta na StudyWeb usando este e-mail, mas você já tem uma conta "
						+ "por aqui. Se foi você, é só fazer login normalmente. Se não foi você, pode ignorar "
						+ "esta mensagem com segurança.");
	}

	/** UC19 — retorna os dados do usuário autenticado (RN01 implícito: sempre o próprio). */
	@Transactional(readOnly = true)
	public UsuarioResponseDTO obterPerfil() {
		return UsuarioResponseDTO.fromEntity(buscarUsuarioAutenticado());
	}

	/**
	 * UC19 — atualiza nome e nomeUsuario do usuário autenticado, revalidando
	 * unicidade de nomeUsuario (RN22) — só barra se o novo valor pertencer a
	 * OUTRO usuário, não ao próprio (permite salvar sem trocar o valor).
	 */
	@Transactional
	public UsuarioResponseDTO atualizarPerfil(AtualizarPerfilRequestDTO request) {
		Usuario usuario = buscarUsuarioAutenticado();

		// RN34: unicidade de nomeUsuario e case-insensitive.
		usuarioRepository.findByNomeUsuarioIgnoreCase(request.nomeUsuario())
				.filter(outro -> !outro.getId().equals(usuario.getId()))
				.ifPresent(outro -> {
					throw new NomeUsuarioJaCadastradoException(request.nomeUsuario());
				});

		usuario.setNome(request.nome());
		usuario.setNomeUsuario(request.nomeUsuario());

		Usuario atualizado = usuarioRepository.save(usuario);
		log.info("Perfil atualizado: usuarioId={}", atualizado.getId());

		return UsuarioResponseDTO.fromEntity(atualizado);
	}

	/**
	 * UC26/RN33 — troca de senha autenticada: exige a senha atual (prova de
	 * conhecimento, diferente do fluxo de esquecimento por token de e-mail em
	 * {@link PasswordResetService}). A força da nova senha já é validada em
	 * {@code @Valid} via {@code @SenhaForte} no DTO (RN27).
	 */
	@Transactional
	public MensagemResponseDTO trocarSenha(TrocarSenhaRequestDTO request) {
		Usuario usuario = buscarUsuarioAutenticado();

		if (!passwordEncoder.matches(request.senhaAtual(), usuario.getSenhaHash())) {
			throw new SenhaAtualIncorretaException();
		}

		usuario.setSenhaHash(passwordEncoder.encode(request.novaSenha()));
		usuarioRepository.save(usuario);
		log.info("Senha trocada com sucesso: usuarioId={}", usuario.getId());

		return new MensagemResponseDTO("Senha alterada com sucesso.");
	}

	/**
	 * UC25/RN32 (LGPD, direito ao esquecimento) — remove permanentemente o
	 * usuário autenticado e, em cascata (Usuario#decks + banco, ver V6),
	 * todos os dados vinculados. Exige reautenticação (senha atual) para
	 * evitar exclusão acidental ou por sessão sequestrada.
	 */
	@Transactional
	public void excluirConta(String senhaInformada) {
		Usuario usuario = buscarUsuarioAutenticado();

		if (!passwordEncoder.matches(senhaInformada, usuario.getSenhaHash())) {
			throw new SenhaIncorretaException();
		}

		usuarioRepository.delete(usuario);
		log.info("Conta excluída permanentemente: usuarioId={}", usuario.getId());
	}

	private Usuario buscarUsuarioAutenticado() {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();
		return usuarioRepository.findById(usuarioId)
				.orElseThrow(() -> {
					// B17/RN32: token ainda válido, mas a conta já foi excluída —
					// cenário esperado, não um erro de infraestrutura (WARN, não ERROR).
					log.warn("Token válido para usuário já excluído: usuarioId={}", usuarioId);
					return new UsuarioNaoEncontradoException(usuarioId);
				});
	}

	@Transactional(readOnly = true)
	public LoginResponseDTO autenticar(LoginRequestDTO request) {
		Usuario usuario = usuarioRepository.findByEmail(request.email()).orElse(null);

		// C4: mesmo quando o e-mail não existe, roda passwordEncoder.matches
		// contra o hash dummy - sem isso, "e-mail não existe" responde bem
		// mais rápido que "senha errada" (que faz o BCrypt de verdade),
		// reabrindo por timing o mesmo vazamento que CredenciaisInvalidasException
		// (mensagem genérica, abaixo) foi desenhada para fechar.
		String hashParaComparar = usuario != null ? usuario.getSenhaHash() : hashSenhaDummy;
		boolean senhaConfere = passwordEncoder.matches(request.senha(), hashParaComparar);

		if (usuario == null || !senhaConfere) {
			throw new CredenciaisInvalidasException();
		}

		// UC21/RN26: checado depois da senha (nunca antes) - revelar "e-mail
		// não verificado" para uma senha errada vazaria que aquele e-mail existe.
		if (!usuario.isEmailVerificado()) {
			throw new EmailNaoVerificadoException();
		}

		log.info("Login realizado com sucesso: usuarioId={}", usuario.getId());

		return LoginResponseDTO.de(jwtService.gerarToken(usuario));
	}

}
