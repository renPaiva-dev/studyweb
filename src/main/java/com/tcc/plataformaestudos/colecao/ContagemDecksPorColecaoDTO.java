package com.tcc.plataformaestudos.colecao;

/**
 * Projeção usada por {@code DeckRepository#contarPorColecaoIdAgrupado} para
 * trazer, numa única consulta agregada (GROUP BY colecao_id), a contagem de
 * decks de todas as coleções de um usuário — evita N+1 em
 * {@code ColecaoService#listar} (mesmo padrão de
 * {@code ContagemFlashcardsPorDeckDTO}, usado por {@code DeckService#listar}).
 */
public record ContagemDecksPorColecaoDTO(Long colecaoId, Long total) {
}
