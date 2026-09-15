package com.tcc.plataformaestudos.ia;

/** UC32 — falha no serviço de IA ao responder uma pergunta sobre o material de um deck (resposta vazia ou serviço indisponível). Mapeada para 502. */
public class GeracaoRespostaMaterialException extends GeracaoConteudoIAException {

	public GeracaoRespostaMaterialException(String mensagem) {
		super(mensagem);
	}

	public GeracaoRespostaMaterialException(String mensagem, Throwable causa) {
		super(mensagem, causa);
	}

}
