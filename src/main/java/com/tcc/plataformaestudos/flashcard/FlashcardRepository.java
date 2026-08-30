package com.tcc.plataformaestudos.flashcard;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {

	List<Flashcard> findByDeckId(Long deckId);

	long countByDeckId(Long deckId);

	Optional<Flashcard> findByIdAndDeckUsuarioId(Long id, Long usuarioId);

	/** UC24/RN31 — todos os flashcards de um conjunto de decks numa única consulta (evita N+1 por deck). */
	List<Flashcard> findByDeckIdIn(List<Long> deckIds);

	/** UC27 — valida que os flashcardIds escolhidos para a prova pertencem ao deck informado (RN01). */
	List<Flashcard> findByIdInAndDeckId(List<Long> ids, Long deckId);

}
