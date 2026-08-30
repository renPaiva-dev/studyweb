package com.tcc.plataformaestudos.usuario;

import java.time.LocalDateTime;

import com.tcc.plataformaestudos.material.StatusProcessamento;

/** RN31 — sem o texto extraído (pode ser muito grande e não agrega valor à portabilidade dos dados). */
public record MaterialExportadoDTO(
		Long id,
		String nomeArquivo,
		StatusProcessamento statusProcessamento,
		LocalDateTime criadoEm) {
}
