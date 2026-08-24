package com.tcc.plataformaestudos.quiz;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

public class FlashcardsInsuficientesException extends NegocioException {

	public FlashcardsInsuficientesException(String mensagem) {
		super(HttpStatus.BAD_REQUEST, mensagem);
	}

}
