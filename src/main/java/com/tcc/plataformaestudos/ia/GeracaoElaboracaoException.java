package com.tcc.plataformaestudos.ia;

/** UC34 — resposta da IA vazia ou inválida ao gerar feedback de autoexplicação ou analogia. Mapeada para 502. */
public class GeracaoElaboracaoException extends GeracaoConteudoIAException {

	public GeracaoElaboracaoException(String mensagem) {
		super(mensagem);
	}

	public GeracaoElaboracaoException(String mensagem, Throwable causa) {
		super(mensagem, causa);
	}

}
