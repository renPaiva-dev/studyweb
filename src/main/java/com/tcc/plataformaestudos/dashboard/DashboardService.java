package com.tcc.plataformaestudos.dashboard;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.deck.DeckService;

import lombok.RequiredArgsConstructor;

/**
 * UC11 — Visualizar progresso/dashboard. RN01 é garantida por
 * {@link DeckService#buscarDeckDoUsuarioAutenticado(Long)}. RN14 define
 * "dominado" com precisão (repeticoes >= 3 e última qualidade_resposta >=
 * 4); o critério de "em risco" não é especificado pela RN14, então é
 * definido e documentado em {@link #estaEmRisco(UltimaRevisaoProjecao)}.
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

	private final DeckService deckService;
	private final DashboardRepository dashboardRepository;

	@Transactional(readOnly = true)
	public DashboardResponseDTO obterDashboard(Long deckId) {
		deckService.buscarDeckDoUsuarioAutenticado(deckId);

		List<UltimaRevisaoProjecao> estados = dashboardRepository.buscarUltimaRevisaoPorFlashcard(deckId);
		int total = estados.size();

		if (total == 0) {
			return new DashboardResponseDTO(0, BigDecimal.ZERO.setScale(2), BigDecimal.ZERO.setScale(2));
		}

		long dominados = estados.stream().filter(this::estaDominado).count();
		long emRisco = estados.stream().filter(this::estaEmRisco).count();

		return new DashboardResponseDTO(total, calcularPercentual(dominados, total), calcularPercentual(emRisco, total));
	}

	/**
	 * RN14: flashcard "dominado" = repeticoes >= 3 (da última revisão) E
	 * última qualidade_resposta >= 4. Flashcard nunca revisado não é
	 * dominado.
	 */
	private boolean estaDominado(UltimaRevisaoProjecao estado) {
		return estado.repeticoes() != null && estado.repeticoes() >= 3
				&& estado.qualidadeResposta() != null && estado.qualidadeResposta() >= 4;
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
	private boolean estaEmRisco(UltimaRevisaoProjecao estado) {
		if (estado.qualidadeResposta() == null) {
			return false;
		}

		boolean ultimaQualidadeBaixa = estado.qualidadeResposta() < 3;
		boolean atrasadoHaMuitoTempo = estado.proximaRevisao() != null
				&& estado.proximaRevisao().isBefore(LocalDate.now().minusDays(DIAS_PARA_CONSIDERAR_EM_RISCO_POR_ATRASO));

		return ultimaQualidadeBaixa || atrasadoHaMuitoTempo;
	}

	private BigDecimal calcularPercentual(long quantidade, int total) {
		return BigDecimal.valueOf(quantidade)
				.multiply(BigDecimal.valueOf(100))
				.divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
	}

}
