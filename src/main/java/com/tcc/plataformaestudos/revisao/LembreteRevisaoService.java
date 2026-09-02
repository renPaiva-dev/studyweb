package com.tcc.plataformaestudos.revisao;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.tcc.plataformaestudos.usuario.EmailService;
import com.tcc.plataformaestudos.usuario.SecurityUtils;

import lombok.RequiredArgsConstructor;

/**
 * UC30/RN39 — lembrete por e-mail de flashcards pendentes de revisão. Fecha
 * o loop da repetição espaçada (RN10): sem isso, o sistema calcula quando o
 * usuário deveria revisar, mas nunca avisa — depende inteiramente de o
 * usuário lembrar de abrir a plataforma sozinho.
 *
 * A leitura do banco fica isolada em {@link LembreteRevisaoDadosService}
 * (transação curta); {@link EmailService#enviarEmail} é sempre chamado
 * DEPOIS de sair dela — nunca com uma conexão de banco presa esperando uma
 * chamada de I/O externa (mesmo cuidado identificado na auditoria de
 * performance para chamadas ao Gemini dentro de {@code @Transactional}).
 */
@Service
@RequiredArgsConstructor
public class LembreteRevisaoService {

	private static final Logger log = LoggerFactory.getLogger(LembreteRevisaoService.class);

	private final LembreteRevisaoDadosService lembreteRevisaoDadosService;
	private final EmailService emailService;

	/** UC30 — job diário: um e-mail por usuário com pendências, nenhum para quem está em dia. */
	@Scheduled(cron = "${app.lembrete-revisao.cron:0 0 8 * * *}")
	public void enviarLembretesDiarios() {
		List<LembreteRevisaoDTO> lembretes = lembreteRevisaoDadosService.montarLembretesDeTodosOsUsuarios();
		lembretes.forEach(this::enviarEmail);

		log.info("Lembretes de revisão pendente enviados: usuarios={}", lembretes.size());
	}

	/** UC30 (teste sob demanda) — envia para o próprio usuário autenticado, mesmo sem pendências. */
	public void enviarLembreteManualParaUsuarioAutenticado() {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();
		LembreteRevisaoDTO lembrete = lembreteRevisaoDadosService.montarLembreteDoUsuario(usuarioId);
		enviarEmail(lembrete);
	}

	private void enviarEmail(LembreteRevisaoDTO lembrete) {
		emailService.enviarEmail(lembrete.email(), "Suas revisões de hoje — StudyWeb", montarCorpo(lembrete));
	}

	private String montarCorpo(LembreteRevisaoDTO lembrete) {
		if (lembrete.totalPendentes() == 0) {
			return "Olá, " + lembrete.nomeUsuario() + "! Você está em dia com suas revisões — nenhum flashcard "
					+ "pendente hoje.";
		}

		StringBuilder corpo = new StringBuilder();
		corpo.append("Olá, ").append(lembrete.nomeUsuario()).append("!\n\n");
		corpo.append("Você tem ").append(lembrete.totalPendentes())
				.append(lembrete.totalPendentes() == 1 ? " flashcard pendente" : " flashcards pendentes")
				.append(" de revisão hoje:\n\n");

		lembrete.pendentesPorDeck().forEach((deck, quantidade) ->
				corpo.append("- ").append(deck).append(": ").append(quantidade).append("\n"));

		corpo.append("\nAcesse a plataforma para revisar agora e não perder o ritmo da repetição espaçada.");
		return corpo.toString();
	}

}
