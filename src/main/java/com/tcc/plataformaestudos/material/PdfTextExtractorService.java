package com.tcc.plataformaestudos.material;

import java.io.File;
import java.io.IOException;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

/**
 * Isolado do resto da lógica de UC03: só sabe extrair texto de um arquivo
 * PDF já salvo em disco. Não conhece Deck, MaterialOrigem, nem HTTP.
 */
@Service
public class PdfTextExtractorService {

	private static final int MINIMO_CARACTERES = 50;

	public String extrairTexto(File arquivo) {
		try (PDDocument documento = Loader.loadPDF(arquivo)) {
			String texto = new PDFTextStripper().getText(documento);

			if (texto == null || texto.trim().length() < MINIMO_CARACTERES) {
				throw new ExtracaoTextoException(
						"Texto extraído do PDF é insuficiente (mínimo de " + MINIMO_CARACTERES + " caracteres)");
			}

			return texto;
		} catch (IOException e) {
			throw new ExtracaoTextoException("Falha ao extrair texto do PDF", e);
		}
	}

}
