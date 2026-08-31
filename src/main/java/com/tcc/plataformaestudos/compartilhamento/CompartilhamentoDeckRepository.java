package com.tcc.plataformaestudos.compartilhamento;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CompartilhamentoDeckRepository extends JpaRepository<CompartilhamentoDeck, Long> {

	Optional<CompartilhamentoDeck> findByDeckId(Long deckId);

	Optional<CompartilhamentoDeck> findByTokenAndAtivoTrue(String token);

}
