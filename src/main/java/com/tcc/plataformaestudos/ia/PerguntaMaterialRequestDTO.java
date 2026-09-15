package com.tcc.plataformaestudos.ia;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** UC32/RN41 — pergunta livre sobre o material de um deck. */
public record PerguntaMaterialRequestDTO(

		@NotBlank(message = "Pergunta é obrigatória")
		@Size(max = 1000, message = "Pergunta deve ter no máximo 1000 caracteres")
		String pergunta) {
}
