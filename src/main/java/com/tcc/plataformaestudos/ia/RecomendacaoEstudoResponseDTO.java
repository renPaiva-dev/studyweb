package com.tcc.plataformaestudos.ia;

/** UC13/RN18 — recomendação de foco de estudo, gerada sob demanda (nunca persistida). */
public record RecomendacaoEstudoResponseDTO(String recomendacao, String topicoFoco, boolean baseadoEmDados) {
}
