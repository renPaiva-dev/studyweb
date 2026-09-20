package com.tcc.plataformaestudos.colecao;

import java.time.LocalDateTime;

public record ColecaoResponseDTO(
		Long id,
		String nome,
		String descricao,
		LocalDateTime criadoEm,
		LocalDateTime atualizadoEm,
		int totalDecks) {

	public static ColecaoResponseDTO fromEntity(Colecao colecao, long totalDecks) {
		return new ColecaoResponseDTO(colecao.getId(), colecao.getNome(), colecao.getDescricao(),
				colecao.getCriadoEm(), colecao.getAtualizadoEm(), (int) totalDecks);
	}

}
