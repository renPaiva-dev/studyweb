package com.tcc.plataformaestudos.ia;

/**
 * Falha no serviço de IA: JSON mal formatado (mesmo após as tentativas) ou
 * serviço indisponível/timeout. Mapeada para 502, conforme
 * docs/contrato-api.md.
 */
public class GeracaoFlashcardsException extends GeracaoConteudoIAException {

	public GeracaoFlashcardsException(String mensagem) {
		super(mensagem);
	}

	public GeracaoFlashcardsException(String mensagem, Throwable causa) {
		super(mensagem, causa);
	}

}
