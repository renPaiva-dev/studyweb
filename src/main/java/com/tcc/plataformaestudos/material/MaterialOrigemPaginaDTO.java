package com.tcc.plataformaestudos.material;

import java.util.List;

import org.springframework.data.domain.Page;

/**
 * B5 (Docs/auditoria-erros-2026-09.md) — resposta paginada de
 * {@code GET /api/decks/{id}/materiais}, em vez da lista completa sem limite
 * de antes.
 */
public record MaterialOrigemPaginaDTO(
		List<MaterialOrigemResponseDTO> itens,
		int pagina,
		int tamanho,
		long totalItens,
		int totalPaginas) {

	public static MaterialOrigemPaginaDTO fromPage(Page<MaterialOrigem> pagina) {
		List<MaterialOrigemResponseDTO> itens = pagina.getContent().stream()
				.map(MaterialOrigemResponseDTO::fromEntity)
				.toList();

		return new MaterialOrigemPaginaDTO(itens, pagina.getNumber(), pagina.getSize(), pagina.getTotalElements(), pagina.getTotalPages());
	}

}
