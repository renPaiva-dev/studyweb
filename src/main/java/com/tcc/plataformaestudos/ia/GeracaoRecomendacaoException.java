package com.tcc.plataformaestudos.ia;

/** UC13 — falha no serviço de IA ao gerar a recomendação de foco de estudo (resposta vazia ou serviço indisponível). Mapeada para 502. */
public class GeracaoRecomendacaoException extends GeracaoConteudoIAException {

	public GeracaoRecomendacaoException(String mensagem) {
		super(mensagem);
	}

	public GeracaoRecomendacaoException(String mensagem, Throwable causa) {
		super(mensagem, causa);
	}

}
