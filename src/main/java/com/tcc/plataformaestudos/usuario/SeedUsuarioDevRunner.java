package com.tcc.plataformaestudos.usuario;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Conveniência só de desenvolvimento local: garante uma conta já verificada
 * ({@code emailVerificado=true}) assim que a aplicação sobe, para não
 * precisar repetir cadastro → verificar e-mail → login a cada vez que se
 * testa a aplicação do zero. Idempotente (não duplica se a conta já existe)
 * e gated por {@code app.seed-usuario-dev.enabled}, que só vem {@code true}
 * em {@code application.properties} (local/gitignored) — em
 * {@code application-docker.properties} (versionado, usado em qualquer
 * deploy real) a propriedade fica ausente e o fallback é {@code false}, para
 * essa conta de credenciais conhecidas nunca nascer fora da máquina do
 * desenvolvedor.
 */
@Component
public class SeedUsuarioDevRunner {

	private static final Logger log = LoggerFactory.getLogger(SeedUsuarioDevRunner.class);

	private static final String EMAIL = "dev@studyweb.local";
	private static final String SENHA = "Dev@12345";
	private static final String NOME_USUARIO = "dev";

	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;
	private final boolean habilitado;
	private final String termosVersaoAtual;

	public SeedUsuarioDevRunner(
			UsuarioRepository usuarioRepository,
			PasswordEncoder passwordEncoder,
			@Value("${app.seed-usuario-dev.enabled:false}") boolean habilitado,
			@Value("${app.termos.versao-atual}") String termosVersaoAtual) {
		this.usuarioRepository = usuarioRepository;
		this.passwordEncoder = passwordEncoder;
		this.habilitado = habilitado;
		this.termosVersaoAtual = termosVersaoAtual;
	}

	@EventListener(ApplicationReadyEvent.class)
	@Transactional
	public void semearAoSubir() {
		if (!habilitado) {
			return;
		}

		if (usuarioRepository.findByEmail(EMAIL).isPresent()) {
			log.info("Usuário de desenvolvimento já existe: email={}", EMAIL);
			return;
		}

		Usuario usuario = new Usuario();
		usuario.setNome("Dev");
		usuario.setNomeUsuario(NOME_USUARIO);
		usuario.setEmail(EMAIL);
		usuario.setSenhaHash(passwordEncoder.encode(SENHA));
		usuario.setEmailVerificado(true);
		usuario.setTermosAceitosEm(LocalDateTime.now());
		usuario.setTermosVersao(termosVersaoAtual);

		usuarioRepository.save(usuario);

		log.info("Usuário de desenvolvimento criado — email={}, senha={} (login liberado, sem precisar verificar e-mail)",
				EMAIL, SENHA);
	}

}
