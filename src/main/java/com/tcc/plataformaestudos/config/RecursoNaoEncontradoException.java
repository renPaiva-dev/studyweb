package com.tcc.plataformaestudos.config;

import org.springframework.http.HttpStatus;

public class RecursoNaoEncontradoException extends NegocioException {

	public RecursoNaoEncontradoException(String mensagem) {
		super(HttpStatus.NOT_FOUND, mensagem);
	}

}
