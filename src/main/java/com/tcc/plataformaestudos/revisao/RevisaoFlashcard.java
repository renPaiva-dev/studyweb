package com.tcc.plataformaestudos.revisao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.usuario.Usuario;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * UC09 — um registro por revisão feita (histórico completo, nunca
 * atualizado), com o estado do SM-2 calculado naquele momento. O estado
 * "atual" de um flashcard é sempre o registro mais recente
 * (ver {@link RevisaoFlashcardRepository#findFirstByFlashcardIdOrderByDataRevisaoDesc(Long)}).
 */
@Entity
@Table(name = "revisao_flashcard")
@Getter
@Setter
@NoArgsConstructor
public class RevisaoFlashcard {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "flashcard_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Flashcard flashcard;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "usuario_id", nullable = false)
	private Usuario usuario;

	@Column(name = "data_revisao", nullable = false)
	private LocalDateTime dataRevisao;

	@Column(name = "qualidade_resposta", nullable = false)
	private Integer qualidadeResposta;

	@Column(name = "fator_facilidade", nullable = false, precision = 3, scale = 2)
	private BigDecimal fatorFacilidade;

	@Column(name = "intervalo_dias", nullable = false)
	private Integer intervaloDias;

	@Column(name = "repeticoes", nullable = false)
	private Integer repeticoes;

	@Column(name = "proxima_revisao", nullable = false)
	private LocalDate proximaRevisao;

	@PrePersist
	private void prePersist() {
		if (dataRevisao == null) {
			dataRevisao = LocalDateTime.now();
		}
	}

}
