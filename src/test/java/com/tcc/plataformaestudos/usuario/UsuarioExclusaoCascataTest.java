package com.tcc.plataformaestudos.usuario;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckRepository;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;
import com.tcc.plataformaestudos.flashcard.OrigemFlashcard;
import com.tcc.plataformaestudos.quiz.AlternativaQuiz;
import com.tcc.plataformaestudos.quiz.QuestaoQuiz;
import com.tcc.plataformaestudos.quiz.QuestaoQuizRepository;
import com.tcc.plataformaestudos.quiz.Quiz;
import com.tcc.plataformaestudos.quiz.QuizRepository;
import com.tcc.plataformaestudos.quiz.TentativaQuiz;
import com.tcc.plataformaestudos.quiz.TentativaQuizRepository;
import com.tcc.plataformaestudos.revisao.RevisaoFlashcard;
import com.tcc.plataformaestudos.revisao.RevisaoFlashcardRepository;

/**
 * RN32 (LGPD, direito ao esquecimento) — excluir um usuário remove em
 * cascata todos os dados vinculados: decks, flashcards, revisões, quizzes,
 * questões, tentativas e tokens de redefinição de senha. Usa @DataJpaTest
 * (H2 em memória) porque isso é comportamento real do JPA (cascade/
 * orphanRemoval em Usuario#decks), mesmo padrão de DeckExclusaoCascataTest.
 */
@DataJpaTest
@ActiveProfiles("test")
class UsuarioExclusaoCascataTest {

	@Autowired
	private TestEntityManager entityManager;

	@Autowired
	private UsuarioRepository usuarioRepository;

	@Autowired
	private DeckRepository deckRepository;

	@Autowired
	private FlashcardRepository flashcardRepository;

	@Autowired
	private RevisaoFlashcardRepository revisaoFlashcardRepository;

	@Autowired
	private QuizRepository quizRepository;

	@Autowired
	private QuestaoQuizRepository questaoQuizRepository;

	@Autowired
	private TentativaQuizRepository tentativaQuizRepository;

	@Autowired
	private TokenRedefinicaoSenhaRepository tokenRedefinicaoSenhaRepository;

	@Test
	void deveRemoverTodosOsDadosVinculadosQuandoUsuarioForExcluido() {
		Usuario usuario = new Usuario();
		usuario.setNome("Dani Estudante");
		usuario.setNomeUsuario("dani");
		usuario.setEmail("dani@email.com");
		usuario.setSenhaHash("hash-fake");
		entityManager.persist(usuario);

		Deck deck = new Deck();
		deck.setUsuario(usuario);
		deck.setTitulo("Farmacologia");
		entityManager.persist(deck);

		Flashcard flashcard = new Flashcard();
		flashcard.setDeck(deck);
		flashcard.setPergunta("O que é meia-vida?");
		flashcard.setResposta("Tempo para metade do fármaco ser eliminado.");
		flashcard.setOrigem(OrigemFlashcard.MANUAL);
		entityManager.persist(flashcard);

		RevisaoFlashcard revisao = new RevisaoFlashcard();
		revisao.setFlashcard(flashcard);
		revisao.setUsuario(usuario);
		revisao.setQualidadeResposta(4);
		revisao.setFatorFacilidade(new BigDecimal("2.50"));
		revisao.setIntervaloDias(6);
		revisao.setRepeticoes(1);
		revisao.setProximaRevisao(java.time.LocalDate.now().plusDays(6));
		entityManager.persist(revisao);

		Quiz quiz = new Quiz();
		quiz.setDeck(deck);
		quiz.setTitulo("Quiz de Farmacologia");
		entityManager.persist(quiz);

		QuestaoQuiz questao = new QuestaoQuiz();
		questao.setQuiz(quiz);
		questao.setEnunciado("O que é biodisponibilidade?");
		questao.setRespostaCorreta("Fração absorvida");
		questao.setAlternativas(List.of(new AlternativaQuiz("Fração absorvida", true), new AlternativaQuiz("Fração excretada", false)));
		entityManager.persist(questao);

		TentativaQuiz tentativa = new TentativaQuiz();
		tentativa.setQuiz(quiz);
		tentativa.setUsuario(usuario);
		tentativa.setPontuacao(new BigDecimal("80.00"));
		entityManager.persist(tentativa);

		TokenRedefinicaoSenha token = new TokenRedefinicaoSenha();
		token.setUsuario(usuario);
		token.setToken("token-fake-123");
		token.setExpiraEm(LocalDateTime.now().plusHours(1));
		entityManager.persist(token);

		entityManager.flush();

		Long usuarioId = usuario.getId();
		Long deckId = deck.getId();
		Long flashcardId = flashcard.getId();
		Long revisaoId = revisao.getId();
		Long quizId = quiz.getId();
		Long questaoId = questao.getId();
		Long tentativaId = tentativa.getId();
		Long tokenId = token.getId();
		entityManager.clear();

		Usuario usuarioRecarregado = usuarioRepository.findById(usuarioId).orElseThrow();
		usuarioRepository.delete(usuarioRecarregado);
		entityManager.flush();

		assertThat(usuarioRepository.findById(usuarioId)).isEmpty();
		assertThat(deckRepository.findById(deckId)).isEmpty();
		assertThat(flashcardRepository.findById(flashcardId)).isEmpty();
		assertThat(revisaoFlashcardRepository.findById(revisaoId)).isEmpty();
		assertThat(quizRepository.findById(quizId)).isEmpty();
		assertThat(questaoQuizRepository.findById(questaoId)).isEmpty();
		assertThat(tentativaQuizRepository.findById(tentativaId)).isEmpty();
		assertThat(tokenRedefinicaoSenhaRepository.findById(tokenId)).isEmpty();
	}

}
