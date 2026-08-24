package com.tcc.plataformaestudos.quiz;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * UC10 (extensão de escopo) — endpoints de Quiz (docs/contrato-api.md). Os
 * três endpoints têm raízes de path diferentes (deck vs. quiz), por isso não
 * há um {@code @RequestMapping} de classe único (mesmo padrão de
 * RevisaoController).
 */
@RestController
@RequiredArgsConstructor
public class QuizController {

	private final QuizService quizService;

	@PostMapping("/api/decks/{id}/quizzes")
	public ResponseEntity<QuizResponseDTO> gerarQuiz(@PathVariable("id") Long deckId) {
		QuizResponseDTO quiz = quizService.gerarQuiz(deckId);
		return ResponseEntity.status(HttpStatus.CREATED).body(quiz);
	}

	@GetMapping("/api/quizzes/{id}")
	public ResponseEntity<QuizResponseDTO> buscarPorId(@PathVariable("id") Long quizId) {
		return ResponseEntity.ok(quizService.buscarPorId(quizId));
	}

	@PostMapping("/api/quizzes/{id}/tentativas")
	public ResponseEntity<TentativaResponseDTO> responderTentativa(
			@PathVariable("id") Long quizId,
			@Valid @RequestBody TentativaRequestDTO request) {

		TentativaResponseDTO resposta = quizService.responderTentativa(quizId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
	}

}
