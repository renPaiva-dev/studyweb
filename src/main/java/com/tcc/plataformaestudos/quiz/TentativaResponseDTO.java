package com.tcc.plataformaestudos.quiz;

import java.math.BigDecimal;

public record TentativaResponseDTO(BigDecimal pontuacao, int acertos, int total) {
}
