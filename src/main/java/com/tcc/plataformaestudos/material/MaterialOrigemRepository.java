package com.tcc.plataformaestudos.material;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MaterialOrigemRepository extends JpaRepository<MaterialOrigem, Long> {

	Optional<MaterialOrigem> findByIdAndDeckUsuarioId(Long id, Long usuarioId);

	List<MaterialOrigem> findByDeckIdOrderByCriadoEmDesc(Long deckId);

	/** UC24/RN31 — todos os materiais de um conjunto de decks numa única consulta (evita N+1 por deck). */
	List<MaterialOrigem> findByDeckIdIn(List<Long> deckIds);

	/**
	 * UC14/RN19 — material mais recente e utilizável (texto já extraído) de
	 * um deck, para ancorar a explicação de um flashcard nesse texto. Ver
	 * Docs/extensao-explicacao-rag-lite.md §3: não há vínculo individual
	 * flashcard→material, então usa-se o mais recente do deck como
	 * aproximação deliberada.
	 */
	Optional<MaterialOrigem> findFirstByDeckIdAndStatusProcessamentoAndTextoExtraidoIsNotNullOrderByCriadoEmDesc(
			Long deckId, StatusProcessamento statusProcessamento);

}
