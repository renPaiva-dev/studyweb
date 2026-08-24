package com.tcc.plataformaestudos.dashboard;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.OrigemFlashcard;
import com.tcc.plataformaestudos.revisao.RevisaoFlashcard;
import com.tcc.plataformaestudos.usuario.Usuario;

/**
 * Valida a query JPQL de {@link DashboardRepository} contra o comportamento
 * real do JPA/H2 (a correção da subquery correlacionada no LEFT JOIN ON não
 * é observável com repositório mockado) — mesmo padrão de
 * DeckExclusaoCascataTest/FlashcardExclusaoCascataTest.
 */
@DataJpaTest
@ActiveProfiles("test")
class DashboardRepositoryTest {

	@Autowired
	private TestEntityManager entityManager;

	@Autowired
	private DashboardRepository dashboardRepository;

	private Usuario usuario;
	private Deck deck;

	private Flashcard novoFlashcard(String pergunta) {
		Flashcard flashcard = new Flashcard();
		flashcard.setDeck(deck);
		flashcard.setPergunta(pergunta);
		flashcard.setResposta("resposta");
		flashcard.setOrigem(OrigemFlashcard.MANUAL);
		entityManager.persist(flashcard);
		return flashcard;
	}

	private void novaRevisao(Flashcard flashcard, int repeticoes, int qualidade, LocalDate proximaRevisao, LocalDate dataRevisao) {
		RevisaoFlashcard revisao = new RevisaoFlashcard();
		revisao.setFlashcard(flashcard);
		revisao.setUsuario(usuario);
		revisao.setQualidadeResposta(qualidade);
		revisao.setFatorFacilidade(new BigDecimal("2.50"));
		revisao.setIntervaloDias(1);
		revisao.setRepeticoes(repeticoes);
		revisao.setProximaRevisao(proximaRevisao);
		revisao.setDataRevisao(dataRevisao.atStartOfDay());
		entityManager.persist(revisao);
	}

	private void configurarUsuarioEDeck() {
		usuario = new Usuario();
		usuario.setNome("Ana Estudante");
		usuario.setEmail("ana.dashboard@email.com");
		usuario.setSenhaHash("hash-fake");
		entityManager.persist(usuario);

		deck = new Deck();
		deck.setUsuario(usuario);
		deck.setTitulo("Biologia");
		entityManager.persist(deck);
	}

	@Test
	void deveTrazerNuloQuandoFlashcardNuncaFoiRevisado() {
		configurarUsuarioEDeck();
		Flashcard flashcard = novoFlashcard("O que é mitose?");
		entityManager.flush();

		var resultado = dashboardRepository.buscarUltimaRevisaoPorFlashcard(deck.getId());

		assertThat(resultado).hasSize(1);
		assertThat(resultado.get(0).flashcardId()).isEqualTo(flashcard.getId());
		assertThat(resultado.get(0).repeticoes()).isNull();
		assertThat(resultado.get(0).qualidadeResposta()).isNull();
	}

	@Test
	void deveTrazerApenasAUltimaRevisaoQuandoHaMultiplasRevisoes() {
		configurarUsuarioEDeck();
		Flashcard flashcard = novoFlashcard("O que é meiose?");
		novaRevisao(flashcard, 1, 5, LocalDate.now().plusDays(1), LocalDate.now().minusDays(10));
		novaRevisao(flashcard, 2, 4, LocalDate.now().plusDays(6), LocalDate.now().minusDays(4));
		novaRevisao(flashcard, 3, 5, LocalDate.now().plusDays(17), LocalDate.now());
		entityManager.flush();

		var resultado = dashboardRepository.buscarUltimaRevisaoPorFlashcard(deck.getId());

		assertThat(resultado).hasSize(1);
		assertThat(resultado.get(0).repeticoes()).isEqualTo(3);
		assertThat(resultado.get(0).qualidadeResposta()).isEqualTo(5);
	}

	@Test
	void naoDeveTrazerFlashcardsDeOutroDeck() {
		configurarUsuarioEDeck();
		novoFlashcard("Flashcard do deck consultado");

		Deck outroDeck = new Deck();
		outroDeck.setUsuario(usuario);
		outroDeck.setTitulo("Outro deck");
		entityManager.persist(outroDeck);
		Flashcard flashcardDeOutroDeck = new Flashcard();
		flashcardDeOutroDeck.setDeck(outroDeck);
		flashcardDeOutroDeck.setPergunta("Pergunta de outro deck");
		flashcardDeOutroDeck.setResposta("resposta");
		flashcardDeOutroDeck.setOrigem(OrigemFlashcard.MANUAL);
		entityManager.persist(flashcardDeOutroDeck);

		entityManager.flush();

		var resultado = dashboardRepository.buscarUltimaRevisaoPorFlashcard(deck.getId());

		assertThat(resultado).hasSize(1);
	}

}
