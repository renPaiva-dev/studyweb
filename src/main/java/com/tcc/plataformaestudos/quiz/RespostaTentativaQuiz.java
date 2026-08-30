package com.tcc.plataformaestudos.quiz;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * UC27/RN36 — registro por questão de uma {@link TentativaQuiz}: o que o
 * usuário respondeu e se acertou, permitindo montar depois a revisão
 * questão-a-questão no histórico de provas (algo que a pontuação agregada de
 * TentativaQuiz, por si só, não permite reconstruir).
 */
@Entity
@Table(name = "resposta_tentativa_quiz")
@Getter
@Setter
@NoArgsConstructor
public class RespostaTentativaQuiz {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "tentativa_quiz_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private TentativaQuiz tentativa;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "questao_quiz_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private QuestaoQuiz questao;

	@Column(name = "alternativa_escolhida", nullable = false, length = 500)
	private String alternativaEscolhida;

	@Column(name = "correta", nullable = false)
	private boolean correta;

}
