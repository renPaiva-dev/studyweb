package com.tcc.plataformaestudos.material;

import java.time.LocalDateTime;

import com.tcc.plataformaestudos.deck.Deck;

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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "material_origem")
@Getter
@Setter
@NoArgsConstructor
public class MaterialOrigem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "deck_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Deck deck;

	@Column(name = "nome_arquivo", nullable = false, length = 255)
	private String nomeArquivo;

	@Column(name = "caminho_arquivo", nullable = false, length = 500)
	private String caminhoArquivo;

	@Column(name = "texto_extraido", columnDefinition = "TEXT")
	private String textoExtraido;

	@Enumerated(EnumType.STRING)
	@Column(name = "status_processamento", nullable = false, length = 20)
	private StatusProcessamento statusProcessamento = StatusProcessamento.PENDENTE;

	@Column(name = "criado_em", nullable = false)
	private LocalDateTime criadoEm;

	@PrePersist
	private void prePersist() {
		if (criadoEm == null) {
			criadoEm = LocalDateTime.now();
		}
	}

}
