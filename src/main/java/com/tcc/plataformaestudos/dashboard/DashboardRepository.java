package com.tcc.plataformaestudos.dashboard;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.tcc.plataformaestudos.flashcard.Flashcard;

/**
 * Repositório dedicado ao UC11 (dashboard): não estende {@code JpaRepository}
 * porque não há CRUD aqui, apenas a consulta agregada abaixo — evita expor
 * métodos de escrita/leitura genéricos que este caso de uso não usa.
 */
public interface DashboardRepository extends Repository<Flashcard, Long> {

	/**
	 * Traz, numa única consulta (sem N+1), a última revisão de cada
	 * flashcard de um deck — "última" definida pelo maior {@code dataRevisao}
	 * por flashcard. Flashcards nunca revisados aparecem com os campos de
	 * revisão nulos (LEFT JOIN), em vez de ficarem de fora do resultado.
	 */
	@Query("""
			SELECT new com.tcc.plataformaestudos.dashboard.UltimaRevisaoProjecao(
				f.id, ultima.repeticoes, ultima.qualidadeResposta, ultima.proximaRevisao)
			FROM Flashcard f
			LEFT JOIN f.revisoes ultima
				ON ultima.dataRevisao = (
					SELECT MAX(r2.dataRevisao) FROM RevisaoFlashcard r2 WHERE r2.flashcard = f
				)
			WHERE f.deck.id = :deckId
			""")
	List<UltimaRevisaoProjecao> buscarUltimaRevisaoPorFlashcard(@Param("deckId") Long deckId);

}
