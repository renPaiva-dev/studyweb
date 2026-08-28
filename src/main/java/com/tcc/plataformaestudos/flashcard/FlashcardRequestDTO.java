package com.tcc.plataformaestudos.flashcard;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FlashcardRequestDTO(

		@NotBlank(message = "Pergunta é obrigatória")
		@Size(max = 1000, message = "Pergunta deve ter no máximo 1000 caracteres")
		String pergunta,

		@NotBlank(message = "Resposta é obrigatória")
		@Size(max = 1000, message = "Resposta deve ter no máximo 1000 caracteres")
		String resposta,

		@Size(max = 500, message = "Mnemônico deve ter no máximo 500 caracteres")
		String mnemonico,

		@Size(max = 60, message = "Tópico deve ter no máximo 60 caracteres")
		String topico) {
}
