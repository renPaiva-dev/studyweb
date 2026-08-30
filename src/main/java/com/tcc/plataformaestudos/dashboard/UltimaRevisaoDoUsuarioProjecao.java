package com.tcc.plataformaestudos.dashboard;

import java.time.LocalDate;

/**
 * Mesma projeção de {@link UltimaRevisaoProjecao}, acrescida do deck a que o
 * flashcard pertence — usada pelo dashboard geral consolidado (UC20/RN25)
 * para classificar dominado/em risco de todos os decks do usuário numa
 * única consulta.
 */
public record UltimaRevisaoDoUsuarioProjecao(
		Long deckId,
		String deckTitulo,
		Integer repeticoes,
		Integer qualidadeResposta,
		LocalDate proximaRevisao) {
}
