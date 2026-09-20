package com.tcc.plataformaestudos.deck;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeckRequestDTO(

		@NotBlank(message = "Título é obrigatório")
		@Size(max = 150, message = "Título deve ter no máximo 150 caracteres")
		String titulo,

		@Size(max = 500, message = "Descrição deve ter no máximo 500 caracteres")
		String descricao,

		/** RN42/UC33 — coleção à qual o deck passa a pertencer; null = nenhuma. */
		Long colecaoId) {
}
