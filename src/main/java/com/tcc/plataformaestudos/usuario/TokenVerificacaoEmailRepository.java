package com.tcc.plataformaestudos.usuario;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TokenVerificacaoEmailRepository extends JpaRepository<TokenVerificacaoEmail, Long> {

	Optional<TokenVerificacaoEmail> findByTokenAndUsadoFalse(String token);

}
