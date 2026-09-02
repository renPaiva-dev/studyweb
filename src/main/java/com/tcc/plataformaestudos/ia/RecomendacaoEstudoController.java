package com.tcc.plataformaestudos.ia;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/** UC13 — docs/contrato-api.md, seção "Recomendação de Foco de Estudo". */
@RestController
@RequiredArgsConstructor
public class RecomendacaoEstudoController {

	private final RecomendacaoEstudoService recomendacaoEstudoService;

	@PostMapping("/api/decks/{id}/recomendacao-estudo")
	public ResponseEntity<RecomendacaoEstudoResponseDTO> recomendar(@PathVariable("id") Long id) {
		return ResponseEntity.ok(recomendacaoEstudoService.gerarRecomendacao(id));
	}

}
