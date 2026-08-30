package com.tcc.plataformaestudos.quiz;

/**
 * Total de tentativas e pontuação média de um usuário, entre todos os seus
 * quizzes — usada pelo dashboard geral consolidado (UC20/RN25).
 * {@code pontuacaoMedia} é {@code null} quando não há nenhuma tentativa
 * (AVG sobre zero linhas é nulo em SQL).
 */
public record EstatisticaTentativaProjecao(Long totalTentativas, Double pontuacaoMedia) {
}
