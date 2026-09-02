package com.tcc.plataformaestudos.usuario;

import java.time.LocalDateTime;

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
 * UC21/RN26 — token de uso único para verificação de e-mail no cadastro,
 * válido por 24h a partir da criação. {@code usado} marca consumo (impede
 * reuso). Mesmo padrão de {@link TokenRedefinicaoSenha} (UC18/RN24).
 */
@Entity
@Table(name = "token_verificacao_email")
@Getter
@Setter
@NoArgsConstructor
public class TokenVerificacaoEmail {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "usuario_id", nullable = false)
	@OnDelete(action = OnDeleteAction.CASCADE)
	private Usuario usuario;

	@Column(name = "token", nullable = false, unique = true, length = 64)
	private String token;

	@Column(name = "expira_em", nullable = false)
	private LocalDateTime expiraEm;

	@Column(name = "usado", nullable = false)
	private boolean usado = false;

	@Column(name = "criado_em", nullable = false)
	private LocalDateTime criadoEm;

	@PrePersist
	private void prePersist() {
		if (criadoEm == null) {
			criadoEm = LocalDateTime.now();
		}
	}

}
