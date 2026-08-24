package com.tcc.plataformaestudos.flashcard;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * UC05/UC06 — endpoints escopados diretamente a um flashcard (por id
 * global, sem passar pelo deck na URL), conforme docs/contrato-api.md.
 */
@RestController
@RequestMapping("/api/flashcards")
@RequiredArgsConstructor
public class FlashcardItemController {

	private final FlashcardService flashcardService;

	@PutMapping("/{id}")
	public ResponseEntity<FlashcardResponseDTO> atualizar(
			@PathVariable("id") Long id,
			@Valid @RequestBody FlashcardRequestDTO request) {

		return ResponseEntity.ok(flashcardService.atualizar(id, request));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> excluir(@PathVariable("id") Long id) {
		flashcardService.excluir(id);
		return ResponseEntity.noContent().build();
	}

}
