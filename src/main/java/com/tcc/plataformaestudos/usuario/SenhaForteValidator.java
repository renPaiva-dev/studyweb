package com.tcc.plataformaestudos.usuario;

import java.util.regex.Pattern;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/** RN27 — ver {@link SenhaForte}. Valores em branco/nulos são responsabilidade de @NotBlank. */
public class SenhaForteValidator implements ConstraintValidator<SenhaForte, String> {

	private static final Pattern PADRAO_SENHA_FORTE =
			Pattern.compile("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,64}$");

	@Override
	public boolean isValid(String senha, ConstraintValidatorContext context) {
		if (senha == null || senha.isBlank()) {
			return true;
		}

		return PADRAO_SENHA_FORTE.matcher(senha).matches();
	}

}
