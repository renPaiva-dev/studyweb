package com.tcc.plataformaestudos.quiz;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tcc.plataformaestudos.config.AcessoNegadoException;
import com.tcc.plataformaestudos.config.RecursoNaoEncontradoException;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;
import com.tcc.plataformaestudos.ia.ProvaGenerationService;
import com.tcc.plataformaestudos.ia.ProvaSugestaoDTO;
import com.tcc.plataformaestudos.usuario.Usuario;
import com.tcc.plataformaestudos.usuario.UsuarioAutenticado;

@ExtendWith(MockitoExtension.class)
class QuizServiceTest {

	private static final Long USUARIO_ID = 1L;
	private static final Long DECK_ID = 10L;
	private static final Long QUIZ_ID = 50L;

	@Mock
	private DeckService deckService;

	@Mock
	private FlashcardRepository flashcardRepository;

	@Mock
	private QuizRepository quizRepository;

	@Mock
	private TentativaQuizRepository tentativaQuizRepository;

	@Mock
	private ProvaGenerationService provaGenerationService;

	@InjectMocks
	private QuizService quizService;

	@BeforeEach
	void autenticarUsuario() {
		UsuarioAutenticado principal = new UsuarioAutenticado(USUARIO_ID, "ana@email.com");
		var authentication = new UsernamePasswordAuthenticationToken(principal, null, List.of());
		SecurityContextHolder.getContext().setAuthentication(authentication);
	}

	@AfterEach
	void limparContextoDeSeguranca() {
		SecurityContextHolder.clearContext();
	}

	private Flashcard flashcard(Long id, String pergunta, String resposta) {
		Flashcard flashcard = new Flashcard();
		flashcard.setId(id);
		flashcard.setPergunta(pergunta);
		flashcard.setResposta(resposta);
		return flashcard;
	}

	private Quiz quizComTresQuestoes() {
		Usuario usuario = new Usuario();
		usuario.setId(USUARIO_ID);

		Deck deck = new Deck();
		deck.setId(DECK_ID);
		deck.setUsuario(usuario);

		Quiz quiz = new Quiz();
		quiz.setId(QUIZ_ID);
		quiz.setDeck(deck);
		quiz.setTitulo("Quiz teste");
		quiz.setQuestoes(List.of(
				questao(1L, quiz, "Resposta 1"),
				questao(2L, quiz, "Resposta 2"),
				questao(3L, quiz, "Resposta 3")));

		return quiz;
	}

	private QuestaoQuiz questao(Long id, Quiz quiz, String respostaCorreta) {
		QuestaoQuiz questao = new QuestaoQuiz();
		questao.setId(id);
		questao.setQuiz(quiz);
		questao.setEnunciado("Enunciado " + id);
		questao.setRespostaCorreta(respostaCorreta);
		questao.setAlternativas(List.of(new AlternativaQuiz(respostaCorreta, true), new AlternativaQuiz("Errada", false)));
		return questao;
	}

	@Test
	void deveGerarQuizComSucessoQuandoDeckTemFlashcardsSuficientes() {
		Deck deck = new Deck();
		deck.setId(DECK_ID);
		deck.setTitulo("Biologia");

		List<Flashcard> flashcards = List.of(
				flashcard(1L, "Pergunta 1", "Resposta 1"),
				flashcard(2L, "Pergunta 2", "Resposta 2"),
				flashcard(3L, "Pergunta 3", "Resposta 3"),
				flashcard(4L, "Pergunta 4", "Resposta 4"));

		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);
		when(flashcardRepository.findByDeckId(DECK_ID)).thenReturn(flashcards);
		when(quizRepository.save(any(Quiz.class))).thenAnswer(invocation -> {
			Quiz quiz = invocation.getArgument(0);
			quiz.setId(QUIZ_ID);
			return quiz;
		});

		QuizResponseDTO resposta = quizService.gerarQuiz(DECK_ID);

		assertThat(resposta.id()).isEqualTo(QUIZ_ID);
		assertThat(resposta.titulo()).isEqualTo("Quiz — Biologia");
		assertThat(resposta.questoes()).hasSize(4);
		resposta.questoes().forEach(questao ->
				assertThat(questao.alternativas())
						.containsExactlyInAnyOrder("Resposta 1", "Resposta 2", "Resposta 3", "Resposta 4"));
	}

	@Test
	void deveLancarFlashcardsInsuficientesExceptionQuandoDeckTemMenosDeQuatroFlashcards() {
		Deck deck = new Deck();
		deck.setId(DECK_ID);

		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);
		when(flashcardRepository.findByDeckId(DECK_ID)).thenReturn(List.of(
				flashcard(1L, "Pergunta 1", "Resposta 1"),
				flashcard(2L, "Pergunta 2", "Resposta 2")));

		assertThatThrownBy(() -> quizService.gerarQuiz(DECK_ID))
				.isInstanceOf(FlashcardsInsuficientesException.class);

		verify(quizRepository, never()).save(any());
	}

	@Test
	void deveAplicarRn01AoGerarQuizSemConsultarFlashcardsQuandoDeckNaoPertenceAoUsuario() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID))
				.thenThrow(new AcessoNegadoException("Você não tem permissão para acessar este deck"));

		assertThatThrownBy(() -> quizService.gerarQuiz(DECK_ID)).isInstanceOf(AcessoNegadoException.class);

		verify(flashcardRepository, never()).findByDeckId(any());
	}

	@Test
	void deveAplicarRn01AoBuscarQuizDeOutroUsuario() {
		when(quizRepository.findByIdAndDeckUsuarioId(QUIZ_ID, USUARIO_ID)).thenReturn(Optional.empty());
		when(quizRepository.existsById(QUIZ_ID)).thenReturn(true);

		assertThatThrownBy(() -> quizService.buscarPorId(QUIZ_ID)).isInstanceOf(AcessoNegadoException.class);
	}

	@Test
	void deveAplicarRn01AoResponderTentativaDeQuizDeOutroUsuario() {
		when(quizRepository.findByIdAndDeckUsuarioId(QUIZ_ID, USUARIO_ID)).thenReturn(Optional.empty());
		when(quizRepository.existsById(QUIZ_ID)).thenReturn(true);

		TentativaRequestDTO request = new TentativaRequestDTO(List.of(new RespostaDTO(1L, "Resposta 1")));

		assertThatThrownBy(() -> quizService.responderTentativa(QUIZ_ID, request))
				.isInstanceOf(AcessoNegadoException.class);

		verify(tentativaQuizRepository, never()).save(any());
	}

	@Test
	void deveLancarTentativaIncompletaExceptionQuandoNemTodasAsQuestoesForemRespondidas() {
		Quiz quiz = quizComTresQuestoes();
		when(quizRepository.findByIdAndDeckUsuarioId(QUIZ_ID, USUARIO_ID)).thenReturn(Optional.of(quiz));

		TentativaRequestDTO request = new TentativaRequestDTO(List.of(
				new RespostaDTO(1L, "Resposta 1"),
				new RespostaDTO(2L, "Resposta 2")));

		assertThatThrownBy(() -> quizService.responderTentativa(QUIZ_ID, request))
				.isInstanceOf(TentativaIncompletaException.class);

		verify(tentativaQuizRepository, never()).save(any());
	}

	@Test
	void deveCalcularPontuacaoComMixDeAcertosEErros() {
		Quiz quiz = quizComTresQuestoes();
		when(quizRepository.findByIdAndDeckUsuarioId(QUIZ_ID, USUARIO_ID)).thenReturn(Optional.of(quiz));
		when(tentativaQuizRepository.save(any(TentativaQuiz.class))).thenAnswer(invocation -> invocation.getArgument(0));

		TentativaRequestDTO request = new TentativaRequestDTO(List.of(
				new RespostaDTO(1L, "Resposta 1"),
				new RespostaDTO(2L, "Errada"),
				new RespostaDTO(3L, "Resposta 3")));

		TentativaResponseDTO resposta = quizService.responderTentativa(QUIZ_ID, request);

		assertThat(resposta.acertos()).isEqualTo(2);
		assertThat(resposta.total()).isEqualTo(3);
		assertThat(resposta.pontuacao()).isEqualByComparingTo("66.67");
		assertThat(resposta.questoes()).hasSize(3);
		assertThat(resposta.questoes())
				.filteredOn(questaoRevisada -> questaoRevisada.questaoId().equals(2L))
				.singleElement()
				.satisfies(questaoRevisada -> {
					assertThat(questaoRevisada.correta()).isFalse();
					assertThat(questaoRevisada.alternativaEscolhida()).isEqualTo("Errada");
					assertThat(questaoRevisada.respostaCorreta()).isEqualTo("Resposta 2");
				});
	}

	@Test
	void deveGerarProvaPersonalizadaComSucessoQuandoFlashcardsPertencemAoDeck() {
		Usuario usuario = new Usuario();
		usuario.setId(USUARIO_ID);

		Deck deck = new Deck();
		deck.setId(DECK_ID);
		deck.setUsuario(usuario);
		deck.setTitulo("Anatomia");

		Flashcard flashcard = flashcard(1L, "O que é a aorta?", "A maior artéria do corpo");

		GerarProvaRequestDTO request = new GerarProvaRequestDTO(List.of(1L), EstiloProva.ENEM);

		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);
		when(flashcardRepository.findByIdInAndDeckId(List.of(1L), DECK_ID)).thenReturn(List.of(flashcard));
		when(provaGenerationService.gerarQuestoes(List.of(flashcard), EstiloProva.ENEM)).thenReturn(List.of(
				new ProvaSugestaoDTO(
						"Qual estrutura conduz o sangue oxigenado do coração para o corpo?",
						List.of("Aorta", "Veia cava", "Artéria pulmonar", "Veia porta"),
						"Aorta",
						"A aorta é a maior artéria e parte do ventrículo esquerdo levando sangue oxigenado ao corpo.")));
		when(quizRepository.save(any(Quiz.class))).thenAnswer(invocation -> {
			Quiz quiz = invocation.getArgument(0);
			quiz.setId(QUIZ_ID);
			return quiz;
		});

		QuizResponseDTO resposta = quizService.gerarProvaPersonalizada(DECK_ID, request);

		assertThat(resposta.id()).isEqualTo(QUIZ_ID);
		assertThat(resposta.titulo()).contains(EstiloProva.ENEM.getRotulo()).contains("Anatomia");
		assertThat(resposta.questoes()).hasSize(1);
		assertThat(resposta.questoes().get(0).alternativas())
				.containsExactlyInAnyOrder("Aorta", "Veia cava", "Artéria pulmonar", "Veia porta");
	}

	@Test
	void deveLancarFlashcardsInvalidosExceptionQuandoFlashcardNaoPertenceAoDeck() {
		Deck deck = new Deck();
		deck.setId(DECK_ID);

		GerarProvaRequestDTO request = new GerarProvaRequestDTO(List.of(1L, 2L), EstiloProva.GERAL);

		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);
		when(flashcardRepository.findByIdInAndDeckId(List.of(1L, 2L), DECK_ID))
				.thenReturn(List.of(flashcard(1L, "Pergunta", "Resposta")));

		assertThatThrownBy(() -> quizService.gerarProvaPersonalizada(DECK_ID, request))
				.isInstanceOf(FlashcardsInvalidosException.class);

		verify(provaGenerationService, never()).gerarQuestoes(any(), any());
		verify(quizRepository, never()).save(any());
	}

	@Test
	void deveListarHistoricoDeProvasDoUsuarioAutenticado() {
		Quiz quiz = quizComTresQuestoes();
		quiz.setOrigem(OrigemQuiz.IA_PERSONALIZADA);
		quiz.setEstilo(EstiloProva.VESTIBULAR);

		TentativaQuiz tentativa = new TentativaQuiz();
		tentativa.setId(100L);
		tentativa.setQuiz(quiz);
		tentativa.setPontuacao(new java.math.BigDecimal("66.67"));

		RespostaTentativaQuiz certa = new RespostaTentativaQuiz();
		certa.setCorreta(true);
		RespostaTentativaQuiz errada = new RespostaTentativaQuiz();
		errada.setCorreta(false);
		tentativa.setRespostas(List.of(certa, errada));

		when(tentativaQuizRepository.buscarHistoricoDoUsuario(USUARIO_ID)).thenReturn(List.of(tentativa));

		List<HistoricoProvaResumoDTO> historico = quizService.listarHistoricoProvas();

		assertThat(historico).hasSize(1);
		assertThat(historico.get(0).tentativaId()).isEqualTo(100L);
		assertThat(historico.get(0).acertos()).isEqualTo(1);
		assertThat(historico.get(0).total()).isEqualTo(2);
		assertThat(historico.get(0).estilo()).isEqualTo(EstiloProva.VESTIBULAR);
	}

	@Test
	void deveAplicarRn01AoBuscarDetalheDeTentativaDeOutroUsuario() {
		when(tentativaQuizRepository.buscarDetalheDoUsuario(100L, USUARIO_ID)).thenReturn(Optional.empty());
		when(tentativaQuizRepository.existsById(100L)).thenReturn(true);

		assertThatThrownBy(() -> quizService.buscarDetalheTentativa(100L)).isInstanceOf(AcessoNegadoException.class);
	}

	@Test
	void deveLancarRecursoNaoEncontradoAoBuscarDetalheDeTentativaInexistente() {
		when(tentativaQuizRepository.buscarDetalheDoUsuario(999L, USUARIO_ID)).thenReturn(Optional.empty());
		when(tentativaQuizRepository.existsById(999L)).thenReturn(false);

		assertThatThrownBy(() -> quizService.buscarDetalheTentativa(999L)).isInstanceOf(RecursoNaoEncontradoException.class);
	}

}
