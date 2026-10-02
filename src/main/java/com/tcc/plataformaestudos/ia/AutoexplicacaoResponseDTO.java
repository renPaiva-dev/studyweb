package com.tcc.plataformaestudos.ia;

import java.util.List;

/** UC34/RN43 — feedback da IA sobre a autoexplicação, gerado sob demanda (nunca persistido). */
public record AutoexplicacaoResponseDTO(
		VereditoAutoexplicacao veredito,
		String comentarioGeral,
		List<AnotacaoAutoexplicacaoDTO> anotacoes,
		String faltou,
		boolean ancoradaNoMaterial) {
}
