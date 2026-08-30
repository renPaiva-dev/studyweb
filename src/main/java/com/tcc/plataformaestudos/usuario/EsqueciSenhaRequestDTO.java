package com.tcc.plataformaestudos.usuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EsqueciSenhaRequestDTO(

		@NotBlank(message = "E-mail é obrigatório")
		@Email(message = "E-mail inválido")
		String email) {
}
