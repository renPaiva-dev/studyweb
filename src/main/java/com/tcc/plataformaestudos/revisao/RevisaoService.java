package com.tcc.plataformaestudos.revisao;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.config.RecursoNaoEncontradoException;
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

		return ordenarPelaProximaRevisao(flashcards);
	}

	/**
	 * UC08/UC09 — registra a avaliação (0-5) e recalcula o estado do SM-2 a
	 * partir do estado anterior do flashcard (ou do estado inicial, se for a
	 * primeira revisão).
	 */
	@Transactional
	public RevisaoResponseDTO avaliarResposta(Long flashcardId, AvaliarRespostaRequestDTO request) {
		Flashcard flashcard = flashcardService.buscarFlashcardDoUsuarioAutenticado(flashcardId);

		// RN09/RN11 (SM-2): trava a linha do flashcard (lock pessimista) ANTES
		// de ler o estado anterior, serializando avaliações concorrentes do
		// mesmo flashcard — sem isso, duas requisições quase simultâneas leem
		// o mesmo estado anterior e calculam/gravam independentemente,
		// corrompendo o algoritmo (segunda escrita "vence" com base num
		// estado já desatualizado).
		flashcardRepository.findByIdParaAtualizacaoDeRevisao(flashcardId)
				.orElseThrow(() -> new RecursoNaoEncontradoException("Flashcard não encontrado"));

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

	/**
	 * UC07/RN10 — ordena a fila de estudo pelos mais atrasados primeiro. Busca
	 * TODAS as revisões dos flashcards envolvidos numa única consulta
	 * ({@code findByFlashcardIdIn}, já usada em UC24/RN31 para o mesmo fim) e
	 * monta um mapa flashcardId -> próxima revisão ANTES do sort — nunca
	 * consulta o banco dentro do {@link Comparator} (o que geraria uma query
	 * por comparação, O(n log n) consultas em vez de O(n)).
	 */
	private List<FilaEstudoItemDTO> ordenarPelaProximaRevisao(List<Flashcard> flashcards) {
		List<Long> flashcardIds = flashcards.stream().map(Flashcard::getId).toList();

		List<RevisaoFlashcard> revisoes = flashcardIds.isEmpty()
				? List.of()
				: revisaoFlashcardRepository.findByFlashcardIdIn(flashcardIds);

		Map<Long, LocalDate> proximaRevisaoPorFlashcardId = revisoes.stream()
				.collect(Collectors.groupingBy(
						r -> r.getFlashcard().getId(),
						Collectors.collectingAndThen(
								Collectors.maxBy(Comparator.comparing(RevisaoFlashcard::getDataRevisao)),
								ultima -> ultima.map(RevisaoFlashcard::getProximaRevisao).orElse(LocalDate.MIN))));

		return flashcards.stream()
				.sorted(Comparator.comparing(f -> proximaRevisaoPorFlashcardId.getOrDefault(f.getId(), LocalDate.MIN)))
				.map(FilaEstudoItemDTO::fromEntity)
				.toList();
	}

}
