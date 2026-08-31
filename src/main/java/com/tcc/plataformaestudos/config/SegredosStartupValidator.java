package com.tcc.plataformaestudos.config;

import java.util.function.UnaryOperator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * RNF03/segurança — {@code jwt.secret} e {@code gemini.api.key} em
 * {@code application.properties} têm um valor de fallback caso as variáveis
 * de ambiente {@code JWT_SECRET}/{@code GEMINI_API_KEY} não estejam
 * definidas. Sem este aviso, um ambiente que esqueça de configurar essas
 * variáveis sobe silenciosamente usando esse fallback — este componente
 * torna essa condição visível e ruidosa no boot, checando diretamente se a
 * variável de ambiente foi definida (nunca comparando com o valor literal do
 * fallback, para não precisar embutir nenhum segredo no código-fonte).
 */
@Component
public class SegredosStartupValidator {

	private static final Logger log = LoggerFactory.getLogger(SegredosStartupValidator.class);

	private final UnaryOperator<String> leitorDeVariavelDeAmbiente;

	public SegredosStartupValidator() {
		this(System::getenv);
	}

	// Pacote-privado: permite simular variáveis de ambiente presentes/ausentes
	// em teste, sem depender do ambiente real do processo.
	SegredosStartupValidator(UnaryOperator<String> leitorDeVariavelDeAmbiente) {
		this.leitorDeVariavelDeAmbiente = leitorDeVariavelDeAmbiente;
	}

	@EventListener(ApplicationReadyEvent.class)
	public void validarAoSubir() {
		avisarSeAusente("JWT_SECRET", "a assinatura dos tokens JWT");
		avisarSeAusente("GEMINI_API_KEY", "as chamadas à API do Gemini");
	}

	private void avisarSeAusente(String variavel, String usadaPara) {
		String valor = leitorDeVariavelDeAmbiente.apply(variavel);

		if (valor == null || valor.isBlank()) {
			log.warn("ATENÇÃO: variável de ambiente {} não definida — {} está usando o valor de fallback de "
					+ "application.properties. Defina {} com um valor próprio antes de expor este ambiente publicamente.",
					variavel, usadaPara, variavel);
		}
	}

}
