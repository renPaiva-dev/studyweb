package com.tcc.plataformaestudos.config;

import org.springframework.http.HttpStatus;

public abstract class NegocioException extends RuntimeException {

	private final HttpStatus status;

	protected NegocioException(HttpStatus status, String mensagem) {
		super(mensagem);
		this.status = status;
	}

	protected NegocioException(HttpStatus status, String mensagem, Throwable causa) {
		super(mensagem, causa);
		this.status = status;
	}

	public HttpStatus getStatus() {
		return status;
	}

}
