package com.tcc.plataformaestudos.ia;

/** UC32/RN41 — resposta a uma pergunta livre sobre o material de um deck, gerada sob demanda (nunca persistida). */
public record PerguntaMaterialResponseDTO(String resposta, int materiaisConsultados) {
}
