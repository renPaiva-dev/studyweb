package com.tcc.plataformaestudos.colecao;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ColecaoRepository extends JpaRepository<Colecao, Long> {

	List<Colecao> findByUsuarioId(Long usuarioId);

	Optional<Colecao> findByIdAndUsuarioId(Long id, Long usuarioId);

}
