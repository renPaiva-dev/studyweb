package com.tcc.plataformaestudos.ia;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

/** UC14 — falha no serviço de IA ao gerar a explicação de um flashcard (resposta vazia ou serviço indisponível). Mapeada para 502. */
public class GeracaoExplicacaoException extends NegocioException {

	public GeracaoExplicacaoException(String mensagem) {
		super(HttpStatus.BAD_GATEWAY, mensagem);
	}

	public GeracaoExplicacaoException(String mensagem, Throwable causa) {
		super(HttpStatus.BAD_GATEWAY, mensagem, causa);
	}

}
