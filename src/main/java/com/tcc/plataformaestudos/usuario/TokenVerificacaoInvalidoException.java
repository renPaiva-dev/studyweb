package com.tcc.plataformaestudos.usuario;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

public class TokenVerificacaoInvalidoException extends NegocioException {

	public TokenVerificacaoInvalidoException(String mensagem) {
		super(HttpStatus.BAD_REQUEST, mensagem);
	}

}
