package com.tcc.plataformaestudos.quiz;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TentativaQuizRepository extends JpaRepository<TentativaQuiz, Long> {

	/** UC24/RN31 — todas as tentativas de um conjunto de quizzes numa única consulta (evita N+1 por quiz). */
	List<TentativaQuiz> findByQuizIdIn(List<Long> quizIds);

	/** UC28/RN36 — histórico de provas do usuário, já com quiz e respostas carregados (evita N+1). */
	@Query("""
			SELECT DISTINCT t FROM TentativaQuiz t
			JOIN FETCH t.quiz
			LEFT JOIN FETCH t.respostas
			WHERE t.usuario.id = :usuarioId
			ORDER BY t.dataTentativa DESC
			""")
	List<TentativaQuiz> buscarHistoricoDoUsuario(@Param("usuarioId") Long usuarioId);

	/**
	 * UC28/RN01 — uma tentativa específica, com quiz e respostas carregados,
	 * escopada ao usuário autenticado. As questões do quiz (quiz.questoes)
	 * não entram no fetch join aqui de propósito — combinada com
	 * t.respostas seria um segundo "bag" na mesma consulta (Hibernate não
	 * permite duas coleções List no fetch de uma única query); ficam para
	 * lazy-load posterior, o que custa só mais uma consulta.
	 *
	 * <p><b>Atenção (B12):</b> embora esta consulta busque uma única
	 * tentativa, {@code t.respostas} é uma <i>coleção</i> — cada
	 * {@code RespostaTentativaQuiz} dela ainda referencia
	 * {@code questao} por lazy-load, então acessar {@code resposta.getQuestao()}
	 * para cada resposta (ex.: ao montar a revisão questão-a-questão) dispara
	 * uma query extra por questão (N+1 real, uma prova com 5-20 questões =
	 * 5-20 queries extras). Use
	 * {@link RespostaTentativaQuizRepository#buscarComQuestaoPorTentativa(Long)}
	 * antes de acessar {@code questao} das respostas desta tentativa.
	 */
	@Query("""
			SELECT t FROM TentativaQuiz t
			JOIN FETCH t.quiz
			LEFT JOIN FETCH t.respostas
			WHERE t.id = :tentativaId AND t.usuario.id = :usuarioId
			""")
	Optional<TentativaQuiz> buscarDetalheDoUsuario(@Param("tentativaId") Long tentativaId, @Param("usuarioId") Long usuarioId);

	/**
	 * UC20/RN25 — total de tentativas e pontuação média de um usuário, entre
	 * todos os seus quizzes/provas, numa única consulta agregada.
	 */
	@Query("""
			SELECT new com.tcc.plataformaestudos.quiz.EstatisticaTentativaProjecao(count(t), avg(t.pontuacao))
			FROM TentativaQuiz t
			WHERE t.usuario.id = :usuarioId
			""")
	EstatisticaTentativaProjecao calcularEstatisticasPorUsuario(@Param("usuarioId") Long usuarioId);

}
