package com.tcc.plataformaestudos.quiz;

/**
 * Uma alternativa de {@code QuestaoQuiz}: o texto exibido e se é a
 * alternativa correta. Nunca é exposta como tal para o frontend — a API só
 * devolve os textos das alternativas (ver {@link QuestaoResponseDTO}), sem
 * revelar qual delas é a correta.
 */
public record AlternativaQuiz(String texto, boolean correta) {
}
