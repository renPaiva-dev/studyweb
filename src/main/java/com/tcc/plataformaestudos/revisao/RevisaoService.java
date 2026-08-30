package com.tcc.plataformaestudos.revisao;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;
import com.tcc.plataformaestudos.flashcard.FlashcardService;

import lombok.RequiredArgsConstructor;

/**
 * UC07/UC08/UC09 — fila de estudo e avaliação de respostas com repetição
 * espaçada. RN01 é garantida por {@link DeckService#buscarDeckDoUsuarioAutenticado(Long)}
 * (fila, escopada a um deck) e {@link FlashcardService#buscarFlashcardDoUsuarioAutenticado(Long)}
 * (avaliação, escopada a um flashcard). O cálculo do SM-2 em si (RN09/RN11/RN12)
 * é delegado a {@link Sm2CalculatorService}, mantendo este service livre de
 * lógica aritmética — apenas orquestração e persistência.
 */
@Service
@RequiredArgsConstructor
public class RevisaoService {

	private static final Logger log = LoggerFactory.getLogger(RevisaoService.class);

	private final RevisaoFlashcardRepository revisaoFlashcardRepository;
	private final FlashcardRepository flashcardRepository;
	private final DeckService deckService;
	private final FlashcardService flashcardService;
	private final Sm2CalculatorService sm2CalculatorService;

	/**
	 * UC07 — fila de estudo de um deck, ordenada pelos mais atrasados
	 * primeiro. Por padrão, só os flashcards pendentes de revisão (RN10).
	 * Flashcards sem histórico de revisão (nunca estudados) são tratados
	 * como os mais urgentes. Se {@code incluirTodos} for true, RN10 é
	 * ignorada e o deck inteiro é retornado — "Revisar mesmo assim" (RN22);
	 * as revisões geradas a partir dessa fila são reais, avaliadas pelo
	 * mesmo {@link #avaliarResposta(Long, AvaliarRespostaRequestDTO)}.
	 */
	@Transactional(readOnly = true)
	public List<FilaEstudoItemDTO> obterFilaDeEstudo(Long deckId, boolean incluirTodos) {
		deckService.buscarDeckDoUsuarioAutenticado(deckId);

		List<Flashcard> flashcards = incluirTodos
				? flashcardRepository.findByDeckId(deckId)
				: revisaoFlashcardRepository.findFlashcardsPendentesDeRevisao(deckId, LocalDate.now());

		return flashcards.stream()
				.sorted(Comparator.comparing(this::proximaRevisaoOuMaisAntiga))
				.map(FilaEstudoItemDTO::fromEntity)
				.toList();
	}

	/**
	 * UC08/UC09 — registra a avaliação (0-5) e recalcula o estado do SM-2 a
	 * partir do estado anterior do flashcard (ou do estado inicial, se for a
	 * primeira revisão).
	 */
	@Transactional
	public RevisaoResponseDTO avaliarResposta(Long flashcardId, AvaliarRespostaRequestDTO request) {
		Flashcard flashcard = flashcardService.buscarFlashcardDoUsuarioAutenticado(flashcardId);

		EstadoRevisao estadoAnterior = revisaoFlashcardRepository.findFirstByFlashcardIdOrderByDataRevisaoDesc(flashcardId)
				.map(r -> new EstadoRevisao(r.getFatorFacilidade(), r.getIntervaloDias(), r.getRepeticoes()))
				.orElse(EstadoRevisao.inicial());

		EstadoRevisao novoEstado = sm2CalculatorService.calcularNovoEstado(estadoAnterior, request.qualidadeResposta());

		RevisaoFlashcard revisao = new RevisaoFlashcard();
		revisao.setFlashcard(flashcard);
		revisao.setUsuario(flashcard.getDeck().getUsuario());
		revisao.setQualidadeResposta(request.qualidadeResposta());
		revisao.setFatorFacilidade(novoEstado.fatorFacilidade());
		revisao.setIntervaloDias(novoEstado.intervaloDias());
		revisao.setRepeticoes(novoEstado.repeticoes());
		revisao.setProximaRevisao(LocalDate.now().plusDays(novoEstado.intervaloDias()));

		RevisaoFlashcard salva = revisaoFlashcardRepository.save(revisao);
		log.info("Revisão registrada: flashcardId={}, qualidade={}, repeticoes={}, proximaRevisao={}",
				flashcardId, request.qualidadeResposta(), novoEstado.repeticoes(), salva.getProximaRevisao());

		return RevisaoResponseDTO.fromEntity(salva);
	}

	private LocalDate proximaRevisaoOuMaisAntiga(Flashcard flashcard) {
		return revisaoFlashcardRepository.findFirstByFlashcardIdOrderByDataRevisaoDesc(flashcard.getId())
				.map(RevisaoFlashcard::getProximaRevisao)
				.orElse(LocalDate.MIN);
	}

}
