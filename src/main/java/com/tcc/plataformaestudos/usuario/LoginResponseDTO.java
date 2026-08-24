package com.tcc.plataformaestudos.usuario;

import java.time.Instant;

public record LoginResponseDTO(String token, String tipo, Instant expiraEm) {

	public static LoginResponseDTO de(JwtService.TokenGerado tokenGerado) {
		return new LoginResponseDTO(tokenGerado.valor(), "Bearer", tokenGerado.expiraEm());
	}

}
