package com.tcc.plataformaestudos.dashboard;

import java.time.LocalDate;

/**
 * Ponto único (boas-praticas-backend.md §3) dos critérios de "dominado" e
 * "em risco" (RN14), extraído de {@link DashboardService} para ser
 * reaproveitado também por {@code RecomendacaoEstudoService} (UC13/RN18),
 * sem duplicar a regra em dois lugares. Métodos static e sem estado — cada
 * um recebe só os dados de que precisa, vindos de qualquer projeção que
 * traga repetições/qualidade/próxima revisão de um flashcard.
 */
public final class CriterioDesempenhoFlashcard {

	private static final int DIAS_PARA_CONSIDERAR_EM_RISCO_POR_ATRASO = 7;

	private CriterioDesempenhoFlashcard() {
	}

	/**
	 * RN14: flashcard "dominado" = repeticoes >= 3 (da última revisão) E
	 * última qualidade_resposta >= 4. Flashcard nunca revisado não é
	 * dominado.
	 */
	public static boolean estaDominado(Integer repeticoes, Integer qualidadeResposta) {
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
	public static boolean estaEmRisco(Integer qualidadeResposta, LocalDate proximaRevisao) {
		if (qualidadeResposta == null) {
			return false;
		}

		boolean ultimaQualidadeBaixa = qualidadeResposta < 3;
		boolean atrasadoHaMuitoTempo = proximaRevisao != null
				&& proximaRevisao.isBefore(LocalDate.now().minusDays(DIAS_PARA_CONSIDERAR_EM_RISCO_POR_ATRASO));

		return ultimaQualidadeBaixa || atrasadoHaMuitoTempo;
	}

}
