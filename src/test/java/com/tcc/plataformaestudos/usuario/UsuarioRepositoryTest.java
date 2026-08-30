package com.tcc.plataformaestudos.usuario;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

/** RN34 — unicidade de nomeUsuario é case-insensitive ("Renato" == "renato" == "RENATO"). */
@DataJpaTest
@ActiveProfiles("test")
class UsuarioRepositoryTest {

	@Autowired
	private TestEntityManager entityManager;

	@Autowired
	private UsuarioRepository usuarioRepository;

	@Test
	void deveEncontrarUsuarioPorNomeUsuarioIndependenteDeCaixa() {
		Usuario usuario = new Usuario();
		usuario.setNome("Renato");
		usuario.setNomeUsuario("Renato");
		usuario.setEmail("renato@email.com");
		usuario.setSenhaHash("hash-fake");
		entityManager.persist(usuario);
		entityManager.flush();

		assertThat(usuarioRepository.findByNomeUsuarioIgnoreCase("renato")).isPresent();
		assertThat(usuarioRepository.findByNomeUsuarioIgnoreCase("RENATO")).isPresent();
		assertThat(usuarioRepository.findByNomeUsuarioIgnoreCase("Renato")).isPresent();
		assertThat(usuarioRepository.findByNomeUsuarioIgnoreCase("outro")).isEmpty();
	}

}
