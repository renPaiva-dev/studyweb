package com.tcc.plataformaestudos.dashboard;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
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

	/**
	 * UC15/RN20 — evolução temporal: data e qualidade de cada revisão do
	 * deck a partir de {@code desde}, sem agregação (o agrupamento por dia é
	 * feito no service — ver {@link RevisaoBrutaProjecao}).
	 */
	@Query("""
			SELECT new com.tcc.plataformaestudos.dashboard.RevisaoBrutaProjecao(r.dataRevisao, r.qualidadeResposta)
			FROM RevisaoFlashcard r
			WHERE r.flashcard.deck.id = :deckId
			AND r.dataRevisao >= :desde
			""")
	List<RevisaoBrutaProjecao> buscarRevisoesParaEvolucao(@Param("deckId") Long deckId, @Param("desde") LocalDateTime desde);

	/**
	 * Mesma lógica de {@link #buscarUltimaRevisaoPorFlashcard(Long)} (última
	 * revisão por flashcard, via subquery correlacionada no LEFT JOIN),
	 * trazendo também o tópico — usada pelo detalhamento por tópico
	 * (UC15/RN20/RN17).
	 */
	@Query("""
			SELECT new com.tcc.plataformaestudos.dashboard.UltimaRevisaoComTopicoProjecao(
				f.id, f.topico, ultima.repeticoes, ultima.qualidadeResposta, ultima.proximaRevisao)
			FROM Flashcard f
			LEFT JOIN f.revisoes ultima
				ON ultima.dataRevisao = (
					SELECT MAX(r2.dataRevisao) FROM RevisaoFlashcard r2 WHERE r2.flashcard = f
				)
			WHERE f.deck.id = :deckId
			""")
	List<UltimaRevisaoComTopicoProjecao> buscarUltimaRevisaoComTopicoPorFlashcard(@Param("deckId") Long deckId);

	/**
	 * UC15/RN20 — top N flashcards com mais revisões, ordenados no banco
	 * (evita trazer todo o histórico para ordenar/truncar em Java). O limite
	 * é aplicado via {@code pageable} (ex.: {@code PageRequest.of(0, 5)}).
	 */
	@Query("""
			SELECT new com.tcc.plataformaestudos.dashboard.FlashcardMaisRevisadoProjecao(
				f.id, f.pergunta, count(r))
			FROM Flashcard f
			JOIN f.revisoes r
			WHERE f.deck.id = :deckId
			GROUP BY f.id, f.pergunta
			ORDER BY count(r) DESC
			""")
	List<FlashcardMaisRevisadoProjecao> buscarFlashcardsMaisRevisados(@Param("deckId") Long deckId, Pageable pageable);

	/**
	 * UC15/RN20 — datas de todas as revisões do deck, para a distribuição por
	 * dia da semana. A agregação por {@link java.time.DayOfWeek} é feita no
	 * service: não há função portável de "dia da semana" em JPQL puro, e o
	 * volume por deck é pequeno o bastante para não justificar uma query
	 * nativa específica de dialeto.
	 */
	@Query("""
			SELECT r.dataRevisao
			FROM RevisaoFlashcard r
			WHERE r.flashcard.deck.id = :deckId
			""")
	List<LocalDateTime> buscarDatasDeRevisoes(@Param("deckId") Long deckId);

	/**
	 * UC20/RN25 — mesma lógica de {@link #buscarUltimaRevisaoPorFlashcard(Long)}
	 * (última revisão por flashcard), mas para todos os decks de um usuário
	 * numa única consulta — evita um loop de uma query por deck no dashboard
	 * geral consolidado.
	 */
	@Query("""
			SELECT new com.tcc.plataformaestudos.dashboard.UltimaRevisaoDoUsuarioProjecao(
				f.deck.id, f.deck.titulo, ultima.repeticoes, ultima.qualidadeResposta, ultima.proximaRevisao)
			FROM Flashcard f
			LEFT JOIN f.revisoes ultima
				ON ultima.dataRevisao = (
					SELECT MAX(r2.dataRevisao) FROM RevisaoFlashcard r2 WHERE r2.flashcard = f
				)
			WHERE f.deck.usuario.id = :usuarioId
			""")
	List<UltimaRevisaoDoUsuarioProjecao> buscarUltimaRevisaoPorUsuario(@Param("usuarioId") Long usuarioId);

	/**
	 * UC20/RN25 — datas de todas as revisões do usuário, em qualquer deck,
	 * para o cálculo do streak de dias consecutivos.
	 */
	@Query("""
			SELECT r.dataRevisao
			FROM RevisaoFlashcard r
			WHERE r.usuario.id = :usuarioId
			""")
	List<LocalDateTime> buscarDatasDeRevisoesPorUsuario(@Param("usuarioId") Long usuarioId);

}
