package com.tcc.plataformaestudos.quiz;

import java.util.List;

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
 * UC10/UC27/UC28 — endpoints de Quiz e Provas personalizadas
 * (docs/contrato-api.md). Raízes de path diferentes (deck vs. quiz vs.
 * usuario), por isso não há um {@code @RequestMapping} de classe único
 * (mesmo padrão de RevisaoController).
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

	/** UC27/RN35 — prova personalizada via IA a partir de flashcards escolhidos + estilo. */
	@PostMapping("/api/decks/{id}/provas")
	public ResponseEntity<QuizResponseDTO> gerarProvaPersonalizada(
			@PathVariable("id") Long deckId,
			@Valid @RequestBody GerarProvaRequestDTO request) {

		QuizResponseDTO prova = quizService.gerarProvaPersonalizada(deckId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(prova);
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

	/** UC28/RN36 — histórico de provas do usuário autenticado. */
	@GetMapping("/api/usuario/provas")
	public ResponseEntity<List<HistoricoProvaResumoDTO>> listarHistoricoProvas() {
		return ResponseEntity.ok(quizService.listarHistoricoProvas());
	}

	/** UC28/RN36 — detalhe de uma tentativa, com revisão questão a questão. */
	@GetMapping("/api/usuario/provas/{id}")
	public ResponseEntity<HistoricoProvaDetalheDTO> buscarDetalheTentativa(@PathVariable("id") Long tentativaId) {
		return ResponseEntity.ok(quizService.buscarDetalheTentativa(tentativaId));
	}

}
