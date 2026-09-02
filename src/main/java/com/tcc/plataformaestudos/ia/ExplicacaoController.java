package com.tcc.plataformaestudos.ia;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/** UC14 — docs/contrato-api.md, seção "Explicação de Flashcard". */
@RestController
@RequiredArgsConstructor
public class ExplicacaoController {

	private final ExplicacaoService explicacaoService;

	@PostMapping("/api/flashcards/{id}/explicacao")
	public ResponseEntity<ExplicacaoResponseDTO> explicar(@PathVariable("id") Long id) {
		return ResponseEntity.ok(explicacaoService.gerarExplicacao(id));
	}

}
