package com.tcc.plataformaestudos.usuario;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CadastroRequestDTO(

		@NotBlank(message = "Nome é obrigatório")
		String nome,

		@NotBlank(message = "Nome de usuário é obrigatório")
		@Pattern(regexp = "^[a-zA-Z0-9]+$", message = "Nome de usuário deve ser alfanumérico, sem espaços")
		@Size(min = 3, max = 30, message = "Nome de usuário deve ter entre 3 e 30 caracteres")
		String nomeUsuario,

		@NotBlank(message = "E-mail é obrigatório")
		@Email(message = "E-mail inválido")
		String email,

		@NotBlank(message = "Senha é obrigatória")
		@SenhaForte
		String senha,

		// RN30 (LGPD, consentimento) - obrigatorio marcar true para se cadastrar;
		// a versao vigente do termo e definida pelo backend (UsuarioService),
		// nunca confiada ao cliente.
		@AssertTrue(message = "É necessário aceitar os termos de uso para se cadastrar")
		boolean termosAceitos) {
}
