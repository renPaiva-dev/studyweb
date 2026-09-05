package com.tcc.plataformaestudos.material;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ArquivoFisicoServiceTest {

	private final ArquivoFisicoService service = new ArquivoFisicoService();

	@Test
	void deveApagarOArquivoFisicoDoMaterial(@TempDir Path tempDir) throws IOException {
		Path arquivo = tempDir.resolve("apostila.pdf");
		Files.writeString(arquivo, "conteudo-fake");

		MaterialOrigem material = new MaterialOrigem();
		material.setId(1L);
		material.setCaminhoArquivo(arquivo.toString());

		service.excluir(material);

		assertThat(Files.exists(arquivo)).isFalse();
	}

	@Test
	void naoDeveLancarExcecaoQuandoArquivoJaNaoExiste(@TempDir Path tempDir) {
		MaterialOrigem material = new MaterialOrigem();
		material.setId(1L);
		material.setCaminhoArquivo(tempDir.resolve("nao-existe.pdf").toString());

		assertThatCode(() -> service.excluir(material)).doesNotThrowAnyException();
	}

	/**
	 * B1: DeckService#excluir depende deste método para apagar o arquivo de
	 * cada material do deck de uma vez — a cascata do JPA/banco só remove os
	 * registros, nunca os arquivos físicos em uploads/{deckId}/.
	 */
	@Test
	void deveApagarOArquivoFisicoDeTodosOsMateriaisDaLista(@TempDir Path tempDir) throws IOException {
		Path arquivo1 = tempDir.resolve("a.pdf");
		Path arquivo2 = tempDir.resolve("b.pdf");
		Files.writeString(arquivo1, "conteudo-1");
		Files.writeString(arquivo2, "conteudo-2");

		MaterialOrigem material1 = new MaterialOrigem();
		material1.setId(1L);
		material1.setCaminhoArquivo(arquivo1.toString());
		MaterialOrigem material2 = new MaterialOrigem();
		material2.setId(2L);
		material2.setCaminhoArquivo(arquivo2.toString());

		service.excluirTodos(java.util.List.of(material1, material2));

		assertThat(Files.exists(arquivo1)).isFalse();
		assertThat(Files.exists(arquivo2)).isFalse();
	}

}
