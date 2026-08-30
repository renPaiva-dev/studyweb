package com.tcc.plataformaestudos.usuario;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** RN27 — senha entre 8 e 64 caracteres, com maiúscula, minúscula, dígito e caractere especial. */
class SenhaForteValidatorTest {

	private final SenhaForteValidator validator = new SenhaForteValidator();

	@Test
	void deveAceitarSenhaComTodosOsRequisitos() {
		assertThat(validator.isValid("Senha123!", null)).isTrue();
	}

	@Test
	void deveRecusarSenhaSemLetraMaiuscula() {
		assertThat(validator.isValid("senha123!", null)).isFalse();
	}

	@Test
	void deveRecusarSenhaSemLetraMinuscula() {
		assertThat(validator.isValid("SENHA123!", null)).isFalse();
	}

	@Test
	void deveRecusarSenhaSemDigito() {
		assertThat(validator.isValid("SenhaForte!", null)).isFalse();
	}

	@Test
	void deveRecusarSenhaSemCaractereEspecial() {
		assertThat(validator.isValid("Senha1234", null)).isFalse();
	}

	@Test
	void deveRecusarSenhaComMenosDeOitoCaracteres() {
		assertThat(validator.isValid("Sn1!", null)).isFalse();
	}

	@Test
	void deveAceitarNuloOuVazioPoisResponsabilidadeENotBlank() {
		assertThat(validator.isValid(null, null)).isTrue();
		assertThat(validator.isValid("", null)).isTrue();
	}

}
