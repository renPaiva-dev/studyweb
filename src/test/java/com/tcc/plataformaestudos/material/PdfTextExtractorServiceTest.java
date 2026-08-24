package com.tcc.plataformaestudos.material;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class PdfTextExtractorServiceTest {

	private final PdfTextExtractorService service = new PdfTextExtractorService();

	@Test
	void deveExtrairTextoDeUmPdfValido(@TempDir Path tempDir) throws IOException {
		File arquivo = tempDir.resolve("teste.pdf").toFile();
		criarPdfComTexto(arquivo, "Este é um texto de teste com mais de cinquenta caracteres para passar da validação mínima da RN07.");

		String texto = service.extrairTexto(arquivo);

		assertThat(texto).contains("texto de teste");
	}

	@Test
	void deveLancarExtracaoTextoExceptionQuandoArquivoNaoEhUmPdfValido(@TempDir Path tempDir) throws IOException {
		File arquivo = tempDir.resolve("invalido.pdf").toFile();
		Files.writeString(arquivo.toPath(), "isto não é um PDF de verdade");

		assertThatThrownBy(() -> service.extrairTexto(arquivo))
				.isInstanceOf(ExtracaoTextoException.class);
	}

	@Test
	void deveLancarExtracaoTextoExceptionQuandoTextoExtraidoForInsuficiente(@TempDir Path tempDir) throws IOException {
		File arquivo = tempDir.resolve("curto.pdf").toFile();
		criarPdfComTexto(arquivo, "curto");

		assertThatThrownBy(() -> service.extrairTexto(arquivo))
				.isInstanceOf(ExtracaoTextoException.class);
	}

	private void criarPdfComTexto(File destino, String texto) throws IOException {
		try (PDDocument documento = new PDDocument()) {
			PDPage pagina = new PDPage();
			documento.addPage(pagina);

			try (PDPageContentStream conteudo = new PDPageContentStream(documento, pagina)) {
				conteudo.beginText();
				conteudo.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
				conteudo.newLineAtOffset(50, 700);
				conteudo.showText(texto);
				conteudo.endText();
			}

			documento.save(destino);
		}
	}

}
