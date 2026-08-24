package com.tcc.plataformaestudos.usuario;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

public class EmailJaCadastradoException extends NegocioException {

	public EmailJaCadastradoException(String email) {
		super(HttpStatus.CONFLICT, "E-mail já cadastrado: " + email);
	}

}
