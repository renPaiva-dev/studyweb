package com.tcc.plataformaestudos.usuario;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;

import org.junit.jupiter.api.Test;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

class UsuarioTest {

	@Test
	void deveSerEntidadeMapeadaParaTabelaUsuario() {
		assertThat(Usuario.class.isAnnotationPresent(Entity.class)).isTrue();

		Table table = Usuario.class.getAnnotation(Table.class);
		assertThat(table).isNotNull();
		assertThat(table.name()).isEqualTo("usuario");
	}

	@Test
	void deveTerIdComoChavePrimariaAutoIncrementada() throws NoSuchFieldException {
		Field id = Usuario.class.getDeclaredField("id");

		assertThat(id.isAnnotationPresent(Id.class)).isTrue();
		assertThat(id.getAnnotation(GeneratedValue.class).strategy()).isEqualTo(GenerationType.IDENTITY);
	}

	@Test
	void deveExigirNomeComTamanhoMaximo120() throws NoSuchFieldException {
		Column column = Usuario.class.getDeclaredField("nome").getAnnotation(Column.class);

		assertThat(column).isNotNull();
		assertThat(column.nullable()).isFalse();
		assertThat(column.length()).isEqualTo(120);
	}

	@Test
	void deveExigirEmailUnicoComTamanhoMaximo180() throws NoSuchFieldException {
		Column column = Usuario.class.getDeclaredField("email").getAnnotation(Column.class);

		assertThat(column).isNotNull();
		assertThat(column.nullable()).isFalse();
		assertThat(column.unique()).isTrue();
		assertThat(column.length()).isEqualTo(180);
	}

	@Test
	void deveMapearSenhaHashComoObrigatoriaENaoExporNomeDeAtributoComoSenhaPlana() throws NoSuchFieldException {
		Field senhaHash = Usuario.class.getDeclaredField("senhaHash");
		Column column = senhaHash.getAnnotation(Column.class);

		assertThat(column).isNotNull();
		assertThat(column.name()).isEqualTo("senha_hash");
		assertThat(column.nullable()).isFalse();
		assertThat(column.length()).isEqualTo(255);
	}

	@Test
	void deveExigirCriadoEmObrigatorio() throws NoSuchFieldException {
		Column column = Usuario.class.getDeclaredField("criadoEm").getAnnotation(Column.class);

		assertThat(column).isNotNull();
		assertThat(column.name()).isEqualTo("criado_em");
		assertThat(column.nullable()).isFalse();
	}

}
