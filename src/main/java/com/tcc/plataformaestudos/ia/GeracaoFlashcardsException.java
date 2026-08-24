package com.tcc.plataformaestudos.ia;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

/**
 * Falha no serviço de IA: JSON mal formatado (mesmo após as tentativas) ou
 * serviço indisponível/timeout. Mapeada para 502, conforme
 * docs/contrato-api.md.
 */
public class GeracaoFlashcardsException extends NegocioException {

	public GeracaoFlashcardsException(String mensagem) {
		super(HttpStatus.BAD_GATEWAY, mensagem);
	}

	public GeracaoFlashcardsException(String mensagem, Throwable causa) {
		super(HttpStatus.BAD_GATEWAY, mensagem, causa);
	}

}
