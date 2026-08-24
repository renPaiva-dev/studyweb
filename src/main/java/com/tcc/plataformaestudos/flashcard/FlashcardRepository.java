package com.tcc.plataformaestudos.flashcard;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {

	List<Flashcard> findByDeckId(Long deckId);

	Optional<Flashcard> findByIdAndDeckUsuarioId(Long id, Long usuarioId);

}
