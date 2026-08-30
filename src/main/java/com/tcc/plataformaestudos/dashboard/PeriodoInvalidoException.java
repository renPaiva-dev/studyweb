package com.tcc.plataformaestudos.dashboard;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

public class PeriodoInvalidoException extends NegocioException {

	public PeriodoInvalidoException(String mensagem) {
		super(HttpStatus.BAD_REQUEST, mensagem);
	}

}
