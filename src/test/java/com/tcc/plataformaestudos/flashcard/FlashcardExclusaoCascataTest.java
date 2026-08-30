package com.tcc.plataformaestudos.flashcard;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckRepository;
import com.tcc.plataformaestudos.revisao.RevisaoFlashcard;
import com.tcc.plataformaestudos.revisao.RevisaoFlashcardRepository;
import com.tcc.plataformaestudos.usuario.Usuario;

/**
 * RN13: excluir um flashcard remove em cascata seu histórico de revisões
 * associado. Usa @DataJpaTest (H2 em memória) porque isso é comportamento
 * real do JPA (@OneToMany cascade/orphanRemoval), não observável com
 * repositórios mockados — mesmo padrão de DeckExclusaoCascataTest.
 */
@DataJpaTest
@ActiveProfiles("test")
class FlashcardExclusaoCascataTest {

	@Autowired
	private TestEntityManager entityManager;

	@Autowired
	private DeckRepository deckRepository;

	@Autowired
	private FlashcardRepository flashcardRepository;

	@Autowired
	private RevisaoFlashcardRepository revisaoFlashcardRepository;

	@Test
	void deveRemoverRevisoesAssociadasQuandoFlashcardForExcluido() {
		Usuario usuario = new Usuario();
		usuario.setNome("Ana Estudante");
		usuario.setNomeUsuario("ana_revisao");
		usuario.setEmail("ana.revisao@email.com");
		usuario.setSenhaHash("hash-fake");
		entityManager.persist(usuario);

		Deck deck = new Deck();
		deck.setUsuario(usuario);
		deck.setTitulo("Biologia");
		entityManager.persist(deck);

		Flashcard flashcard = new Flashcard();
		flashcard.setDeck(deck);
		flashcard.setPergunta("O que é mitose?");
		flashcard.setResposta("Divisão celular.");
		flashcard.setOrigem(OrigemFlashcard.MANUAL);
		entityManager.persist(flashcard);

		RevisaoFlashcard revisao = new RevisaoFlashcard();
		revisao.setFlashcard(flashcard);
		revisao.setUsuario(usuario);
		revisao.setQualidadeResposta(4);
		revisao.setFatorFacilidade(new BigDecimal("2.60"));
		revisao.setIntervaloDias(6);
		revisao.setRepeticoes(2);
		revisao.setProximaRevisao(LocalDate.now().plusDays(6));
		entityManager.persist(revisao);

		entityManager.flush();
		Long revisaoId = revisao.getId();
		Long flashcardId = flashcard.getId();
		entityManager.clear();

		Flashcard flashcardRecarregado = flashcardRepository.findById(flashcardId).orElseThrow();
		flashcardRepository.delete(flashcardRecarregado);
		entityManager.flush();

		assertThat(revisaoFlashcardRepository.findById(revisaoId)).isEmpty();
	}

}
