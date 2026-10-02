package com.tcc.plataformaestudos.ia;

/** UC34/RN43 — analogia ou exemplo concreto de um flashcard, gerado sob demanda (nunca persistido). */
public record AnalogiaResponseDTO(TipoAnalogia tipo, String texto, boolean ancoradaNoMaterial) {
}
