package com.tcc.plataformaestudos.quiz;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.config.AcessoNegadoException;
import com.tcc.plataformaestudos.config.RecursoNaoEncontradoException;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;
import com.tcc.plataformaestudos.ia.ProvaGenerationService;
import com.tcc.plataformaestudos.ia.ProvaSugestaoDTO;
import com.tcc.plataformaestudos.usuario.SecurityUtils;

import lombok.RequiredArgsConstructor;

/**
 * UC10 (extensão de escopo) — quiz de múltipla escolha gerado a partir dos
 * flashcards já existentes no deck. RN01 é garantida por
 * {@link DeckService#buscarDeckDoUsuarioAutenticado(Long)} (geração, que
 * ainda não tem um Quiz para checar) e por
 * {@link #buscarQuizDoUsuarioAutenticado(Long)} (leitura e tentativa,
 * escopadas a um quiz já existente). RN15 é garantida em
 * {@link #responderTentativa(Long, TentativaRequestDTO)}.
 *
 * <p>Geração determinística e sem chamar a IA de novo: a resposta certa de
 * cada questão já existe (a resposta do próprio flashcard); as respostas
 * dos demais flashcards do mesmo deck já servem como alternativas erradas
 * plausíveis (mesmo domínio de conteúdo), sem o custo/latência de uma nova
 * chamada de rede nem o risco de a IA gerar alternativas inconsistentes com
 * a pergunta.
 */
@Service
@RequiredArgsConstructor
public class QuizService {

	private static final Logger log = LoggerFactory.getLogger(QuizService.class);

	/** 1 alternativa correta + 3 erradas por questão. */
	private static final int NUMERO_ALTERNATIVAS_ERRADAS = 3;
	private static final int MINIMO_FLASHCARDS_PARA_QUIZ = NUMERO_ALTERNATIVAS_ERRADAS + 1;

	private final DeckService deckService;
	private final FlashcardRepository flashcardRepository;
	private final QuizRepository quizRepository;
	private final TentativaQuizRepository tentativaQuizRepository;
	private final ProvaGenerationService provaGenerationService;

	@Transactional
	public QuizResponseDTO gerarQuiz(Long deckId) {
		Deck deck = deckService.buscarDeckDoUsuarioAutenticado(deckId);

		List<Flashcard> flashcards = flashcardRepository.findByDeckId(deckId);
		if (flashcards.size() < MINIMO_FLASHCARDS_PARA_QUIZ) {
			throw new FlashcardsInsuficientesException(
					"O deck precisa de ao menos " + MINIMO_FLASHCARDS_PARA_QUIZ + " flashcards para gerar um quiz");
		}

		Quiz quiz = new Quiz();
		quiz.setDeck(deck);
		quiz.setTitulo("Quiz — " + deck.getTitulo());

		for (Flashcard flashcard : flashcards) {
			quiz.getQuestoes().add(gerarQuestao(flashcard, flashcards, quiz));
		}

		Quiz salvo = quizRepository.save(quiz);
		log.info("Quiz gerado: quizId={}, deckId={}, totalQuestoes={}", salvo.getId(), deckId, salvo.getQuestoes().size());

		return QuizResponseDTO.fromEntity(salvo);
	}

	@Transactional(readOnly = true)
	public QuizResponseDTO buscarPorId(Long quizId) {
		return QuizResponseDTO.fromEntity(buscarQuizDoUsuarioAutenticado(quizId));
	}

	@Transactional
	public TentativaResponseDTO responderTentativa(Long quizId, TentativaRequestDTO request) {
		Quiz quiz = buscarQuizDoUsuarioAutenticado(quizId);

		Map<Long, String> respostasPorQuestao = new HashMap<>();
		for (RespostaDTO resposta : request.respostas()) {
			respostasPorQuestao.put(resposta.questaoId(), resposta.alternativaEscolhida());
		}

		List<QuestaoQuiz> questoes = quiz.getQuestoes();
		for (QuestaoQuiz questao : questoes) {
			if (!respostasPorQuestao.containsKey(questao.getId())) {
				throw new TentativaIncompletaException("Todas as questões do quiz devem ser respondidas");
			}
		}

		TentativaQuiz tentativa = new TentativaQuiz();
		tentativa.setQuiz(quiz);
		tentativa.setUsuario(quiz.getDeck().getUsuario());

		int acertos = 0;
		for (QuestaoQuiz questao : questoes) {
			String respondida = respostasPorQuestao.get(questao.getId());
			boolean correta = respondida.equals(questao.getRespostaCorreta());
			if (correta) {
				acertos++;
			}

			RespostaTentativaQuiz resposta = new RespostaTentativaQuiz();
			resposta.setTentativa(tentativa);
			resposta.setQuestao(questao);
			resposta.setAlternativaEscolhida(respondida);
			resposta.setCorreta(correta);
			tentativa.getRespostas().add(resposta);
		}

		int total = questoes.size();
		BigDecimal pontuacao = calcularPontuacao(acertos, total);
		tentativa.setPontuacao(pontuacao);

		tentativaQuizRepository.save(tentativa);
		log.info("Tentativa registrada: quizId={}, acertos={}, total={}, pontuacao={}", quizId, acertos, total, pontuacao);

		return new TentativaResponseDTO(pontuacao, acertos, total, montarRevisaoQuestoes(tentativa));
	}

	/**
	 * UC27/RN35 — gera uma prova personalizada via IA a partir de flashcards
	 * escolhidos pelo usuário (validados contra o deck — RN01) e de um
	 * estilo de prova. Reaproveita Quiz/QuestaoQuiz (origem=IA_PERSONALIZADA)
	 * e os endpoints já existentes de resposta/histórico.
	 */
	@Transactional
	public QuizResponseDTO gerarProvaPersonalizada(Long deckId, GerarProvaRequestDTO request) {
		Deck deck = deckService.buscarDeckDoUsuarioAutenticado(deckId);

		List<Flashcard> flashcardsBase = flashcardRepository.findByIdInAndDeckId(request.flashcardIds(), deckId);
		if (flashcardsBase.size() != request.flashcardIds().size()) {
			throw new FlashcardsInvalidosException("Um ou mais flashcards informados não pertencem a este deck");
		}

		List<ProvaSugestaoDTO> sugestoes = provaGenerationService.gerarQuestoes(flashcardsBase, request.estilo());

		Quiz quiz = new Quiz();
		quiz.setDeck(deck);
		quiz.setOrigem(OrigemQuiz.IA_PERSONALIZADA);
		quiz.setEstilo(request.estilo());
		quiz.setTitulo("Prova " + request.estilo().getRotulo() + " — " + deck.getTitulo());

		for (ProvaSugestaoDTO sugestao : sugestoes) {
			quiz.getQuestoes().add(montarQuestaoPersonalizada(sugestao, quiz));
		}

		Quiz salvo = quizRepository.save(quiz);
		log.info("Prova personalizada gerada: quizId={}, deckId={}, estilo={}, totalQuestoes={}",
				salvo.getId(), deckId, request.estilo(), salvo.getQuestoes().size());

		return QuizResponseDTO.fromEntity(salvo);
	}

	/** UC28/RN36 — histórico de provas do usuário autenticado, mais recentes primeiro. */
	@Transactional(readOnly = true)
	public List<HistoricoProvaResumoDTO> listarHistoricoProvas() {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();

		return tentativaQuizRepository.buscarHistoricoDoUsuario(usuarioId).stream()
				.map(this::montarResumoHistorico)
				.toList();
	}

	/** UC28/RN01/RN36 — detalhe de uma tentativa, com revisão questão a questão. */
	@Transactional(readOnly = true)
	public HistoricoProvaDetalheDTO buscarDetalheTentativa(Long tentativaId) {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();

		TentativaQuiz tentativa = tentativaQuizRepository.buscarDetalheDoUsuario(tentativaId, usuarioId)
				.orElseGet(() -> {
					if (tentativaQuizRepository.existsById(tentativaId)) {
						throw new AcessoNegadoException("Você não tem permissão para acessar esta tentativa");
					}
					throw new RecursoNaoEncontradoException("Tentativa não encontrada");
				});

		Quiz quiz = tentativa.getQuiz();
		return new HistoricoProvaDetalheDTO(tentativa.getId(), quiz.getId(), quiz.getTitulo(), quiz.getOrigem(),
				quiz.getEstilo(), tentativa.getDataTentativa(), tentativa.getPontuacao(), montarRevisaoQuestoes(tentativa));
	}

	/**
	 * Centraliza RN01 para um quiz individual: busca e garante que pertence
	 * (via deck) ao usuário autenticado. 404 se não existe; 403 se existe mas
	 * é de outro usuário.
	 */
	public Quiz buscarQuizDoUsuarioAutenticado(Long quizId) {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();

		return quizRepository.findByIdAndDeckUsuarioId(quizId, usuarioId)
				.orElseGet(() -> {
					if (quizRepository.existsById(quizId)) {
						throw new AcessoNegadoException("Você não tem permissão para acessar este quiz");
					}
					throw new RecursoNaoEncontradoException("Quiz não encontrado");
				});
	}

	private QuestaoQuiz gerarQuestao(Flashcard flashcard, List<Flashcard> todosFlashcards, Quiz quiz) {
		List<Flashcard> outros = new ArrayList<>(todosFlashcards);
		outros.remove(flashcard);
		Collections.shuffle(outros);

		List<AlternativaQuiz> alternativas = new ArrayList<>();
		alternativas.add(new AlternativaQuiz(flashcard.getResposta(), true));
		outros.stream()
				.limit(NUMERO_ALTERNATIVAS_ERRADAS)
				.forEach(outro -> alternativas.add(new AlternativaQuiz(outro.getResposta(), false)));
		Collections.shuffle(alternativas);

		QuestaoQuiz questao = new QuestaoQuiz();
		questao.setQuiz(quiz);
		questao.setEnunciado(flashcard.getPergunta());
		questao.setAlternativas(alternativas);
		questao.setRespostaCorreta(flashcard.getResposta());
		return questao;
	}

	private BigDecimal calcularPontuacao(int acertos, int total) {
		return BigDecimal.valueOf(acertos)
				.multiply(BigDecimal.valueOf(100))
				.divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
	}

	private QuestaoQuiz montarQuestaoPersonalizada(ProvaSugestaoDTO sugestao, Quiz quiz) {
		List<AlternativaQuiz> alternativas = sugestao.alternativas().stream()
				.map(texto -> new AlternativaQuiz(texto, texto.equals(sugestao.respostaCorreta())))
				.toList();

		QuestaoQuiz questao = new QuestaoQuiz();
		questao.setQuiz(quiz);
		questao.setEnunciado(sugestao.enunciado());
		questao.setAlternativas(alternativas);
		questao.setRespostaCorreta(sugestao.respostaCorreta());
		questao.setExplicacao(sugestao.explicacao());
		return questao;
	}

	private HistoricoProvaResumoDTO montarResumoHistorico(TentativaQuiz tentativa) {
		int total = tentativa.getRespostas().size();
		int acertos = (int) tentativa.getRespostas().stream().filter(RespostaTentativaQuiz::isCorreta).count();
		Quiz quiz = tentativa.getQuiz();

		return new HistoricoProvaResumoDTO(tentativa.getId(), quiz.getId(), quiz.getTitulo(), quiz.getOrigem(),
				quiz.getEstilo(), tentativa.getDataTentativa(), tentativa.getPontuacao(), acertos, total);
	}

	/** Revela resposta correta, alternativa escolhida e explicação — só chamado depois de a tentativa existir. */
	private List<QuestaoRevisadaDTO> montarRevisaoQuestoes(TentativaQuiz tentativa) {
		return tentativa.getRespostas().stream()
				.map(resposta -> {
					QuestaoQuiz questao = resposta.getQuestao();
					List<String> alternativas = questao.getAlternativas().stream().map(AlternativaQuiz::texto).toList();

					return new QuestaoRevisadaDTO(questao.getId(), questao.getEnunciado(), alternativas,
							questao.getRespostaCorreta(), resposta.getAlternativaEscolhida(), resposta.isCorreta(),
							questao.getExplicacao());
				})
				.toList();
	}

}
