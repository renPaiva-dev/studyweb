package com.tcc.plataformaestudos.config;

import org.springframework.http.HttpStatus;

public class AcessoNegadoException extends NegocioException {

	public AcessoNegadoException(String mensagem) {
		super(HttpStatus.FORBIDDEN, mensagem);
	}

}
