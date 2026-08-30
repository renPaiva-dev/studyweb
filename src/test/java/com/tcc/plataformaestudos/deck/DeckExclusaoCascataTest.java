package com.tcc.plataformaestudos.deck;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;
import com.tcc.plataformaestudos.flashcard.OrigemFlashcard;
import com.tcc.plataformaestudos.material.MaterialOrigem;
import com.tcc.plataformaestudos.material.MaterialOrigemRepository;
import com.tcc.plataformaestudos.material.StatusProcessamento;
import com.tcc.plataformaestudos.quiz.AlternativaQuiz;
import com.tcc.plataformaestudos.quiz.QuestaoQuiz;
import com.tcc.plataformaestudos.quiz.QuestaoQuizRepository;
import com.tcc.plataformaestudos.quiz.Quiz;
import com.tcc.plataformaestudos.quiz.QuizRepository;
import com.tcc.plataformaestudos.quiz.TentativaQuiz;
import com.tcc.plataformaestudos.quiz.TentativaQuizRepository;
import com.tcc.plataformaestudos.usuario.Usuario;

/**
 * RN13: excluir um deck remove em cascata os MaterialOrigem e Flashcard
 * associados. Usa @DataJpaTest (H2 em memória) porque isso é comportamento
 * real do JPA (@OneToMany cascade/orphanRemoval), não observável com
 * repositórios mockados.
 */
@DataJpaTest
@ActiveProfiles("test")
class DeckExclusaoCascataTest {

	@Autowired
	private TestEntityManager entityManager;

	@Autowired
	private DeckRepository deckRepository;

	@Autowired
	private MaterialOrigemRepository materialOrigemRepository;

	@Autowired
	private FlashcardRepository flashcardRepository;

	@Autowired
	private QuizRepository quizRepository;

	@Autowired
	private QuestaoQuizRepository questaoQuizRepository;

	@Autowired
	private TentativaQuizRepository tentativaQuizRepository;

	@Test
	void deveRemoverMateriaisAssociadosQuandoDeckForExcluido() {
		Usuario usuario = new Usuario();
		usuario.setNome("Ana Estudante");
		usuario.setNomeUsuario("ana");
		usuario.setEmail("ana@email.com");
		usuario.setSenhaHash("hash-fake");
		entityManager.persist(usuario);

		Deck deck = new Deck();
		deck.setUsuario(usuario);
		deck.setTitulo("Anatomia");
		entityManager.persist(deck);

		MaterialOrigem material = new MaterialOrigem();
		material.setDeck(deck);
		material.setNomeArquivo("apostila.pdf");
		material.setCaminhoArquivo("/tmp/apostila.pdf");
		material.setStatusProcessamento(StatusProcessamento.PENDENTE);
		entityManager.persist(material);

		entityManager.flush();
		Long materialId = material.getId();
		Long deckId = deck.getId();
		entityManager.clear();

		Deck deckRecarregado = deckRepository.findById(deckId).orElseThrow();
		deckRepository.delete(deckRecarregado);
		entityManager.flush();

		assertThat(materialOrigemRepository.findById(materialId)).isEmpty();
	}

	@Test
	void deveRemoverFlashcardsAssociadosQuandoDeckForExcluido() {
		Usuario usuario = new Usuario();
		usuario.setNome("Bia Estudante");
		usuario.setNomeUsuario("bia");
		usuario.setEmail("bia@email.com");
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

		entityManager.flush();
		Long flashcardId = flashcard.getId();
		Long deckId = deck.getId();
		entityManager.clear();

		Deck deckRecarregado = deckRepository.findById(deckId).orElseThrow();
		deckRepository.delete(deckRecarregado);
		entityManager.flush();

		assertThat(flashcardRepository.findById(flashcardId)).isEmpty();
	}

	@Test
	void deveRemoverQuizzesQuestoesETentativasAssociadosQuandoDeckForExcluido() {
		Usuario usuario = new Usuario();
		usuario.setNome("Carlos Estudante");
		usuario.setNomeUsuario("carlos");
		usuario.setEmail("carlos@email.com");
		usuario.setSenhaHash("hash-fake");
		entityManager.persist(usuario);

		Deck deck = new Deck();
		deck.setUsuario(usuario);
		deck.setTitulo("Química");
		entityManager.persist(deck);

		Quiz quiz = new Quiz();
		quiz.setDeck(deck);
		quiz.setTitulo("Quiz de Química");
		entityManager.persist(quiz);

		QuestaoQuiz questao = new QuestaoQuiz();
		questao.setQuiz(quiz);
		questao.setEnunciado("Qual o símbolo do ouro?");
		questao.setRespostaCorreta("Au");
		questao.setAlternativas(List.of(new AlternativaQuiz("Au", true), new AlternativaQuiz("Ag", false)));
		entityManager.persist(questao);

		TentativaQuiz tentativa = new TentativaQuiz();
		tentativa.setQuiz(quiz);
		tentativa.setUsuario(usuario);
		tentativa.setPontuacao(new BigDecimal("100.00"));
		entityManager.persist(tentativa);

		entityManager.flush();
		Long quizId = quiz.getId();
		Long questaoId = questao.getId();
		Long tentativaId = tentativa.getId();
		Long deckId = deck.getId();
		entityManager.clear();

		Deck deckRecarregado = deckRepository.findById(deckId).orElseThrow();
		deckRepository.delete(deckRecarregado);
		entityManager.flush();

		assertThat(quizRepository.findById(quizId)).isEmpty();
		assertThat(questaoQuizRepository.findById(questaoId)).isEmpty();
		assertThat(tentativaQuizRepository.findById(tentativaId)).isEmpty();
	}

}
