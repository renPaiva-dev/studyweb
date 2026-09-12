package com.tcc.plataformaestudos.prontidao;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

public record DataAlvoProvaRequestDTO(
		@NotNull(message = "A data-alvo da prova é obrigatória") LocalDate dataAlvo) {
}
