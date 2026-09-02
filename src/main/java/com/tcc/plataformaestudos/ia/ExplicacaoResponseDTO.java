package com.tcc.plataformaestudos.ia;

/** UC14/RN19 — explicação alternativa de um flashcard, gerada sob demanda (nunca persistida). */
public record ExplicacaoResponseDTO(String explicacao, boolean ancoradaNoMaterial) {
}
