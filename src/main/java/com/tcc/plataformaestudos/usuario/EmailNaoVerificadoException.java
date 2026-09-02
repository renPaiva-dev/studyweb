package com.tcc.plataformaestudos.usuario;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

/** UC21/RN26 — login bloqueado enquanto o e-mail não foi confirmado. Mapeada para 403. */
public class EmailNaoVerificadoException extends NegocioException {

	public EmailNaoVerificadoException() {
		super(HttpStatus.FORBIDDEN, "E-mail ainda não verificado. Verifique sua caixa de entrada ou solicite um novo link de confirmação.");
	}

}
