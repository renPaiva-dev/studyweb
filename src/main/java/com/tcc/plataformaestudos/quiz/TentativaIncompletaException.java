package com.tcc.plataformaestudos.quiz;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

/** RN15: um quiz só pode ser respondido integralmente. */
public class TentativaIncompletaException extends NegocioException {

	public TentativaIncompletaException(String mensagem) {
		super(HttpStatus.BAD_REQUEST, mensagem);
	}

}
