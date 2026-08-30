package com.tcc.plataformaestudos.usuario;

import jakarta.validation.constraints.NotBlank;

public record TrocarSenhaRequestDTO(

		@NotBlank(message = "Senha atual é obrigatória")
		String senhaAtual,

		@NotBlank(message = "Nova senha é obrigatória")
		@SenhaForte
		String novaSenha) {
}
