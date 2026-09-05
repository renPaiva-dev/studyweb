package com.tcc.plataformaestudos.material;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * B1/UC22/RN29 — centraliza a remoção do arquivo físico de um
 * {@link MaterialOrigem} em disco ({@code uploads/{deckId}/{uuid}.pdf}).
 * Extraído de {@link MaterialOrigemService} para ser reutilizado também por
 * {@code DeckService#excluir}, já que excluir um deck inteiro precisa apagar
 * o arquivo de cada material associado (a cascata do JPA só remove as linhas
 * de {@code material_origem} no banco, nunca o arquivo em disco). Se a
 * remoção falhar (ex.: permissão, arquivo já removido manualmente), loga o
 * erro mas não interrompe o fluxo principal (exclusão do registro/deck) —
 * deixar o registro "preso" por causa do arquivo seria pior para o usuário
 * do que um arquivo órfão no disco.
 */
@Service
public class ArquivoFisicoService {

	private static final Logger log = LoggerFactory.getLogger(ArquivoFisicoService.class);

	public void excluir(MaterialOrigem material) {
		try {
			Files.deleteIfExists(Path.of(material.getCaminhoArquivo()));
		} catch (IOException e) {
			log.error("Falha ao remover o arquivo físico do material (registro será removido mesmo assim): materialId={}",
					material.getId(), e);
		}
	}

	public void excluirTodos(List<MaterialOrigem> materiais) {
		materiais.forEach(this::excluir);
	}

}
