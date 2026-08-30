package com.tcc.plataformaestudos.usuario;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
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
 * UC24/RN31 (LGPD, acesso/portabilidade) — exportação monta a estrutura
 * completa a partir de dados reais persistidos (não observável mockando
 * repositórios, já que a montagem agrupa coleções por id via streams sobre
 * entidades JPA reais), mesmo padrão @DataJpaTest dos testes de cascata.
 */
@DataJpaTest
@ActiveProfiles("test")
class ExportacaoDadosServiceTest {

	@Autowired
	private TestEntityManager entityManager;

	@Autowired
	private UsuarioRepository usuarioRepository;

	@Autowired
	private DeckRepository deckRepository;

	@Autowired
	private com.tcc.plataformaestudos.material.MaterialOrigemRepository materialOrigemRepository;

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

	private ExportacaoDadosService exportacaoDadosService;

	@AfterEach
	void limparContextoDeSeguranca() {
		SecurityContextHolder.clearContext();
	}

	private void autenticar(Long usuarioId) {
		UsuarioAutenticado principal = new UsuarioAutenticado(usuarioId, "estudante@email.com");
		var authentication = new UsernamePasswordAuthenticationToken(principal, null, List.of());
		SecurityContextHolder.getContext().setAuthentication(authentication);
	}

	@Test
	void deveExportarPerfilDecksFlashcardsRevisoesQuizzesQuestoesETentativasDoUsuarioAutenticado() {
		exportacaoDadosService = new ExportacaoDadosService(usuarioRepository, deckRepository, materialOrigemRepository,
				flashcardRepository, revisaoFlashcardRepository, quizRepository, questaoQuizRepository, tentativaQuizRepository);

		Usuario usuario = new Usuario();
		usuario.setNome("Estudante Exportacao");
		usuario.setNomeUsuario("estudante_exp");
		usuario.setEmail("estudante@email.com");
		usuario.setSenhaHash("hash-fake");
		entityManager.persist(usuario);

		Deck deck = new Deck();
		deck.setUsuario(usuario);
		deck.setTitulo("Cardiologia");
		entityManager.persist(deck);

		Flashcard flashcard = new Flashcard();
		flashcard.setDeck(deck);
		flashcard.setPergunta("O que é taquicardia?");
		flashcard.setResposta("Frequência cardíaca elevada.");
		flashcard.setTopico("Arritmias");
		flashcard.setOrigem(OrigemFlashcard.MANUAL);
		entityManager.persist(flashcard);

		RevisaoFlashcard revisao = new RevisaoFlashcard();
		revisao.setFlashcard(flashcard);
		revisao.setUsuario(usuario);
		revisao.setQualidadeResposta(5);
		revisao.setFatorFacilidade(new BigDecimal("2.60"));
		revisao.setIntervaloDias(10);
		revisao.setRepeticoes(2);
		revisao.setProximaRevisao(LocalDate.now().plusDays(10));
		entityManager.persist(revisao);

		Quiz quiz = new Quiz();
		quiz.setDeck(deck);
		quiz.setTitulo("Quiz de Cardiologia");
		entityManager.persist(quiz);

		QuestaoQuiz questao = new QuestaoQuiz();
		questao.setQuiz(quiz);
		questao.setEnunciado("Qual a frequência normal de repouso?");
		questao.setRespostaCorreta("60-100 bpm");
		questao.setAlternativas(List.of(new AlternativaQuiz("60-100 bpm", true), new AlternativaQuiz("150-200 bpm", false)));
		entityManager.persist(questao);

		TentativaQuiz tentativa = new TentativaQuiz();
		tentativa.setQuiz(quiz);
		tentativa.setUsuario(usuario);
		tentativa.setPontuacao(new BigDecimal("90.00"));
		entityManager.persist(tentativa);

		entityManager.flush();
		entityManager.clear();

		autenticar(usuario.getId());

		ExportacaoDadosDTO exportacao = exportacaoDadosService.exportarDados();

		assertThat(exportacao.perfil().email()).isEqualTo("estudante@email.com");
		assertThat(exportacao.decks()).hasSize(1);

		DeckExportadoDTO deckExportado = exportacao.decks().get(0);
		assertThat(deckExportado.titulo()).isEqualTo("Cardiologia");
		assertThat(deckExportado.flashcards()).hasSize(1);
		assertThat(deckExportado.flashcards().get(0).revisoes()).hasSize(1);
		assertThat(deckExportado.flashcards().get(0).topico()).isEqualTo("Arritmias");
		assertThat(deckExportado.quizzes()).hasSize(1);
		assertThat(deckExportado.quizzes().get(0).questoes()).hasSize(1);
		assertThat(deckExportado.quizzes().get(0).tentativas()).hasSize(1);
	}

	@Test
	void deveExportarEstruturaVaziaMasValidaQuandoUsuarioNaoTemNenhumDado() {
		exportacaoDadosService = new ExportacaoDadosService(usuarioRepository, deckRepository, materialOrigemRepository,
				flashcardRepository, revisaoFlashcardRepository, quizRepository, questaoQuizRepository, tentativaQuizRepository);

		Usuario usuario = new Usuario();
		usuario.setNome("Sem Dados");
		usuario.setNomeUsuario("sem_dados");
		usuario.setEmail("semdados@email.com");
		usuario.setSenhaHash("hash-fake");
		entityManager.persist(usuario);
		entityManager.flush();
		entityManager.clear();

		autenticar(usuario.getId());

		ExportacaoDadosDTO exportacao = exportacaoDadosService.exportarDados();

		assertThat(exportacao.perfil().email()).isEqualTo("semdados@email.com");
		assertThat(exportacao.decks()).isEmpty();
	}

}
