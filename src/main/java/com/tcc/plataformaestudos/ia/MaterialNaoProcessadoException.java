package com.tcc.plataformaestudos.ia;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

/**
 * RN07: se a extração de texto falhou/está ausente, a IA não deve ser
 * chamada. Mapeada para 400, conforme docs/contrato-api.md.
 */
public class MaterialNaoProcessadoException extends NegocioException {

	public MaterialNaoProcessadoException(String mensagem) {
		super(HttpStatus.BAD_REQUEST, mensagem);
	}

}
