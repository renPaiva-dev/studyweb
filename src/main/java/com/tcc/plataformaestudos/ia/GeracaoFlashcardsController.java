package com.tcc.plataformaestudos.ia;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class GeracaoFlashcardsController {

	private final FlashcardGenerationService flashcardGenerationService;

	@PostMapping("/api/materiais/{id}/gerar-flashcards")
	public ResponseEntity<SugestoesFlashcardsResponseDTO> gerarFlashcards(@PathVariable("id") Long id) {
		return ResponseEntity.ok(flashcardGenerationService.gerarSugestoes(id));
	}

}
