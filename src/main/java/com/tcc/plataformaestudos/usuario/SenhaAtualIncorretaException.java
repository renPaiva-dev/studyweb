package com.tcc.plataformaestudos.usuario;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

/** UC26/RN33 — senha atual informada não bate com o hash armazenado ao trocar senha (contrato: 400). */
public class SenhaAtualIncorretaException extends NegocioException {

	public SenhaAtualIncorretaException() {
		super(HttpStatus.BAD_REQUEST, "Senha atual incorreta");
	}

}
