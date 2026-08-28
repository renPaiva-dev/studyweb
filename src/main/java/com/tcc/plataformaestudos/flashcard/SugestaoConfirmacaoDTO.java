package com.tcc.plataformaestudos.flashcard;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SugestaoConfirmacaoDTO(

		@NotBlank(message = "Pergunta é obrigatória")
		String pergunta,

		@NotBlank(message = "Resposta é obrigatória")
		String resposta,

		@NotNull(message = "Campo aceitar é obrigatório")
		Boolean aceitar,

		@Size(max = 60, message = "Tópico deve ter no máximo 60 caracteres")
		String topico) {
}
