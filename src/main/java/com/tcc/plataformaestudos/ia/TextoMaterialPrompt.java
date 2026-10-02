package com.tcc.plataformaestudos.ia;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * RAG-lite (UC04/UC14/UC32): o {@code texto_extraido} do PDF vai direto no
 * prompt. Um PDF de até 15MB (RN06) pode render milhões de caracteres —
 * mais lento, mais caro e sujeito a recusa da API. Este limite corta o texto
 * antes de montar o prompt; o corte é registrado em log.
 */
final class TextoMaterialPrompt {

	private static final Logger log = LoggerFactory.getLogger(TextoMaterialPrompt.class);

	/** Cerca de 15 mil tokens — sobra folga na janela do modelo para a resposta. */
	static final int MAXIMO_CARACTERES = 60_000;

	private TextoMaterialPrompt() {
	}

	static String limitar(String texto) {
		return limitar(texto, MAXIMO_CARACTERES);
	}

	static String limitar(String texto, int maximoCaracteres) {
		if (texto == null || texto.length() <= maximoCaracteres) {
			return texto;
		}

		log.info("Texto do material truncado para o prompt: original={} caracteres, enviado={}", texto.length(), maximoCaracteres);
		return texto.substring(0, maximoCaracteres);
	}

}
