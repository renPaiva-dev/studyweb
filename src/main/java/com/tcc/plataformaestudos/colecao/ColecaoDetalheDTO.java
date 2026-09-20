package com.tcc.plataformaestudos.colecao;

import java.time.LocalDateTime;
import java.util.List;

public record ColecaoDetalheDTO(
		Long id,
		String nome,
		String descricao,
		LocalDateTime criadoEm,
		LocalDateTime atualizadoEm,
		List<DeckResumoDTO> decks) {

	public static ColecaoDetalheDTO fromEntity(Colecao colecao, List<DeckResumoDTO> decks) {
		return new ColecaoDetalheDTO(colecao.getId(), colecao.getNome(), colecao.getDescricao(),
				colecao.getCriadoEm(), colecao.getAtualizadoEm(), decks);
	}

}
