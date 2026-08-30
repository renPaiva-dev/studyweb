package com.tcc.plataformaestudos.usuario;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;

class EmailServiceTest {

	@Test
	@SuppressWarnings("unchecked")
	void naoDeveTentarEnviarQuandoMailHostNaoEstaConfigurado() {
		ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
		EmailService emailService = new EmailService(provider, "", "no-reply@teste.com");

		emailService.enviarEmail("ana@email.com", "Assunto", "Corpo");

		verify(provider, never()).getObject();
	}

	@Test
	@SuppressWarnings("unchecked")
	void deveEnviarViaJavaMailSenderQuandoMailHostEstaConfigurado() {
		ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
		JavaMailSender javaMailSender = mock(JavaMailSender.class);
		when(provider.getObject()).thenReturn(javaMailSender);

		EmailService emailService = new EmailService(provider, "smtp.exemplo.com", "no-reply@teste.com");
		emailService.enviarEmail("ana@email.com", "Assunto", "Corpo");

		verify(javaMailSender).send(any(org.springframework.mail.SimpleMailMessage.class));
	}

}
