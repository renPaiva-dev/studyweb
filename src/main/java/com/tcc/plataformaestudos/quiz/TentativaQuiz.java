package com.tcc.plataformaestudos.quiz;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
import jakarta.persistence.Table;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tentativa_quiz")
@Getter
@Setter
@NoArgsConstructor
public class TentativaQuiz {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "quiz_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Quiz quiz;

	/** RN32: defesa em duas camadas (JPA via Usuario#decks, transitiva por Deck->Quiz + banco via V6). */
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "usuario_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Usuario usuario;

	@Column(name = "data_tentativa", nullable = false)
	private LocalDateTime dataTentativa;

	@Column(name = "pontuacao", nullable = false, precision = 5, scale = 2)
	private BigDecimal pontuacao;

	/** UC27/RN36 — detalhamento por questão, para a revisão no histórico de provas. */
	@OneToMany(mappedBy = "tentativa", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<RespostaTentativaQuiz> respostas = new ArrayList<>();

	@PrePersist
	private void prePersist() {
		if (dataTentativa == null) {
			dataTentativa = LocalDateTime.now();
		}
	}

}
