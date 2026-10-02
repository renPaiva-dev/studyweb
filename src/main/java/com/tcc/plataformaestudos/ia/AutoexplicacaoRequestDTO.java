package com.tcc.plataformaestudos.ia;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** UC34/RN43 — explicação do flashcard escrita pelo estudante com as próprias palavras. */
public record AutoexplicacaoRequestDTO(

		@NotBlank(message = "Explicação é obrigatória")
		@Size(min = 20, max = 1000, message = "Explicação deve ter entre 20 e 1000 caracteres")
		String texto) {
}
