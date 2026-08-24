package com.tcc.plataformaestudos.quiz;

import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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

@Entity
@Table(name = "questao_quiz")
@Getter
@Setter
@NoArgsConstructor
public class QuestaoQuiz {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "quiz_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Quiz quiz;

	@Column(name = "enunciado", nullable = false, length = 1000)
	private String enunciado;

	@Convert(converter = AlternativasConverter.class)
	@Column(name = "alternativas", nullable = false, columnDefinition = "TEXT")
	private List<AlternativaQuiz> alternativas;

	@Column(name = "resposta_correta", nullable = false, length = 500)
	private String respostaCorreta;

}
