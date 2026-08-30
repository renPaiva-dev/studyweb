package com.tcc.plataformaestudos.usuario;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * RN27 — senha entre 8 e 64 caracteres, com ao menos uma letra maiúscula,
 * uma minúscula, um dígito e um caractere especial. Aplica-se ao cadastro
 * (UC01), à redefinição de senha (UC18, RN24) e à troca de senha
 * autenticada (UC26, RN33) — anotação única reaproveitada nos três DTOs em
 * vez de duplicar o regex.
 */
@Target({ ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = SenhaForteValidator.class)
public @interface SenhaForte {

	String message() default "Senha deve ter entre 8 e 64 caracteres, com ao menos uma letra maiúscula, "
			+ "uma minúscula, um dígito e um caractere especial";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

}
