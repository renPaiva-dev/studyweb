package com.tcc.plataformaestudos.quiz;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

public record TentativaRequestDTO(

		@NotEmpty(message = "A lista de respostas não pode ser vazia")
		@Valid
		List<RespostaDTO> respostas) {
}
