package com.tcc.plataformaestudos.usuario;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.tcc.plataformaestudos.deck.Deck;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "usuario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "nome", nullable = false, length = 120)
	private String nome;

	@Column(name = "nome_usuario", nullable = false, unique = true, length = 30)
	private String nomeUsuario;

	@Column(name = "email", nullable = false, unique = true, length = 180)
	private String email;

	@Column(name = "senha_hash", nullable = false, length = 255)
	private String senhaHash;

	@Enumerated(EnumType.STRING)
	@Column(name = "papel", nullable = false, length = 20)
	private PapelUsuario papel = PapelUsuario.ESTUDANTE;

	@Column(name = "criado_em", nullable = false)
	private LocalDateTime criadoEm;

	/** RN30 (LGPD, consentimento) — versão do termo aceito e timestamp do aceite. */
	@Column(name = "termos_aceitos_em")
	private LocalDateTime termosAceitosEm;

	@Column(name = "termos_versao", length = 10)
	private String termosVersao;

	/**
	 * RN32 (LGPD, direito ao esquecimento) — excluir o usuário remove em
	 * cascata seus decks e, por extensão (ver {@code Deck#materiais}/
	 * {@code Deck#flashcards}/{@code Deck#quizzes}), todo o restante da
	 * árvore (flashcards, revisões, quizzes, questões, tentativas). Não há
	 * mapeamento direto Usuario->RevisaoFlashcard/TentativaQuiz aqui pois
	 * isso já é coberto transitivamente por Deck — evita duplicar a cascata.
	 */
	@OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Deck> decks = new ArrayList<>();

	@PrePersist
	private void prePersist() {
		if (criadoEm == null) {
			criadoEm = LocalDateTime.now();
		}
	}

}
