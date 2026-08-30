package com.tcc.plataformaestudos.usuario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AtualizarPerfilRequestDTO(

		@NotBlank(message = "Nome é obrigatório")
		String nome,

		@NotBlank(message = "Nome de usuário é obrigatório")
		@Pattern(regexp = "^[a-zA-Z0-9]+$", message = "Nome de usuário deve ser alfanumérico, sem espaços")
		@Size(min = 3, max = 30, message = "Nome de usuário deve ter entre 3 e 30 caracteres")
		String nomeUsuario) {
}
