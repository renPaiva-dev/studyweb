package com.tcc.plataformaestudos.usuario;

import java.time.LocalDateTime;
import java.util.List;

public record QuizExportadoDTO(
		Long id,
		String titulo,
		LocalDateTime criadoEm,
		List<QuestaoExportadaDTO> questoes,
		List<TentativaExportadaDTO> tentativas) {
}
