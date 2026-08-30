package com.tcc.plataformaestudos.ia;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

/** UC27 — falha no serviço de IA ao gerar uma prova personalizada (JSON mal formatado ou serviço indisponível). Mapeada para 502. */
public class GeracaoProvaException extends NegocioException {

	public GeracaoProvaException(String mensagem) {
		super(HttpStatus.BAD_GATEWAY, mensagem);
	}

	public GeracaoProvaException(String mensagem, Throwable causa) {
		super(HttpStatus.BAD_GATEWAY, mensagem, causa);
	}

}
