package com.tcc.plataformaestudos.usuario;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TokenRedefinicaoSenhaRepository extends JpaRepository<TokenRedefinicaoSenha, Long> {

	Optional<TokenRedefinicaoSenha> findByTokenAndUsadoFalse(String token);

}
