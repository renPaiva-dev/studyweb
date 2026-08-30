package com.tcc.plataformaestudos.quiz;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

	Optional<Quiz> findByIdAndDeckUsuarioId(Long id, Long usuarioId);

	/** UC24/RN31 — todos os quizzes de um conjunto de decks numa única consulta (evita N+1 por deck). */
	List<Quiz> findByDeckIdIn(List<Long> deckIds);

}
