package com.tcc.plataformaestudos.prontidao;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

/** UC31/RN40 — data-alvo de prova no passado. */
public class DataAlvoProvaInvalidaException extends NegocioException {

	public DataAlvoProvaInvalidaException(String mensagem) {
		super(HttpStatus.BAD_REQUEST, mensagem);
	}

}
