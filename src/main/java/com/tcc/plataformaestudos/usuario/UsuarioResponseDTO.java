package com.tcc.plataformaestudos.usuario;

import java.time.LocalDateTime;

public record UsuarioResponseDTO(Long id, String nome, String email, LocalDateTime criadoEm) {

	public static UsuarioResponseDTO fromEntity(Usuario usuario) {
		return new UsuarioResponseDTO(usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getCriadoEm());
	}

}
