package com.tcc.plataformaestudos.usuario;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * UC18/RN24 — envia e-mails transacionais (redefinição de senha). Quando
 * {@code spring.mail.host} não está configurado (sem variáveis MAIL_* no
 * ambiente), não tenta enviar de verdade — apenas loga o conteúdo em nível
 * INFO, permitindo testar o fluxo completo sem uma conta SMTP real
 * (desenvolvimento/demonstração). {@link JavaMailSender} é resolvido via
 * {@link ObjectProvider} (em vez de injeção direta) porque a autoconfiguração
 * do Spring Boot pode não registrar esse bean quando nenhuma propriedade de
 * mail está definida — assim o serviço nunca falha ao subir por causa disso,
 * já que só toca no provider quando {@code smtpConfigurado} é verdadeiro.
 */
@Service
public class EmailService {

	private static final Logger log = LoggerFactory.getLogger(EmailService.class);

	private final ObjectProvider<JavaMailSender> javaMailSenderProvider;
	private final String remetente;
	private final boolean smtpConfigurado;

	public EmailService(
			ObjectProvider<JavaMailSender> javaMailSenderProvider,
			@Value("${spring.mail.host:}") String mailHost,
			@Value("${spring.mail.username:no-reply@plataformaestudos.local}") String remetente) {
		this.javaMailSenderProvider = javaMailSenderProvider;
		this.remetente = remetente;
		this.smtpConfigurado = StringUtils.hasText(mailHost);
	}

	public void enviarEmail(String destinatario, String assunto, String corpo) {
		if (!smtpConfigurado) {
			// O corpo pode conter dados sensíveis (ex.: token de redefinição de
			// senha, RN24) — nunca em INFO, que fica ligado por padrão em produção.
			// Só o indicativo de que o envio foi simulado vai em INFO.
			log.info("MODO DESENVOLVIMENTO — sem envio real de e-mail. destinatario={}, assunto=\"{}\"", destinatario, assunto);
			log.debug("MODO DESENVOLVIMENTO — corpo do e-mail: {}", corpo);
			return;
		}

		SimpleMailMessage mensagem = new SimpleMailMessage();
		mensagem.setFrom(remetente);
		mensagem.setTo(destinatario);
		mensagem.setSubject(assunto);
		mensagem.setText(corpo);
		javaMailSenderProvider.getObject().send(mensagem);

		log.info("E-mail enviado: destinatario={}", destinatario);
	}

}
