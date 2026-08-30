package com.tcc.plataformaestudos.usuario;

import jakarta.validation.constraints.NotBlank;

public record ExcluirContaRequestDTO(

		@NotBlank(message = "Senha é obrigatória")
		String senha) {
}
