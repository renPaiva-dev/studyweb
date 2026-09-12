package com.tcc.plataformaestudos.prontidao;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.dashboard.CriterioDesempenhoFlashcard;
import com.tcc.plataformaestudos.dashboard.DashboardRepository;
import com.tcc.plataformaestudos.dashboard.EstadoProntidaoProjecao;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckRepository;
import com.tcc.plataformaestudos.deck.DeckService;

import lombok.RequiredArgsConstructor;

/**
 * UC31 — Definir data-alvo de prova e consultar prontidão (RN40), detalhado
 * em {@code Docs/extensao-prontidao-prova.md}. RN01 é garantida por
 * {@link DeckService#buscarDeckDoUsuarioAutenticado(Long)}. Reaproveita
 * {@link DashboardRepository} (mesma família de consultas de "última revisão
 * por flashcard" do UC15/RN20) e {@link CriterioDesempenhoFlashcard#SEM_CATEGORIA}
 * (RN17) — nenhuma regra de negócio ou literal duplicado. Diferente de
 * {@code RecomendacaoEstudoService}/{@code ExplicacaoService}, não chama a
 * IA em nenhum momento — é inteiramente algorítmica (ver spec §11).
 *
 * <p>RN40 não define precisamente o limiar de "precisando de revisão" —
 * decisão adotada (ver spec §3): {@value #LIMIAR_RETENCAO_MINIMA_ACEITAVEL}
 * (75%), valor de exemplo, mesmo espírito do "ex.: 15" de RN08.
 */
@Service
@RequiredArgsConstructor
public class ProntidaoProvaService {

	private static final Logger log = LoggerFactory.getLogger(ProntidaoProvaService.class);

	private static final double LIMIAR_RETENCAO_MINIMA_ACEITAVEL = 0.75;
	private static final int MAXIMO_TOPICOS_NA_MENSAGEM = 3;

	private final DeckService deckService;
	private final DeckRepository deckRepository;
	private final DashboardRepository dashboardRepository;

	@Transactional(readOnly = true)
	public DataAlvoProvaResponseDTO obterDataAlvo(Long deckId) {
		Deck deck = deckService.buscarDeckDoUsuarioAutenticado(deckId);
		return new DataAlvoProvaResponseDTO(deck.getDataAlvoProva());
	}

	@Transactional
	public DataAlvoProvaResponseDTO definirDataAlvo(Long deckId, LocalDate dataAlvo) {
		Deck deck = deckService.buscarDeckDoUsuarioAutenticado(deckId);

		if (dataAlvo.isBefore(LocalDate.now())) {
			throw new DataAlvoProvaInvalidaException("A data-alvo da prova não pode ser no passado");
		}

		deck.setDataAlvoProva(dataAlvo);
		deckRepository.save(deck);
		log.info("Data-alvo de prova definida: deckId={}, dataAlvo={}", deckId, dataAlvo);

		return new DataAlvoProvaResponseDTO(dataAlvo);
	}

	@Transactional
	public void removerDataAlvo(Long deckId) {
		Deck deck = deckService.buscarDeckDoUsuarioAutenticado(deckId);
		deck.setDataAlvoProva(null);
		deckRepository.save(deck);
		log.info("Data-alvo de prova removida: deckId={}", deckId);
	}

	@Transactional(readOnly = true)
	public ProntidaoProvaResponseDTO calcularProntidao(Long deckId) {
		Deck deck = deckService.buscarDeckDoUsuarioAutenticado(deckId);
		LocalDate dataAlvo = deck.getDataAlvoProva();

		if (dataAlvo == null) {
			throw new DataAlvoProvaNaoDefinidaException("Defina uma data-alvo de prova antes de consultar a prontidão");
		}

		List<EstadoProntidaoProjecao> estados = dashboardRepository.buscarUltimaRevisaoParaProntidao(deckId);
		long diasRestantes = ChronoUnit.DAYS.between(LocalDate.now(), dataAlvo);

		if (estados.isEmpty()) {
			return new ProntidaoProvaResponseDTO(dataAlvo, diasRestantes, 0, BigDecimal.ZERO.setScale(2), List.of(),
					"Este deck ainda não tem flashcards para estimar a prontidão.");
		}

		Map<Long, Double> retencaoPorFlashcard = estados.stream()
				.collect(Collectors.toMap(EstadoProntidaoProjecao::flashcardId,
						e -> CalculadoraRetencao.estimarRetencao(e.dataRevisao(), e.intervaloDias(), dataAlvo)));

		Map<String, List<EstadoProntidaoProjecao>> porTopico = estados.stream()
				.collect(Collectors.groupingBy(e -> e.topico() != null ? e.topico() : CriterioDesempenhoFlashcard.SEM_CATEGORIA));

		List<TopicoProntidaoDTO> topicos = porTopico.entrySet().stream()
				.map(entrada -> montarTopicoProntidao(entrada.getKey(), entrada.getValue(), retencaoPorFlashcard))
				.sorted(Comparator.comparing(TopicoProntidaoDTO::retencaoMediaEstimada))
				.toList();

		BigDecimal prontidaoGeral = arredondarPercentual(
				retencaoPorFlashcard.values().stream().mapToDouble(Double::doubleValue).average().orElse(0.0));

		String mensagem = montarMensagem(diasRestantes, topicos);

		return new ProntidaoProvaResponseDTO(dataAlvo, diasRestantes, estados.size(), prontidaoGeral, topicos, mensagem);
	}

	private TopicoProntidaoDTO montarTopicoProntidao(
			String topico, List<EstadoProntidaoProjecao> estadosDoTopico, Map<Long, Double> retencaoPorFlashcard) {
		List<Double> retencoes = estadosDoTopico.stream()
				.map(e -> retencaoPorFlashcard.get(e.flashcardId()))
				.toList();

		double media = retencoes.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
		int precisandoRevisao = (int) retencoes.stream().filter(r -> r < LIMIAR_RETENCAO_MINIMA_ACEITAVEL).count();

		return new TopicoProntidaoDTO(topico, estadosDoTopico.size(), arredondarPercentual(media), precisandoRevisao);
	}

	private String montarMensagem(long diasRestantes, List<TopicoProntidaoDTO> topicos) {
		List<String> topicosPrioritarios = topicos.stream()
				.filter(t -> t.flashcardsPrecisandoRevisao() > 0)
				.map(TopicoProntidaoDTO::topico)
				.limit(MAXIMO_TOPICOS_NA_MENSAGEM)
				.toList();

		if (topicosPrioritarios.isEmpty()) {
			return "Boa prontidão estimada para a prova em %d dia(s). Continue revisando normalmente.".formatted(diasRestantes);
		}

		return "Faltam %d dia(s) para a prova. Priorize a revisão de: %s.".formatted(diasRestantes, String.join(", ", topicosPrioritarios));
	}

	private BigDecimal arredondarPercentual(double retencao) {
		return BigDecimal.valueOf(retencao * 100).setScale(2, RoundingMode.HALF_UP);
	}

}
