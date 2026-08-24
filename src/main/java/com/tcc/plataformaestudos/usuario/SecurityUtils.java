package com.tcc.plataformaestudos.usuario;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

	private SecurityUtils() {
	}

	/**
	 * Recupera o id do usuário autenticado a partir do SecurityContext, para uso
	 * nos services na verificação de RN01 (isolamento por usuário).
	 */
	public static Long obterUsuarioAutenticadoId() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

		if (authentication == null || !(authentication.getPrincipal() instanceof UsuarioAutenticado usuarioAutenticado)) {
			throw new IllegalStateException("Nenhum usuário autenticado encontrado no contexto de segurança");
		}

		return usuarioAutenticado.id();
	}

}
