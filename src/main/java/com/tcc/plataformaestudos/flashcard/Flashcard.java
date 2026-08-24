package com.tcc.plataformaestudos.flashcard;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.revisao.RevisaoFlashcard;

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
@Table(name = "flashcard")
@Getter
@Setter
@NoArgsConstructor
public class Flashcard {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "deck_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Deck deck;

	@Column(name = "pergunta", nullable = false, length = 1000)
	private String pergunta;

	@Column(name = "resposta", nullable = false, length = 1000)
	private String resposta;

	@Column(name = "mnemonico", length = 500)
	private String mnemonico;

	@Enumerated(EnumType.STRING)
	@Column(name = "origem", nullable = false, length = 10)
	private OrigemFlashcard origem = OrigemFlashcard.MANUAL;

	@Column(name = "criado_em", nullable = false)
	private LocalDateTime criadoEm;

	/**
	 * RN13: excluir um flashcard remove em cascata seu histórico de revisões
	 * (mesmo padrão de {@code Deck#materiais}/{@code Deck#flashcards}).
	 */
	@OneToMany(mappedBy = "flashcard", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<RevisaoFlashcard> revisoes = new ArrayList<>();

	@PrePersist
	private void prePersist() {
		if (criadoEm == null) {
			criadoEm = LocalDateTime.now();
		}
	}

}
