package com.tcc.plataformaestudos.deck;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.tcc.plataformaestudos.colecao.ContagemDecksPorColecaoDTO;

public interface DeckRepository extends JpaRepository<Deck, Long> {

	/**
	 * RN42/UC33 — `colecao` (LAZY) vem com `JOIN FETCH`: sem isso,
	 * {@code DeckResponseDTO#fromEntity} acessando `colecaoNome` para cada
	 * deck da lista disparia um N+1 (mesma preocupação de B4 para contagem de
	 * flashcards, aqui resolvida via fetch em vez de mapa agregado por não
	 * haver agregação envolvida).
	 */
	@Query("SELECT d FROM Deck d LEFT JOIN FETCH d.colecao WHERE d.usuario.id = :usuarioId")
	List<Deck> findByUsuarioId(@Param("usuarioId") Long usuarioId);

	Optional<Deck> findByIdAndUsuarioId(Long id, Long usuarioId);

	/** UC33 — decks de uma coleção (já garantidamente do mesmo dono da coleção, validado na associação). */
	List<Deck> findByColecaoId(Long colecaoId);

	/**
	 * UC33 — contagem de decks de todas as coleções informadas numa única
	 * consulta agregada (GROUP BY), evita N+1 em {@code ColecaoService#listar}
	 * (mesmo padrão de {@code FlashcardRepository#contarPorDeckIdAgrupado}).
	 */
	@Query("SELECT new com.tcc.plataformaestudos.colecao.ContagemDecksPorColecaoDTO(d.colecao.id, COUNT(d)) "
			+ "FROM Deck d WHERE d.colecao.id IN :colecaoIds GROUP BY d.colecao.id")
	List<ContagemDecksPorColecaoDTO> contarPorColecaoIdAgrupado(@Param("colecaoIds") List<Long> colecaoIds);

}
