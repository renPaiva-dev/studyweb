package com.tcc.plataformaestudos.revisao;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * UC07/UC08 — endpoints de "Estudo com Repetição Espaçada"
 * (docs/contrato-api.md). Os dois endpoints têm raízes de path diferentes
 * (deck vs. flashcard), por isso não há um {@code @RequestMapping} de
 * classe único.
 */
@RestController
@RequiredArgsConstructor
public class RevisaoController {

	private final RevisaoService revisaoService;

	@GetMapping("/api/decks/{id}/fila-estudo")
	public ResponseEntity<List<FilaEstudoItemDTO>> filaDeEstudo(@PathVariable("id") Long deckId) {
		return ResponseEntity.ok(revisaoService.obterFilaDeEstudo(deckId));
	}

	@PostMapping("/api/flashcards/{id}/revisoes")
	public ResponseEntity<RevisaoResponseDTO> avaliarResposta(
			@PathVariable("id") Long flashcardId,
			@Valid @RequestBody AvaliarRespostaRequestDTO request) {

		RevisaoResponseDTO resposta = revisaoService.avaliarResposta(flashcardId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
	}

}
