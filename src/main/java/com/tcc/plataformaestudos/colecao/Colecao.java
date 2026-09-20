package com.tcc.plataformaestudos.colecao;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.usuario.Usuario;

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

/**
 * RN42/UC33 — agrupamento temático de decks (ex.: "Medicina" reunindo os
 * decks "Anatomia" e "Sistema Cardiovascular"). Um deck pertence a no máximo
 * uma coleção (ver {@link Deck#getColecao()}); excluir a coleção não exclui
 * os decks nela contidos, apenas desvincula (`colecao_id` → NULL).
 */
@Entity
@Table(name = "colecao")
@Getter
@Setter
@NoArgsConstructor
public class Colecao {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** RN32: defesa em duas camadas, mesmo padrão de {@code Deck#usuario}. */
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "usuario_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Usuario usuario;

	@Column(name = "nome", nullable = false, length = 100)
	private String nome;

	@Column(name = "descricao", length = 500)
	private String descricao;

	@Column(name = "criado_em", nullable = false)
	private LocalDateTime criadoEm;

	@Column(name = "atualizado_em", nullable = false)
	private LocalDateTime atualizadoEm;

	/** RN42: sem cascade/orphanRemoval — excluir a coleção nunca exclui os decks. */
	@OneToMany(mappedBy = "colecao")
	private List<Deck> decks = new ArrayList<>();

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
