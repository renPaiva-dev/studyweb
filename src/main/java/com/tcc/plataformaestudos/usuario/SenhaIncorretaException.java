package com.tcc.plataformaestudos.usuario;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

/** UC25/RN32 — senha informada para excluir a conta não bate com o hash armazenado (contrato: 401). */
public class SenhaIncorretaException extends NegocioException {

	public SenhaIncorretaException() {
		super(HttpStatus.UNAUTHORIZED, "Senha incorreta");
	}

}
