package com.tcc.plataformaestudos.material;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

public class ArquivoInvalidoException extends NegocioException {

	public ArquivoInvalidoException(String mensagem) {
		super(HttpStatus.BAD_REQUEST, mensagem);
	}

}
