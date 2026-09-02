package com.tcc.plataformaestudos.usuario;

import jakarta.validation.constraints.NotBlank;

public record VerificarEmailRequestDTO(

		@NotBlank(message = "Token é obrigatório")
		String token) {
}
