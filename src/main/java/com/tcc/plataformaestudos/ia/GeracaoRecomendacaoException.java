package com.tcc.plataformaestudos.ia;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

/** UC13 — falha no serviço de IA ao gerar a recomendação de foco de estudo (resposta vazia ou serviço indisponível). Mapeada para 502. */
public class GeracaoRecomendacaoException extends NegocioException {

	public GeracaoRecomendacaoException(String mensagem) {
		super(HttpStatus.BAD_GATEWAY, mensagem);
	}

	public GeracaoRecomendacaoException(String mensagem, Throwable causa) {
		super(HttpStatus.BAD_GATEWAY, mensagem, causa);
	}

}
