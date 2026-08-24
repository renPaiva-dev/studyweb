package com.tcc.plataformaestudos.revisao;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AvaliarRespostaRequestDTO(

		@NotNull(message = "Qualidade da resposta é obrigatória")
		@Min(value = 0, message = "Qualidade da resposta deve estar entre 0 e 5")
		@Max(value = 5, message = "Qualidade da resposta deve estar entre 0 e 5")
		Integer qualidadeResposta) {
}
