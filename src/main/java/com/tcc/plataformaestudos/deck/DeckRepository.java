package com.tcc.plataformaestudos.deck;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DeckRepository extends JpaRepository<Deck, Long> {

	List<Deck> findByUsuarioId(Long usuarioId);

	Optional<Deck> findByIdAndUsuarioId(Long id, Long usuarioId);

}
