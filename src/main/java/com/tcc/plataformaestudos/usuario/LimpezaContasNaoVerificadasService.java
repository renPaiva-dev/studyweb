package com.tcc.plataformaestudos.usuario;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/**
 * RN26 — o cadastro (UC01) já cria o {@link Usuario} com
 * {@code emailVerificado=false}; só o login fica bloqueado até a confirmação
 * (ver {@link UsuarioService#autenticar(LoginRequestDTO)}). Isso significa
 * que uma conta cujo e-mail foi digitado errado, ou que o titular nunca
 * confirmou, ocupa esse e-mail/nomeUsuario (RN02/RN22 exigem unicidade) para
 * sempre — ninguém mais consegue se cadastrar com esse valor. Este job
 * remove essas contas depois que TODOS os tokens de verificação já emitidos
 * para elas expiraram (10min — {@link VerificacaoEmailService}), liberando o
 * e-mail/nomeUsuario para um novo cadastro. A exclusão reaproveita a mesma
 * cascata de UC25 (Usuario#decks + banco, ver V6), já que a conta nunca
 * verificada nunca teve dados reais associados.
 */
@Service
@RequiredArgsConstructor
public class LimpezaContasNaoVerificadasService {

	private static final Logger log = LoggerFactory.getLogger(LimpezaContasNaoVerificadasService.class);

	private final UsuarioRepository usuarioRepository;

	@Scheduled(cron = "${app.limpeza-contas-nao-verificadas.cron:0 */5 * * * *}")
	@Transactional
	public void limparContasExpiradas() {
		List<Usuario> candidatos = usuarioRepository.buscarNaoVerificadosComTokensExpirados(LocalDateTime.now());

		if (candidatos.isEmpty()) {
			return;
		}

		usuarioRepository.deleteAll(candidatos);
		log.info("Contas não verificadas removidas por expiração do token de confirmação: total={}", candidatos.size());
	}

}
