package com.tcc.plataformaestudos.usuario;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

public class CredenciaisInvalidasException extends NegocioException {

	public CredenciaisInvalidasException() {
		super(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos");
	}

}
