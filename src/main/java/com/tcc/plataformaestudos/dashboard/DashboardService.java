package com.tcc.plataformaestudos.dashboard;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckRepository;
import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.quiz.EstatisticaTentativaProjecao;
import com.tcc.plataformaestudos.quiz.TentativaQuizRepository;
import com.tcc.plataformaestudos.usuario.SecurityUtils;

import lombok.RequiredArgsConstructor;

/**
 * UC11 — Visualizar progresso/dashboard, estendido por UC15 (evolução
 * temporal, detalhamento por tópico, atividade — RN20). RN01 é garantida por
 * {@link DeckService#buscarDeckDoUsuarioAutenticado(Long)}. RN14 define
 * "dominado" com precisão (repeticoes >= 3 e última qualidade_resposta >=
 * 4); o critério de "em risco" não é especificado pela RN14, então é
 * definido e documentado em {@link #estaEmRisco(Integer, LocalDate)} —
 * ambos os critérios são reaproveitados pelo detalhamento por tópico
 * (RN17/RN20).
 *
 * <p>Fica num pacote próprio (em vez de dentro de {@code deck} ou
 * {@code revisao}) porque agrega dados de Flashcard e RevisaoFlashcard só
 * para fins de leitura/relatório — colocá-lo em qualquer um dos dois
 * acoplaria aquele pacote ao outro só por causa do dashboard, sem nenhum
 * caso de uso de escrita em comum com eles.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

	private static final int DIAS_PARA_CONSIDERAR_EM_RISCO_POR_ATRASO = 7;
	private static final String SEM_CATEGORIA = "Sem categoria";
	private static final int TOP_FLASHCARDS_MAIS_REVISADOS = 5;

	private final DeckService deckService;
	private final DeckRepository deckRepository;
	private final DashboardRepository dashboardRepository;
	private final TentativaQuizRepository tentativaQuizRepository;

	@Transactional(readOnly = true)
	public DashboardResponseDTO obterDashboard(Long deckId) {
		deckService.buscarDeckDoUsuarioAutenticado(deckId);

		List<UltimaRevisaoProjecao> estados = dashboardRepository.buscarUltimaRevisaoPorFlashcard(deckId);
		int total = estados.size();

		if (total == 0) {
			return new DashboardResponseDTO(0, BigDecimal.ZERO.setScale(2), BigDecimal.ZERO.setScale(2));
		}

		long dominados = estados.stream().filter(e -> estaDominado(e.repeticoes(), e.qualidadeResposta())).count();
		long emRisco = estados.stream().filter(e -> estaEmRisco(e.qualidadeResposta(), e.proximaRevisao())).count();

		return new DashboardResponseDTO(total, calcularPercentual(dominados, total), calcularPercentual(emRisco, total));
	}

	/**
	 * UC15/RN20 — evolução temporal: média de qualidade e contagem de
	 * revisões por dia, dentro do período solicitado (assume-se {@code dias}
	 * já validado como 7/30/90 pelo controller). Dias sem revisão não geram
	 * ponto na lista (buracos ficam a cargo do frontend).
	 */
	@Transactional(readOnly = true)
	public EvolucaoResponseDTO obterEvolucao(Long deckId, int dias) {
		deckService.buscarDeckDoUsuarioAutenticado(deckId);

		LocalDateTime desde = LocalDate.now().minusDays(dias - 1L).atStartOfDay();
		List<RevisaoBrutaProjecao> revisoes = dashboardRepository.buscarRevisoesParaEvolucao(deckId, desde);

		Map<LocalDate, List<Integer>> qualidadesPorDia = revisoes.stream()
				.collect(Collectors.groupingBy(
						r -> r.dataRevisao().toLocalDate(),
						Collectors.mapping(RevisaoBrutaProjecao::qualidadeResposta, Collectors.toList())));

		List<PontoEvolucaoDTO> pontos = qualidadesPorDia.entrySet().stream()
				.map(entrada -> new PontoEvolucaoDTO(
						entrada.getKey(),
						arredondar(mediaDe(entrada.getValue())),
						entrada.getValue().size()))
				.sorted(Comparator.comparing(PontoEvolucaoDTO::data))
				.toList();

		return new EvolucaoResponseDTO(pontos);
	}

	/**
	 * UC15/RN20/RN17 — mesmo critério de dominado/em risco de RN14
	 * ({@link #estaDominado(Integer, Integer)}/{@link #estaEmRisco(Integer, LocalDate)}),
	 * agrupado por {@code Flashcard.topico} (nulo → "Sem categoria").
	 */
	@Transactional(readOnly = true)
	public TopicosResponseDTO obterDetalhamentoPorTopico(Long deckId) {
		deckService.buscarDeckDoUsuarioAutenticado(deckId);

		List<UltimaRevisaoComTopicoProjecao> estados = dashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(deckId);

		Map<String, List<UltimaRevisaoComTopicoProjecao>> porTopico = estados.stream()
				.collect(Collectors.groupingBy(e -> e.topico() != null ? e.topico() : SEM_CATEGORIA));

		List<TopicoDashboardDTO> topicos = porTopico.entrySet().stream()
				.map(entrada -> montarTopicoDashboard(entrada.getKey(), entrada.getValue()))
				.sorted(Comparator.comparing(TopicoDashboardDTO::topico))
				.toList();

		return new TopicosResponseDTO(topicos);
	}

	/**
	 * UC15/RN20 — top {@value #TOP_FLASHCARDS_MAIS_REVISADOS} flashcards mais
	 * revisados e distribuição de revisões por dia da semana (todos os 7
	 * dias, zero-preenchidos quando sem revisão nesse dia).
	 */
	@Transactional(readOnly = true)
	public AtividadeResponseDTO obterAtividade(Long deckId) {
		deckService.buscarDeckDoUsuarioAutenticado(deckId);

		List<FlashcardMaisRevisadoProjecao> maisRevisados = dashboardRepository
				.buscarFlashcardsMaisRevisados(deckId, PageRequest.of(0, TOP_FLASHCARDS_MAIS_REVISADOS));

		List<FlashcardMaisRevisadoDTO> flashcardsMaisRevisados = maisRevisados.stream()
				.map(f -> new FlashcardMaisRevisadoDTO(f.flashcardId(), f.pergunta(), f.totalRevisoes()))
				.toList();

		List<LocalDateTime> datasDeRevisoes = dashboardRepository.buscarDatasDeRevisoes(deckId);
		Map<DayOfWeek, Long> contagemPorDia = datasDeRevisoes.stream()
				.collect(Collectors.groupingBy(LocalDateTime::getDayOfWeek, Collectors.counting()));

		List<RevisaoPorDiaSemanaDTO> revisoesPorDiaSemana = Arrays.stream(DayOfWeek.values())
				.map(dia -> new RevisaoPorDiaSemanaDTO(nomeDiaEmPortugues(dia), contagemPorDia.getOrDefault(dia, 0L)))
				.toList();

		return new AtividadeResponseDTO(flashcardsMaisRevisados, revisoesPorDiaSemana);
	}

	/**
	 * UC20/RN25 — visão consolidada de todos os decks do usuário autenticado:
	 * reaproveita {@link #estaDominado(Integer, Integer)}/{@link
	 * #estaEmRisco(Integer, LocalDate)} (mesmos critérios de RN14) sobre uma
	 * única consulta cobrindo todos os decks (RN20 já tinha o precedente de
	 * projeção "última revisão", aqui estendida por usuário em vez de por
	 * deck — evita um loop de uma query por deck). O percentual geral é a
	 * média ponderada pelo total de flashcards (calculada direto sobre a
	 * lista completa, não a média simples dos percentuais por deck).
	 */
	@Transactional(readOnly = true)
	public DashboardGeralResponseDTO obterDashboardGeral() {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();

		List<Deck> decks = deckRepository.findByUsuarioId(usuarioId);
		List<UltimaRevisaoDoUsuarioProjecao> estados = dashboardRepository.buscarUltimaRevisaoPorUsuario(usuarioId);

		Map<Long, List<UltimaRevisaoDoUsuarioProjecao>> porDeck = estados.stream()
				.collect(Collectors.groupingBy(UltimaRevisaoDoUsuarioProjecao::deckId));

		List<RankingDeckDTO> ranking = decks.stream()
				.map(deck -> montarRankingDeck(deck, porDeck.getOrDefault(deck.getId(), List.of())))
				.sorted(Comparator.comparing(RankingDeckDTO::percentualDominado).reversed())
				.toList();

		int totalFlashcards = estados.size();
		long dominadosGeral = estados.stream().filter(e -> estaDominado(e.repeticoes(), e.qualidadeResposta())).count();
		long emRiscoGeral = estados.stream().filter(e -> estaEmRisco(e.qualidadeResposta(), e.proximaRevisao())).count();

		BigDecimal percentualDominadoGeral = totalFlashcards == 0
				? BigDecimal.ZERO.setScale(2)
				: calcularPercentual(dominadosGeral, totalFlashcards);
		BigDecimal percentualEmRiscoGeral = totalFlashcards == 0
				? BigDecimal.ZERO.setScale(2)
				: calcularPercentual(emRiscoGeral, totalFlashcards);

		EstatisticaTentativaProjecao estatisticas = tentativaQuizRepository.calcularEstatisticasPorUsuario(usuarioId);
		BigDecimal pontuacaoMedia = estatisticas.pontuacaoMedia() == null
				? BigDecimal.ZERO.setScale(2)
				: BigDecimal.valueOf(estatisticas.pontuacaoMedia()).setScale(2, RoundingMode.HALF_UP);

		return new DashboardGeralResponseDTO(
				decks.size(),
				totalFlashcards,
				percentualDominadoGeral,
				percentualEmRiscoGeral,
				estatisticas.totalTentativas(),
				pontuacaoMedia,
				calcularStreak(usuarioId),
				ranking);
	}

	private RankingDeckDTO montarRankingDeck(Deck deck, List<UltimaRevisaoDoUsuarioProjecao> estados) {
		int total = estados.size();

		if (total == 0) {
			return new RankingDeckDTO(deck.getId(), deck.getTitulo(), BigDecimal.ZERO.setScale(2), BigDecimal.ZERO.setScale(2));
		}

		long dominados = estados.stream().filter(e -> estaDominado(e.repeticoes(), e.qualidadeResposta())).count();
		long emRisco = estados.stream().filter(e -> estaEmRisco(e.qualidadeResposta(), e.proximaRevisao())).count();

		return new RankingDeckDTO(deck.getId(), deck.getTitulo(), calcularPercentual(dominados, total), calcularPercentual(emRisco, total));
	}

	/**
	 * UC20/RN25 — dias consecutivos, a partir de hoje retrocedendo, com ao
	 * menos uma revisão registrada em qualquer deck do usuário; para no
	 * primeiro dia sem nenhuma revisão (inclusive hoje, se for o caso).
	 */
	private int calcularStreak(Long usuarioId) {
		Set<LocalDate> diasComRevisao = dashboardRepository.buscarDatasDeRevisoesPorUsuario(usuarioId).stream()
				.map(LocalDateTime::toLocalDate)
				.collect(Collectors.toSet());

		int streak = 0;
		LocalDate dia = LocalDate.now();
		while (diasComRevisao.contains(dia)) {
			streak++;
			dia = dia.minusDays(1);
		}

		return streak;
	}

	private TopicoDashboardDTO montarTopicoDashboard(String topico, List<UltimaRevisaoComTopicoProjecao> estados) {
		int total = estados.size();
		long dominados = estados.stream().filter(e -> estaDominado(e.repeticoes(), e.qualidadeResposta())).count();
		long emRisco = estados.stream().filter(e -> estaEmRisco(e.qualidadeResposta(), e.proximaRevisao())).count();

		return new TopicoDashboardDTO(topico, total, calcularPercentual(dominados, total), calcularPercentual(emRisco, total));
	}

	/**
	 * RN14: flashcard "dominado" = repeticoes >= 3 (da última revisão) E
	 * última qualidade_resposta >= 4. Flashcard nunca revisado não é
	 * dominado.
	 */
	private boolean estaDominado(Integer repeticoes, Integer qualidadeResposta) {
		return repeticoes != null && repeticoes >= 3
				&& qualidadeResposta != null && qualidadeResposta >= 4;
	}

	/**
	 * Critério de "em risco" adotado (RN14 não define o cálculo exato):
	 * flashcard já revisado ao menos uma vez, e a última revisão indica que
	 * o conhecimento está frágil — última qualidade_resposta &lt; 3 (o
	 * mesmo limiar de RN11 que reinicia a repetição espaçada) OU a
	 * proxima_revisao está vencida há mais de {@value
	 * #DIAS_PARA_CONSIDERAR_EM_RISCO_POR_ATRASO} dias sem uma nova revisão
	 * registrada, sinal de que o estudante provavelmente já esqueceu o
	 * conteúdo. Flashcard nunca revisado não conta como em risco: ainda não
	 * há nenhuma evidência de desempenho sobre ele (nem dominado, nem em
	 * risco).
	 */
	private boolean estaEmRisco(Integer qualidadeResposta, LocalDate proximaRevisao) {
		if (qualidadeResposta == null) {
			return false;
		}

		boolean ultimaQualidadeBaixa = qualidadeResposta < 3;
		boolean atrasadoHaMuitoTempo = proximaRevisao != null
				&& proximaRevisao.isBefore(LocalDate.now().minusDays(DIAS_PARA_CONSIDERAR_EM_RISCO_POR_ATRASO));

		return ultimaQualidadeBaixa || atrasadoHaMuitoTempo;
	}

	private BigDecimal calcularPercentual(long quantidade, int total) {
		return BigDecimal.valueOf(quantidade)
				.multiply(BigDecimal.valueOf(100))
				.divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
	}

	private BigDecimal arredondar(double valor) {
		return BigDecimal.valueOf(valor).setScale(2, RoundingMode.HALF_UP);
	}

	private double mediaDe(List<Integer> qualidades) {
		return qualidades.stream().mapToInt(Integer::intValue).average().orElse(0);
	}

	private String nomeDiaEmPortugues(DayOfWeek diaSemana) {
		return switch (diaSemana) {
			case MONDAY -> "SEGUNDA";
			case TUESDAY -> "TERCA";
			case WEDNESDAY -> "QUARTA";
			case THURSDAY -> "QUINTA";
			case FRIDAY -> "SEXTA";
			case SATURDAY -> "SABADO";
			case SUNDAY -> "DOMINGO";
		};
	}

}
