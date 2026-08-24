package com.tcc.plataformaestudos.quiz;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

	Optional<Quiz> findByIdAndDeckUsuarioId(Long id, Long usuarioId);

}
