package com.tcc.plataformaestudos.flashcard;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {

	List<Flashcard> findByDeckId(Long deckId);

	long countByDeckId(Long deckId);

	Optional<Flashcard> findByIdAndDeckUsuarioId(Long id, Long usuarioId);

	/** UC24/RN31 — todos os flashcards de um conjunto de decks numa única consulta (evita N+1 por deck). */
	List<Flashcard> findByDeckIdIn(List<Long> deckIds);

	/** UC27 — valida que os flashcardIds escolhidos para a prova pertencem ao deck informado (RN01). */
	List<Flashcard> findByIdInAndDeckId(List<Long> ids, Long deckId);

	/**
	 * UC08/UC09/RN09/RN11 — trava a linha do flashcard (lock pessimista de
	 * escrita) antes de ler+recalcular seu estado de repetição espaçada
	 * (SM-2), em {@link com.tcc.plataformaestudos.revisao.RevisaoService#avaliarResposta}.
	 * Serializa avaliações concorrentes do mesmo flashcard: sem isso, duas
	 * requisições quase simultâneas leem o mesmo estado anterior e calculam
	 * independentemente, corrompendo o algoritmo. A linha sempre existe (o
	 * flashcard já foi validado por RN01 antes desta chamada), então o lock
	 * nela — em vez de na última {@code RevisaoFlashcard}, que pode não
	 * existir ainda na primeira revisão — serializa mesmo a primeira revisão.
	 */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("SELECT f FROM Flashcard f WHERE f.id = :id")
	Optional<Flashcard> findByIdParaAtualizacaoDeRevisao(@Param("id") Long id);

	/**
	 * B4 — contagem de flashcards de todos os decks informados numa única
	 * consulta agregada (GROUP BY), usada por {@code DeckService#listar} em
	 * vez de uma query {@code COUNT} separada por deck (N+1).
	 */
	@Query("SELECT new com.tcc.plataformaestudos.flashcard.ContagemFlashcardsPorDeckDTO(f.deck.id, COUNT(f)) "
			+ "FROM Flashcard f WHERE f.deck.id IN :deckIds GROUP BY f.deck.id")
	List<ContagemFlashcardsPorDeckDTO> contarPorDeckIdAgrupado(@Param("deckIds") List<Long> deckIds);

}
