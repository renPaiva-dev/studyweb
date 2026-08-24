package com.tcc.plataformaestudos.quiz;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RespostaDTO(

		@NotNull(message = "questaoId é obrigatório")
		Long questaoId,

		@NotBlank(message = "alternativaEscolhida é obrigatória")
		String alternativaEscolhida) {
}
