package com.tcc.plataformaestudos.quiz;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

/** UC27 — um ou mais flashcardIds informados não existem ou não pertencem ao deck informado. */
public class FlashcardsInvalidosException extends NegocioException {

	public FlashcardsInvalidosException(String mensagem) {
		super(HttpStatus.BAD_REQUEST, mensagem);
	}

}
