package com.tcc.plataformaestudos.quiz;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.tcc.plataformaestudos.deck.Deck;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "quiz")
@Getter
@Setter
@NoArgsConstructor
public class Quiz {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "deck_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Deck deck;

	@Column(name = "titulo", nullable = false, length = 150)
	private String titulo;

	/** UC10 (DETERMINISTICO) vs UC27/RN35 (IA_PERSONALIZADA). */
	@Enumerated(EnumType.STRING)
	@Column(name = "origem", nullable = false, length = 20)
	private OrigemQuiz origem = OrigemQuiz.DETERMINISTICO;

	/** UC27/RN35 — só preenchido quando origem=IA_PERSONALIZADA. */
	@Enumerated(EnumType.STRING)
	@Column(name = "estilo", length = 20)
	private EstiloProva estilo;

	@Column(name = "criado_em", nullable = false)
	private LocalDateTime criadoEm;

	/**
	 * RN13: excluir o quiz remove em cascata suas questões e tentativas
	 * (mesmo padrão de {@code Deck#materiais}/{@code Deck#flashcards}).
	 */
	@OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<QuestaoQuiz> questoes = new ArrayList<>();

	@OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<TentativaQuiz> tentativas = new ArrayList<>();

	@PrePersist
	private void prePersist() {
		if (criadoEm == null) {
			criadoEm = LocalDateTime.now();
		}
	}

}
