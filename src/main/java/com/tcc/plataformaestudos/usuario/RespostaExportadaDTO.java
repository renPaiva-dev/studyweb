package com.tcc.plataformaestudos.usuario;

/**
 * UC24/RN31 (LGPD) — resposta a uma questão dentro de uma tentativa
 * exportada: o que o usuário escolheu, se acertou (RN36) e o enunciado da
 * questão respondida, para dar contexto sem exigir juntar com outra lista.
 */
public record RespostaExportadaDTO(
		Long id,
		String enunciadoQuestao,
		String alternativaEscolhida,
		boolean correta) {
}
