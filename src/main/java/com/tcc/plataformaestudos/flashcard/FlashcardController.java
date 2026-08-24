package com.tcc.plataformaestudos.flashcard;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * UC05 — endpoints escopados a um deck (docs/contrato-api.md, seção
 * Flashcards e seção Geração de Flashcards via IA).
 */
@RestController
@RequestMapping("/api/decks/{id}/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

	private final FlashcardService flashcardService;

	@GetMapping
	public ResponseEntity<List<FlashcardResponseDTO>> listar(@PathVariable("id") Long deckId) {
		return ResponseEntity.ok(flashcardService.listar(deckId));
	}

	@PostMapping
	public ResponseEntity<FlashcardResponseDTO> criarManual(
			@PathVariable("id") Long deckId,
			@Valid @RequestBody FlashcardRequestDTO request) {

		FlashcardResponseDTO criado = flashcardService.criarManual(deckId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(criado);
	}

	@PostMapping("/confirmar-sugestoes")
	public ResponseEntity<List<FlashcardResponseDTO>> confirmarSugestoes(
			@PathVariable("id") Long deckId,
			@Valid @RequestBody ConfirmarSugestoesRequestDTO request) {

		List<FlashcardResponseDTO> criados = flashcardService.confirmarSugestoes(deckId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(criados);
	}

}
