package com.tcc.plataformaestudos.usuario;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

public class NomeUsuarioJaCadastradoException extends NegocioException {

	public NomeUsuarioJaCadastradoException(String nomeUsuario) {
		super(HttpStatus.CONFLICT, "Nome de usuário já cadastrado: " + nomeUsuario);
	}

}
