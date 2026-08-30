package com.tcc.plataformaestudos.usuario;

import jakarta.validation.constraints.NotBlank;

public record RedefinirSenhaRequestDTO(

		@NotBlank(message = "Token é obrigatório")
		String token,

		@NotBlank(message = "Nova senha é obrigatória")
		@SenhaForte
		String novaSenha) {
}
