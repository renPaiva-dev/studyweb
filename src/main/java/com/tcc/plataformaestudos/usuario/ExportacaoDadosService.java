package com.tcc.plataformaestudos.usuario;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckRepository;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;
import com.tcc.plataformaestudos.material.MaterialOrigem;
import com.tcc.plataformaestudos.material.MaterialOrigemRepository;
import com.tcc.plataformaestudos.quiz.QuestaoQuiz;
import com.tcc.plataformaestudos.quiz.QuestaoQuizRepository;
import com.tcc.plataformaestudos.quiz.Quiz;
import com.tcc.plataformaestudos.quiz.QuizRepository;
import com.tcc.plataformaestudos.quiz.TentativaQuiz;
import com.tcc.plataformaestudos.quiz.TentativaQuizRepository;
import com.tcc.plataformaestudos.revisao.RevisaoFlashcard;
import com.tcc.plataformaestudos.revisao.RevisaoFlashcardRepository;

import lombok.RequiredArgsConstructor;

/**
 * UC24/RN31 (LGPD, acesso/portabilidade) — monta a exportação completa dos
 * dados do usuário autenticado. A busca sempre parte do próprio usuário
 * autenticado (sem parâmetro de usuário na entrada), o que já elimina por
 * design o risco de vazamento de dados de terceiros (RN01) — não é preciso
 * validação adicional. Usa poucas consultas em lote (uma por tipo de
 * coleção, com IN sobre os ids dos decks/flashcards/quizzes do usuário) em
 * vez de uma consulta por deck/flashcard/quiz, evitando N+1.
 */
@Service
@RequiredArgsConstructor
public class ExportacaoDadosService {

	private static final Logger log = LoggerFactory.getLogger(ExportacaoDadosService.class);

	private final UsuarioRepository usuarioRepository;
	private final DeckRepository deckRepository;
	private final MaterialOrigemRepository materialOrigemRepository;
	private final FlashcardRepository flashcardRepository;
	private final RevisaoFlashcardRepository revisaoFlashcardRepository;
	private final QuizRepository quizRepository;
	private final QuestaoQuizRepository questaoQuizRepository;
	private final TentativaQuizRepository tentativaQuizRepository;

	@Transactional(readOnly = true)
	public ExportacaoDadosDTO exportarDados() {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();
		Usuario usuario = usuarioRepository.findById(usuarioId)
				.orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado: id=" + usuarioId));

		List<Deck> decks = deckRepository.findByUsuarioId(usuarioId);
		List<Long> deckIds = decks.stream().map(Deck::getId).toList();

		Map<Long, List<MaterialOrigem>> materiaisPorDeck = buscarEmLote(deckIds, materialOrigemRepository::findByDeckIdIn)
				.stream().collect(Collectors.groupingBy(m -> m.getDeck().getId()));

		List<Flashcard> flashcards = buscarEmLote(deckIds, flashcardRepository::findByDeckIdIn);
		Map<Long, List<Flashcard>> flashcardsPorDeck = flashcards.stream()
				.collect(Collectors.groupingBy(f -> f.getDeck().getId()));

		List<Long> flashcardIds = flashcards.stream().map(Flashcard::getId).toList();
		Map<Long, List<RevisaoFlashcard>> revisoesPorFlashcard = buscarEmLote(flashcardIds, revisaoFlashcardRepository::findByFlashcardIdIn)
				.stream().collect(Collectors.groupingBy(r -> r.getFlashcard().getId()));

		List<Quiz> quizzes = buscarEmLote(deckIds, quizRepository::findByDeckIdIn);
		Map<Long, List<Quiz>> quizzesPorDeck = quizzes.stream()
				.collect(Collectors.groupingBy(q -> q.getDeck().getId()));

		List<Long> quizIds = quizzes.stream().map(Quiz::getId).toList();
		Map<Long, List<QuestaoQuiz>> questoesPorQuiz = buscarEmLote(quizIds, questaoQuizRepository::findByQuizIdIn)
				.stream().collect(Collectors.groupingBy(q -> q.getQuiz().getId()));
		Map<Long, List<TentativaQuiz>> tentativasPorQuiz = buscarEmLote(quizIds, tentativaQuizRepository::findByQuizIdIn)
				.stream().collect(Collectors.groupingBy(t -> t.getQuiz().getId()));

		List<DeckExportadoDTO> decksExportados = decks.stream()
				.map(deck -> montarDeckExportado(deck, materiaisPorDeck, flashcardsPorDeck, revisoesPorFlashcard,
						quizzesPorDeck, questoesPorQuiz, tentativasPorQuiz))
				.toList();

		log.info("Exportação de dados gerada: usuarioId={}, totalDecks={}", usuarioId, decks.size());

		return new ExportacaoDadosDTO(UsuarioResponseDTO.fromEntity(usuario), decksExportados);
	}

	private static <T> List<T> buscarEmLote(List<Long> ids, java.util.function.Function<List<Long>, List<T>> busca) {
		return ids.isEmpty() ? List.of() : busca.apply(ids);
	}

	private DeckExportadoDTO montarDeckExportado(
			Deck deck,
			Map<Long, List<MaterialOrigem>> materiaisPorDeck,
			Map<Long, List<Flashcard>> flashcardsPorDeck,
			Map<Long, List<RevisaoFlashcard>> revisoesPorFlashcard,
			Map<Long, List<Quiz>> quizzesPorDeck,
			Map<Long, List<QuestaoQuiz>> questoesPorQuiz,
			Map<Long, List<TentativaQuiz>> tentativasPorQuiz) {

		List<MaterialExportadoDTO> materiais = materiaisPorDeck.getOrDefault(deck.getId(), List.of()).stream()
				.map(m -> new MaterialExportadoDTO(m.getId(), m.getNomeArquivo(), m.getStatusProcessamento(), m.getCriadoEm()))
				.toList();

		List<FlashcardExportadoDTO> flashcardsExportados = flashcardsPorDeck.getOrDefault(deck.getId(), List.of()).stream()
				.map(f -> new FlashcardExportadoDTO(
						f.getId(), f.getPergunta(), f.getResposta(), f.getMnemonico(), f.getTopico(), f.getOrigem(), f.getCriadoEm(),
						revisoesPorFlashcard.getOrDefault(f.getId(), List.of()).stream()
								.map(r -> new RevisaoExportadaDTO(r.getId(), r.getDataRevisao(), r.getQualidadeResposta(),
										r.getFatorFacilidade(), r.getIntervaloDias(), r.getRepeticoes(), r.getProximaRevisao()))
								.toList()))
				.toList();

		List<QuizExportadoDTO> quizzesExportados = quizzesPorDeck.getOrDefault(deck.getId(), List.of()).stream()
				.map(q -> new QuizExportadoDTO(
						q.getId(), q.getTitulo(), q.getCriadoEm(),
						questoesPorQuiz.getOrDefault(q.getId(), List.of()).stream()
								.map(qq -> new QuestaoExportadaDTO(qq.getId(), qq.getEnunciado(), qq.getAlternativas(), qq.getRespostaCorreta()))
								.toList(),
						tentativasPorQuiz.getOrDefault(q.getId(), List.of()).stream()
								.map(t -> new TentativaExportadaDTO(t.getId(), t.getDataTentativa(), t.getPontuacao()))
								.toList()))
				.toList();

		return new DeckExportadoDTO(deck.getId(), deck.getTitulo(), deck.getDescricao(), deck.getCriadoEm(), deck.getAtualizadoEm(),
				materiais, flashcardsExportados, quizzesExportados);
	}

}
