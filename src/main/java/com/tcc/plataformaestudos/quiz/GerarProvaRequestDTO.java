package com.tcc.plataformaestudos.quiz;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record GerarProvaRequestDTO(

		@NotEmpty(message = "Selecione ao menos um flashcard")
		List<Long> flashcardIds,

		@NotNull(message = "Escolha o estilo da prova")
		EstiloProva estilo) {
}
