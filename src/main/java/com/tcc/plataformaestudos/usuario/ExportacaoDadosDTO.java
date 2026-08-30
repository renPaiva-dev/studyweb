package com.tcc.plataformaestudos.usuario;

import java.util.List;

/** UC24/RN31 (LGPD, acesso/portabilidade) — GET /api/usuario/exportar-dados. */
public record ExportacaoDadosDTO(
		UsuarioResponseDTO perfil,
		List<DeckExportadoDTO> decks) {
}
