package com.tcc.plataformaestudos.quiz;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RespostaTentativaQuizRepository extends JpaRepository<RespostaTentativaQuiz, Long> {

	/**
	 * UC28/RN36 (B12) — respostas de uma única tentativa já com a questão
	 * carregada (JOIN FETCH), numa única consulta em lote. Complementa
	 * {@link TentativaQuizRepository#buscarDetalheDoUsuario} — como o
	 * Hibernate não permite duas coleções {@code List} no fetch de uma única
	 * query (quiz.questoes e t.respostas), a questão de cada resposta era
	 * carregada por lazy-load individual (N+1) ao montar a revisão
	 * questão-a-questão. As respostas retornadas aqui são as mesmas instâncias
	 * já carregadas por {@code buscarDetalheDoUsuario} (mesmo contexto de
	 * persistência) — esta consulta só popula o fetch da questão de cada uma.
	 */
	@Query("SELECT rq FROM RespostaTentativaQuiz rq JOIN FETCH rq.questao WHERE rq.tentativa.id = :tentativaId")
	List<RespostaTentativaQuiz> buscarComQuestaoPorTentativa(@Param("tentativaId") Long tentativaId);

	/**
	 * UC24/RN31 (B16) — respostas de várias tentativas (exportação de dados),
	 * já com a questão carregada, numa única consulta em lote (mesmo padrão de
	 * {@code buscarEmLote} já usado em {@code ExportacaoDadosService}, evita
	 * N+1 por tentativa).
	 */
	@Query("SELECT rq FROM RespostaTentativaQuiz rq JOIN FETCH rq.questao WHERE rq.tentativa.id IN :tentativaIds")
	List<RespostaTentativaQuiz> buscarComQuestaoPorTentativas(@Param("tentativaIds") List<Long> tentativaIds);

}
