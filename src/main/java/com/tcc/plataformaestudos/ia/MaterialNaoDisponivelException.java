package com.tcc.plataformaestudos.ia;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

/** UC32/RN41 — pergunta feita a um deck sem nenhum material processado (com texto extraído) para ancorar a resposta. */
public class MaterialNaoDisponivelException extends NegocioException {

	public MaterialNaoDisponivelException(String mensagem) {
		super(HttpStatus.BAD_REQUEST, mensagem);
	}

}
