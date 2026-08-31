package com.tcc.plataformaestudos.compartilhamento;

import java.time.LocalDateTime;
import java.util.UUID;

import com.tcc.plataformaestudos.deck.Deck;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** UC29 — link de compartilhamento somente leitura de um deck (RN37/RN38). */
@Entity
@Table(name = "compartilhamento_deck")
@Getter
@Setter
@NoArgsConstructor
public class CompartilhamentoDeck {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "deck_id", nullable = false, unique = true)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Deck deck;

	@Column(name = "token", nullable = false, unique = true, length = 36)
	private String token;

	@Column(name = "ativo", nullable = false)
	private boolean ativo;

	@Column(name = "criado_em", nullable = false)
	private LocalDateTime criadoEm;

	@Column(name = "revogado_em")
	private LocalDateTime revogadoEm;

	/** RN38: reativar gera um novo token, invalidando qualquer link anterior. */
	public void ativar() {
		this.token = UUID.randomUUID().toString();
		this.ativo = true;
		this.revogadoEm = null;
	}

	public void revogar() {
		this.ativo = false;
		this.revogadoEm = LocalDateTime.now();
	}

	@PrePersist
	private void prePersist() {
		if (criadoEm == null) {
			criadoEm = LocalDateTime.now();
		}
	}

}
