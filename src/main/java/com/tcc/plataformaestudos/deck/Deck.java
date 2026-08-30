package com.tcc.plataformaestudos.deck;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.material.MaterialOrigem;
import com.tcc.plataformaestudos.quiz.Quiz;
import com.tcc.plataformaestudos.usuario.Usuario;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "deck")
@Getter
@Setter
@NoArgsConstructor
public class Deck {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** RN32: defesa em duas camadas (JPA via Usuario#decks + banco via V6) - ver Deck.java doc. */
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "usuario_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Usuario usuario;

	@Column(name = "titulo", nullable = false, length = 150)
	private String titulo;

	@Column(name = "descricao", length = 500)
	private String descricao;

	@Column(name = "criado_em", nullable = false)
	private LocalDateTime criadoEm;

	@Column(name = "atualizado_em", nullable = false)
	private LocalDateTime atualizadoEm;

	/**
	 * RN13: excluir o deck remove em cascata seus materiais, flashcards e
	 * quizzes (que, por sua vez, cascateiam para suas próprias questões e
	 * tentativas — ver {@code Quiz#questoes}/{@code Quiz#tentativas}).
	 */
	@OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<MaterialOrigem> materiais = new ArrayList<>();

	@OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Flashcard> flashcards = new ArrayList<>();

	@OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Quiz> quizzes = new ArrayList<>();

	@PrePersist
	private void prePersist() {
		LocalDateTime agora = LocalDateTime.now();
		if (criadoEm == null) {
			criadoEm = agora;
		}
		if (atualizadoEm == null) {
			atualizadoEm = agora;
		}
	}

	@PreUpdate
	private void preUpdate() {
		atualizadoEm = LocalDateTime.now();
	}

}
