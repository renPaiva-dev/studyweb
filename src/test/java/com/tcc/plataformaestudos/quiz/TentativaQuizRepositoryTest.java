package com.tcc.plataformaestudos.quiz;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.usuario.Usuario;

/**
 * Valida a constructor-projection de {@link EstatisticaTentativaProjecao}
 * contra o JPA/H2 real — {@code avg(BigDecimal)} em JPQL não é garantido
 * mapear para {@code Double} em toda combinação de Hibernate/dialeto (já
 * houve um caso real de incompatibilidade de tipo em constructor-projection
 * nesta mesma base — ver DashboardRepositoryTest/histórico de UC15).
 */
@DataJpaTest
@ActiveProfiles("test")
class TentativaQuizRepositoryTest {

	@Autowired
	private TestEntityManager entityManager;

	@Autowired
	private TentativaQuizRepository tentativaQuizRepository;

	private Usuario usuario;
	private Quiz quiz;

	private void configurarUsuarioDeckEQuiz() {
		usuario = new Usuario();
		usuario.setNome("Ana Estudante");
		usuario.setNomeUsuario("ana_tentativas");
		usuario.setEmail("ana.tentativas@email.com");
		usuario.setSenhaHash("hash-fake");
		entityManager.persist(usuario);

		Deck deck = new Deck();
		deck.setUsuario(usuario);
		deck.setTitulo("Biologia");
		entityManager.persist(deck);

		quiz = new Quiz();
		quiz.setDeck(deck);
		quiz.setTitulo("Quiz de Biologia");
		entityManager.persist(quiz);
	}

	private void novaTentativa(BigDecimal pontuacao) {
		TentativaQuiz tentativa = new TentativaQuiz();
		tentativa.setQuiz(quiz);
		tentativa.setUsuario(usuario);
		tentativa.setPontuacao(pontuacao);
		entityManager.persist(tentativa);
	}

	@Test
	void deveCalcularTotalETentativaMediaQuandoHaTentativas() {
		configurarUsuarioDeckEQuiz();
		novaTentativa(new BigDecimal("100.00"));
		novaTentativa(new BigDecimal("50.00"));
		entityManager.flush();

		EstatisticaTentativaProjecao resultado = tentativaQuizRepository.calcularEstatisticasPorUsuario(usuario.getId());

		assertThat(resultado.totalTentativas()).isEqualTo(2L);
		assertThat(resultado.pontuacaoMedia()).isEqualTo(75.0);
	}

	@Test
	void deveRetornarZeroENuloQuandoNaoHaTentativas() {
		configurarUsuarioDeckEQuiz();
		entityManager.flush();

		EstatisticaTentativaProjecao resultado = tentativaQuizRepository.calcularEstatisticasPorUsuario(usuario.getId());

		assertThat(resultado.totalTentativas()).isZero();
		assertThat(resultado.pontuacaoMedia()).isNull();
	}

}
