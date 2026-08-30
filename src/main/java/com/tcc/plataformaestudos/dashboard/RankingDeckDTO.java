package com.tcc.plataformaestudos.dashboard;

import java.math.BigDecimal;

public record RankingDeckDTO(Long deckId, String titulo, BigDecimal percentualDominado, BigDecimal percentualEmRisco) {
}
