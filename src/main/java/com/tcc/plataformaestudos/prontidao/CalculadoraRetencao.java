package com.tcc.plataformaestudos.prontidao;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * UC31/RN40 — núcleo matemático da previsão de prontidão para prova, isolado
 * numa classe pura e estática (mesmo espírito de
 * {@link com.tcc.plataformaestudos.dashboard.CriterioDesempenhoFlashcard}):
 * sem estado, testável isoladamente, sem se misturar à orquestração de
 * {@code ProntidaoProvaService}.
 *
 * <p>Modelo adotado (RN40 não define a fórmula exata — ver
 * {@code Docs/extensao-prontidao-prova.md} §3): curva de esquecimento
 * exponencial {@code R(t) = 0.9 ^ (t / intervalo)}, onde {@code t} é o
 * número de dias entre a última revisão real e a data-alvo, e
 * {@code intervalo} é o {@code intervalo_dias} vigente nessa revisão.
 * Premissa: o próprio SM-2 (RN09) calibra {@code intervalo_dias} para que a
 * retenção esperada na data da próxima revisão seja de aproximadamente 90% —
 * mesma premissa de "retenção-alvo" usada por implementações de mercado de
 * repetição espaçada (ex.: cálculo de "true retention" do Anki) para
 * aproximar uma curva de memória sem precisar de um modelo mais sofisticado
 * (ex.: FSRS), fora do escopo deste TCC. Em {@code t = intervalo}, a fórmula
 * devolve exatamente {@code R = 0.9}; em {@code t = 0}, {@code R = 1}.
 */
public final class CalculadoraRetencao {

	private static final double RETENCAO_CALIBRADA_NO_INTERVALO = 0.9;

	private CalculadoraRetencao() {
	}

	/**
	 * Retenção estimada (0.0 a 1.0) na {@code dataAlvo}, a partir da última
	 * revisão real do flashcard.
	 *
	 * <p>{@code dataRevisao == null} (flashcard nunca revisado) devolve
	 * {@code 0.0} — decisão deliberadamente diferente de RN14 (onde um
	 * flashcard nunca revisado é neutro): aqui a semântica é "o que
	 * realisticamente será lembrado na prova", e um flashcard nunca estudado
	 * tem chance real de ser esquecido.
	 *
	 * <p>{@code t} negativo (data-alvo já ultrapassada pela última revisão no
	 * momento da consulta) é limitado a zero antes de entrar na fórmula —
	 * nunca gera retenção acima de 100%. {@code intervaloDias <= 0} é tratado
	 * como 1 (defesa contra divisão por zero; RN09/RN11 sempre gravam pelo
	 * menos 1 após uma revisão real).
	 */
	public static double estimarRetencao(LocalDateTime dataRevisao, Integer intervaloDias, LocalDate dataAlvo) {
		if (dataRevisao == null) {
			return 0.0;
		}

		long diasDecorridos = Math.max(0, ChronoUnit.DAYS.between(dataRevisao.toLocalDate(), dataAlvo));
		int intervalo = (intervaloDias == null || intervaloDias <= 0) ? 1 : intervaloDias;

		return Math.pow(RETENCAO_CALIBRADA_NO_INTERVALO, diasDecorridos / (double) intervalo);
	}

}
