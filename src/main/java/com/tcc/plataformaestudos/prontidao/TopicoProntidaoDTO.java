package com.tcc.plataformaestudos.prontidao;

import java.math.BigDecimal;

public record TopicoProntidaoDTO(
		String topico,
		int totalFlashcards,
		BigDecimal retencaoMediaEstimada,
		int flashcardsPrecisandoRevisao) {
}
