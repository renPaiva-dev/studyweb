package com.tcc.plataformaestudos.colecao;

/** UC33 — resumo de um deck dentro do detalhe de uma coleção (GET /api/colecoes/{id}). */
public record DeckResumoDTO(Long id, String titulo, int totalFlashcards) {
}
