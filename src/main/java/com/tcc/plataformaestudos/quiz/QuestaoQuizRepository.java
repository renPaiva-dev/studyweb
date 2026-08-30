package com.tcc.plataformaestudos.quiz;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestaoQuizRepository extends JpaRepository<QuestaoQuiz, Long> {

	/** UC24/RN31 — todas as questões de um conjunto de quizzes numa única consulta (evita N+1 por quiz). */
	List<QuestaoQuiz> findByQuizIdIn(List<Long> quizIds);

}
