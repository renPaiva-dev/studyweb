package com.tcc.plataformaestudos.flashcard;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SugestaoConfirmacaoDTO(

		@NotBlank(message = "Pergunta é obrigatória")
		String pergunta,

		@NotBlank(message = "Resposta é obrigatória")
		String resposta,

		@NotNull(message = "Campo aceitar é obrigatório")
		Boolean aceitar) {
}
