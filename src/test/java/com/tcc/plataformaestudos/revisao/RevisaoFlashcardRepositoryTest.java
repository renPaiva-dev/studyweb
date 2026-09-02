package com.tcc.plataformaestudos.revisao;

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
import com.tcc.plataformaestudos.usuario.Usuario;

/**
 * UC30/RN39 — valida as duas queries novas (por usuário e sem escopo) contra
 * o comportamento real do JPA/H2, mesmo padrão de DashboardRepositoryTest: a
 * subquery correlacionada de "última revisão" não é observável com
 * repositório mockado.
 */
@DataJpaTest
@ActiveProfiles("test")
class RevisaoFlashcardRepositoryTest {

	@Autowired
	private TestEntityManager entityManager;

	@Autowired
	private RevisaoFlashcardRepository revisaoFlashcardRepository;

	private Usuario novoUsuario(String nomeUsuario) {
		Usuario usuario = new Usuario();
		usuario.setNome("Estudante " + nomeUsuario);
		usuario.setNomeUsuario(nomeUsuario);
		usuario.setEmail(nomeUsuario + "@email.com");
		usuario.setSenhaHash("hash-fake");
		entityManager.persist(usuario);
		return usuario;
	}

	private Deck novoDeck(Usuario usuario, String titulo) {
		Deck deck = new Deck();
		deck.setUsuario(usuario);
		deck.setTitulo(titulo);
		entityManager.persist(deck);
		return deck;
	}

	private Flashcard novoFlashcard(Deck deck, String pergunta) {
		Flashcard flashcard = new Flashcard();
		flashcard.setDeck(deck);
		flashcard.setPergunta(pergunta);
		flashcard.setResposta("resposta");
		flashcard.setOrigem(OrigemFlashcard.MANUAL);
		entityManager.persist(flashcard);
		return flashcard;
	}

	private void novaRevisao(Flashcard flashcard, Usuario usuario, LocalDate proximaRevisao) {
		RevisaoFlashcard revisao = new RevisaoFlashcard();
		revisao.setFlashcard(flashcard);
		revisao.setUsuario(usuario);
		revisao.setQualidadeResposta(4);
		revisao.setFatorFacilidade(new BigDecimal("2.50"));
		revisao.setIntervaloDias(1);
		revisao.setRepeticoes(1);
		revisao.setProximaRevisao(proximaRevisao);
		revisao.setDataRevisao(proximaRevisao.minusDays(1).atStartOfDay());
		entityManager.persist(revisao);
	}

	@Test
	void deveIsolarPendentesDeRevisaoPorUsuario() {
		Usuario joao = novoUsuario("joao");
		Deck deckJoao = novoDeck(joao, "Anatomia");
		Flashcard flashcardJoaoPendente = novoFlashcard(deckJoao, "Pendente de João");
		novaRevisao(flashcardJoaoPendente, joao, LocalDate.now().minusDays(1));

		Usuario maria = novoUsuario("maria");
		Deck deckMaria = novoDeck(maria, "Química");
		Flashcard flashcardMariaEmDia = novoFlashcard(deckMaria, "Em dia de Maria");
		novaRevisao(flashcardMariaEmDia, maria, LocalDate.now().plusDays(5));

		entityManager.flush();
		entityManager.clear();

		var pendentesJoao = revisaoFlashcardRepository.findPendentesDeRevisaoDoUsuario(joao.getId(), LocalDate.now());
		var pendentesMaria = revisaoFlashcardRepository.findPendentesDeRevisaoDoUsuario(maria.getId(), LocalDate.now());

		assertThat(pendentesJoao).extracting(Flashcard::getPergunta).containsExactly("Pendente de João");
		assertThat(pendentesMaria).isEmpty();
	}

	@Test
	void deveIncluirFlashcardNuncaRevisadoComoPendente() {
		Usuario usuario = novoUsuario("carla");
		Deck deck = novoDeck(usuario, "História");
		novoFlashcard(deck, "Nunca revisado");

		entityManager.flush();
		entityManager.clear();

		var pendentes = revisaoFlashcardRepository.findPendentesDeRevisaoDoUsuario(usuario.getId(), LocalDate.now());

		assertThat(pendentes).extracting(Flashcard::getPergunta).containsExactly("Nunca revisado");
	}

	@Test
	void deveTrazerPendentesDeTodosOsUsuariosSemEscopo() {
		Usuario joao = novoUsuario("joao2");
		Deck deckJoao = novoDeck(joao, "Anatomia");
		Flashcard flashcardJoaoPendente = novoFlashcard(deckJoao, "Pendente de João 2");
		novaRevisao(flashcardJoaoPendente, joao, LocalDate.now().minusDays(1));

		Usuario maria = novoUsuario("maria2");
		Deck deckMaria = novoDeck(maria, "Química");
		Flashcard flashcardMariaPendente = novoFlashcard(deckMaria, "Pendente de Maria 2");
		novaRevisao(flashcardMariaPendente, maria, LocalDate.now());
		Flashcard flashcardMariaEmDia = novoFlashcard(deckMaria, "Em dia de Maria 2");
		novaRevisao(flashcardMariaEmDia, maria, LocalDate.now().plusDays(3));

		entityManager.flush();
		entityManager.clear();

		var pendentes = revisaoFlashcardRepository.findTodosPendentesDeRevisao(LocalDate.now());

		assertThat(pendentes).extracting(Flashcard::getPergunta)
				.containsExactlyInAnyOrder("Pendente de João 2", "Pendente de Maria 2");
	}

}
