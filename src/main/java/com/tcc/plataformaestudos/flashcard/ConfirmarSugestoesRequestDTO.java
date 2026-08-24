package com.tcc.plataformaestudos.flashcard;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

public record ConfirmarSugestoesRequestDTO(

		@NotEmpty(message = "A lista de sugestões não pode ser vazia")
		@Valid
		List<SugestaoConfirmacaoDTO> sugestoes) {
}
