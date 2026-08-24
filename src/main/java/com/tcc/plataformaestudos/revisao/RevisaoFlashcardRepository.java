package com.tcc.plataformaestudos.revisao;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.tcc.plataformaestudos.flashcard.Flashcard;

public interface RevisaoFlashcardRepository extends JpaRepository<RevisaoFlashcard, Long> {

	/**
	 * Recupera o estado anterior (EF, intervalo, repetições) de um flashcard:
	 * o registro de revisão mais recente. Usado tanto para calcular a próxima
	 * revisão (UC09) quanto para ordenar a fila de estudo (UC07).
	 */
	Optional<RevisaoFlashcard> findFirstByFlashcardIdOrderByDataRevisaoDesc(Long flashcardId);

	/**
	 * RN10 — flashcards de um deck pendentes de revisão: aqueles cuja última
	 * revisão tem {@code proxima_revisao <= hoje}, ou que nunca foram
	 * revisados (primeira vez).
	 */
	@Query("""
			SELECT f FROM Flashcard f
			WHERE f.deck.id = :deckId
			AND (
				NOT EXISTS (SELECT 1 FROM RevisaoFlashcard r WHERE r.flashcard = f)
				OR EXISTS (
					SELECT 1 FROM RevisaoFlashcard ultima
					WHERE ultima.flashcard = f
					AND ultima.dataRevisao = (
						SELECT MAX(r2.dataRevisao) FROM RevisaoFlashcard r2 WHERE r2.flashcard = f
					)
					AND ultima.proximaRevisao <= :hoje
				)
			)
			""")
	List<Flashcard> findFlashcardsPendentesDeRevisao(@Param("deckId") Long deckId, @Param("hoje") LocalDate hoje);

}
