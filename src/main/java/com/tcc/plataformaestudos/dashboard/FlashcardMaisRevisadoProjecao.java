package com.tcc.plataformaestudos.dashboard;

/**
 * Projeção de um flashcard e sua contagem total de revisões, usada pelo
 * ranking de atividade (UC15/RN20).
 */
public record FlashcardMaisRevisadoProjecao(Long flashcardId, String pergunta, Long totalRevisoes) {
}
