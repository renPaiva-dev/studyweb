package com.tcc.plataformaestudos.usuario;

import java.time.LocalDateTime;

public record UsuarioResponseDTO(
		Long id,
		String nome,
		String nomeUsuario,
		String email,
		PapelUsuario papel,
		LocalDateTime criadoEm) {

	public static UsuarioResponseDTO fromEntity(Usuario usuario) {
		return new UsuarioResponseDTO(
				usuario.getId(),
				usuario.getNome(),
				usuario.getNomeUsuario(),
				usuario.getEmail(),
				usuario.getPapel(),
				usuario.getCriadoEm());
	}

}
