package com.tcc.plataformaestudos.usuario;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

public class TokenRedefinicaoInvalidoException extends NegocioException {

	public TokenRedefinicaoInvalidoException(String mensagem) {
		super(HttpStatus.BAD_REQUEST, mensagem);
	}

}
