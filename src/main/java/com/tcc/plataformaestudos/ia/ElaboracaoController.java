package com.tcc.plataformaestudos.ia;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** UC34 — docs/contrato-api.md, seção "Elaboração de Flashcard". */
@RestController
@RequiredArgsConstructor
public class ElaboracaoController {

	private final ElaboracaoService elaboracaoService;

	@PostMapping("/api/flashcards/{id}/autoexplicacao")
	public ResponseEntity<AutoexplicacaoResponseDTO> corrigirAutoexplicacao(@PathVariable("id") Long id,
			@Valid @RequestBody AutoexplicacaoRequestDTO request) {
		return ResponseEntity.ok(elaboracaoService.gerarFeedbackAutoexplicacao(id, request.texto()));
	}

	@PostMapping("/api/flashcards/{id}/analogia")
	public ResponseEntity<AnalogiaResponseDTO> gerarAnalogia(@PathVariable("id") Long id,
			@Valid @RequestBody(required = false) AnalogiaRequestDTO request) {
		return ResponseEntity.ok(elaboracaoService.gerarAnalogia(id, request == null ? null : request.evitar()));
	}

}
