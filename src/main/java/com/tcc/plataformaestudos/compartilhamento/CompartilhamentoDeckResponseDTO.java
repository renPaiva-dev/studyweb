package com.tcc.plataformaestudos.compartilhamento;

import java.time.LocalDateTime;

public record CompartilhamentoDeckResponseDTO(
		boolean ativo,
		String token,
		LocalDateTime criadoEm) {

	public static CompartilhamentoDeckResponseDTO fromEntity(CompartilhamentoDeck compartilhamento) {
		if (!compartilhamento.isAtivo()) {
			return inativo();
		}

		return new CompartilhamentoDeckResponseDTO(true, compartilhamento.getToken(), compartilhamento.getCriadoEm());
	}

	public static CompartilhamentoDeckResponseDTO inativo() {
		return new CompartilhamentoDeckResponseDTO(false, null, null);
	}

}
