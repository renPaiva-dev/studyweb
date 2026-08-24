package com.tcc.plataformaestudos.usuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CadastroRequestDTO(

		@NotBlank(message = "Nome é obrigatório")
		String nome,

		@NotBlank(message = "E-mail é obrigatório")
		@Email(message = "E-mail inválido")
		String email,

		@NotBlank(message = "Senha é obrigatória")
		String senha) {
}
