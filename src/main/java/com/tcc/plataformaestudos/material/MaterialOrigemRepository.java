package com.tcc.plataformaestudos.material;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MaterialOrigemRepository extends JpaRepository<MaterialOrigem, Long> {

	Optional<MaterialOrigem> findByIdAndDeckUsuarioId(Long id, Long usuarioId);

	List<MaterialOrigem> findByDeckIdOrderByCriadoEmDesc(Long deckId);

}
