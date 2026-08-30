package com.tcc.plataformaestudos.usuario;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

	Optional<Usuario> findByEmail(String email);

	// RN34: unicidade de nomeUsuario e case-insensitive - "Renato" e "renato"
	// sao o mesmo nome de usuario para fins de cadastro/edicao (RN22).
	Optional<Usuario> findByNomeUsuarioIgnoreCase(String nomeUsuario);

}
