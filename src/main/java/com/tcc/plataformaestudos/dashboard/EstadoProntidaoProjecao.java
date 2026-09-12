package com.tcc.plataformaestudos.dashboard;

import java.time.LocalDateTime;

/**
 * Mesma projeção de {@link UltimaRevisaoComTopicoProjecao} (última revisão de
 * cada flashcard do deck, com tópico), acrescida de {@code dataRevisao} e
 * {@code intervaloDias} — necessários para
 * {@code CalculadoraRetencao.estimarRetencao} (UC31/RN40), que a projeção do
 * dashboard não traz por não precisar deles.
 */
public record EstadoProntidaoProjecao(
		Long flashcardId,
		String topico,
		LocalDateTime dataRevisao,
		Integer intervaloDias) {
}
