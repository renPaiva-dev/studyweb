package com.tcc.plataformaestudos.quiz;

import java.math.BigDecimal;
import java.util.List;

/** {@code questoes} revela a revisão completa (resposta correta, o que foi escolhido, explicação) — só disponível após responder. */
public record TentativaResponseDTO(BigDecimal pontuacao, int acertos, int total, List<QuestaoRevisadaDTO> questoes) {
}
