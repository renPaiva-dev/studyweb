package com.tcc.plataformaestudos.ia;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** UC32 — docs/contrato-api.md, seção "Pergunta sobre o Material do Deck". */
@RestController
@RequiredArgsConstructor
public class PerguntaMaterialController {

	private final PerguntaMaterialService perguntaMaterialService;

	@PostMapping("/api/decks/{id}/perguntas")
	public ResponseEntity<PerguntaMaterialResponseDTO> perguntar(
			@PathVariable("id") Long id, @Valid @RequestBody PerguntaMaterialRequestDTO request) {
		return ResponseEntity.ok(perguntaMaterialService.perguntar(id, request));
	}

}
