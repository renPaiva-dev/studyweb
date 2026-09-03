package com.tcc.plataformaestudos.usuario;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

	Optional<Usuario> findByEmail(String email);

	// RN34: unicidade de nomeUsuario e case-insensitive - "Renato" e "renato"
	// sao o mesmo nome de usuario para fins de cadastro/edicao (RN22).
	Optional<Usuario> findByNomeUsuarioIgnoreCase(String nomeUsuario);

	/**
	 * RN26 — contas nunca confirmadas cujo(s) token(s) de verificação já
	 * expiraram (nenhum token ainda válido) - candidatas a remoção por
	 * {@link LimpezaContasNaoVerificadasService}. Sem isso, um e-mail/
	 * nomeUsuario informado errado (ou nunca confirmado) trava esse valor
	 * para sempre, já que a conta já existe (RN02/RN22 exigem unicidade).
	 */
	@Query("""
			select u from Usuario u
			where u.emailVerificado = false
			and not exists (
				select 1 from TokenVerificacaoEmail t
				where t.usuario = u and t.expiraEm > :agora
			)
			""")
	List<Usuario> buscarNaoVerificadosComTokensExpirados(@Param("agora") LocalDateTime agora);

}
