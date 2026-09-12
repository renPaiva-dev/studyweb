package com.tcc.plataformaestudos.prontidao;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

/** UC31/RN40 — prontidão consultada antes de o estudante definir uma data-alvo de prova. */
public class DataAlvoProvaNaoDefinidaException extends NegocioException {

	public DataAlvoProvaNaoDefinidaException(String mensagem) {
		super(HttpStatus.BAD_REQUEST, mensagem);
	}

}
