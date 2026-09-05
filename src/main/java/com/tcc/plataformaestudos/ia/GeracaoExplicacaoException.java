package com.tcc.plataformaestudos.ia;

/** UC14 — falha no serviço de IA ao gerar a explicação de um flashcard (resposta vazia ou serviço indisponível). Mapeada para 502. */
public class GeracaoExplicacaoException extends GeracaoConteudoIAException {

	public GeracaoExplicacaoException(String mensagem) {
		super(mensagem);
	}

	public GeracaoExplicacaoException(String mensagem, Throwable causa) {
		super(mensagem, causa);
	}

}
