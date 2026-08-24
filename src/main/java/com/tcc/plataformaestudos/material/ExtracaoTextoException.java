package com.tcc.plataformaestudos.material;

/**
 * Falha ao extrair texto de um PDF ou texto extraído insuficiente (RN07).
 * Não é uma NegocioException porque nunca deve chegar ao cliente como erro
 * HTTP — o MaterialOrigemService a captura internamente e marca o
 * MaterialOrigem com status ERRO (a IA não é chamada nesse caso).
 */
public class ExtracaoTextoException extends RuntimeException {

	public ExtracaoTextoException(String mensagem) {
		super(mensagem);
	}

	public ExtracaoTextoException(String mensagem, Throwable causa) {
		super(mensagem, causa);
	}

}
