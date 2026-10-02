package com.tcc.plataformaestudos.ia;

import jakarta.validation.constraints.Size;

/** UC34/RN43 — `evitar`: analogia já exibida, para a IA não repeti-la ("Outra analogia"). */
public record AnalogiaRequestDTO(

		@Size(max = 1000, message = "Analogia anterior deve ter no máximo 1000 caracteres")
		String evitar) {
}
