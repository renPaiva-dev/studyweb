package com.tcc.plataformaestudos.ia;

/** UC27 — falha no serviço de IA ao gerar uma prova personalizada (JSON mal formatado ou serviço indisponível). Mapeada para 502. */
public class GeracaoProvaException extends GeracaoConteudoIAException {

	public GeracaoProvaException(String mensagem) {
		super(mensagem);
	}

	public GeracaoProvaException(String mensagem, Throwable causa) {
		super(mensagem, causa);
	}

}
