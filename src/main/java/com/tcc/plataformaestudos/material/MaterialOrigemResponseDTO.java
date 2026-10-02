package com.tcc.plataformaestudos.material;

import java.time.LocalDateTime;

public record MaterialOrigemResponseDTO(
		Long id,
		String nomeArquivo,
		StatusProcessamento statusProcessamento,
		String motivoErro,
		LocalDateTime criadoEm) {

	public static MaterialOrigemResponseDTO fromEntity(MaterialOrigem material) {
		return new MaterialOrigemResponseDTO(
				material.getId(),
				material.getNomeArquivo(),
				material.getStatusProcessamento(),
				material.getMotivoErro(),
				material.getCriadoEm());
	}

}
