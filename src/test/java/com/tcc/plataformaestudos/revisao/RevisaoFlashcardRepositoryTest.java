package com.tcc.plataformaestudos.revisao;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.OrigemFlashcard;
import com.tcc.plataformaestudos.usuario.Usuario;

import jakarta.persistence.EntityManagerFactory;

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

	@Autowired
	private EntityManagerFactory entityManagerFactory;

	private Statistics estatisticasDoHibernate() {
		Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
		statistics.setStatisticsEnabled(true);
		return statistics;
	}

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

	/**
	 * B7 — sem {@code JOIN FETCH f.deck d JOIN FETCH d.usuario} na query,
	 * cada acesso abaixo a {@code deck}/{@code deck.usuario} (ambos LAZY)
	 * dispararia uma consulta adicional por flashcard (N+1), exatamente como
	 * {@link LembreteRevisaoDadosService#montarLembretesDeTodosOsUsuarios()}
	 * faz ao agrupar por usuário e por título de deck.
	 */
	@Test
	void naoDeveDispararConsultaAdicionalAoAcessarDeckEUsuarioAoBuscarPendentesSemEscopo() {
		Usuario joao = novoUsuario("joao3");
		Deck deckJoao = novoDeck(joao, "Anatomia");
		Flashcard flashcardJoaoPendente = novoFlashcard(deckJoao, "Pendente de João 3");
		novaRevisao(flashcardJoaoPendente, joao, LocalDate.now().minusDays(1));

		Usuario maria = novoUsuario("maria3");
		Deck deckMaria = novoDeck(maria, "Química");
		Flashcard flashcardMariaPendente = novoFlashcard(deckMaria, "Pendente de Maria 3");
		novaRevisao(flashcardMariaPendente, maria, LocalDate.now());

		entityManager.flush();
		entityManager.clear();

		Statistics statistics = estatisticasDoHibernate();
		statistics.clear();

		var pendentes = revisaoFlashcardRepository.findTodosPendentesDeRevisao(LocalDate.now());
		long consultasAposBuscar = statistics.getPrepareStatementCount();

		pendentes.forEach(f -> {
			assertThat(f.getDeck().getTitulo()).isNotNull();
			assertThat(f.getDeck().getUsuario().getEmail()).isNotNull();
		});

		assertThat(statistics.getPrepareStatementCount())
				.as("acessar deck/usuario não deve disparar consultas lazy adicionais (N+1)")
				.isEqualTo(consultasAposBuscar);
	}

	/**
	 * B7 — mesma proteção contra N+1 para a query escopada a um único
	 * usuário, usada por {@link LembreteRevisaoDadosService#montarLembreteDoUsuario(Long)}
	 * (agrupa por título de deck).
	 */
	@Test
	void naoDeveDispararConsultaAdicionalAoAcessarDeckAoBuscarPendentesDoUsuario() {
		Usuario joao = novoUsuario("joao4");
		Deck deckAnatomia = novoDeck(joao, "Anatomia");
		Flashcard flashcardPendente1 = novoFlashcard(deckAnatomia, "Pendente 4a");
		novaRevisao(flashcardPendente1, joao, LocalDate.now().minusDays(1));

		Deck deckQuimica = novoDeck(joao, "Química");
		Flashcard flashcardPendente2 = novoFlashcard(deckQuimica, "Pendente 4b");
		novaRevisao(flashcardPendente2, joao, LocalDate.now());

		entityManager.flush();
		entityManager.clear();

		Statistics statistics = estatisticasDoHibernate();
		statistics.clear();

		var pendentes = revisaoFlashcardRepository.findPendentesDeRevisaoDoUsuario(joao.getId(), LocalDate.now());
		long consultasAposBuscar = statistics.getPrepareStatementCount();

		pendentes.forEach(f -> assertThat(f.getDeck().getTitulo()).isNotNull());

		assertThat(statistics.getPrepareStatementCount())
				.as("acessar deck não deve disparar consultas lazy adicionais (N+1)")
				.isEqualTo(consultasAposBuscar);
	}

}
