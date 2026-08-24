package com.tcc.plataformaestudos.deck;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/decks")
@RequiredArgsConstructor
public class DeckController {

	private final DeckService deckService;

	@GetMapping
	public ResponseEntity<List<DeckResponseDTO>> listar() {
		return ResponseEntity.ok(deckService.listar());
	}

	@PostMapping
	public ResponseEntity<DeckResponseDTO> criar(@Valid @RequestBody DeckRequestDTO request) {
		DeckResponseDTO deck = deckService.criar(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(deck);
	}

	@GetMapping("/{id}")
	public ResponseEntity<DeckResponseDTO> buscarPorId(@PathVariable Long id) {
		return ResponseEntity.ok(deckService.buscarPorId(id));
	}

	@PutMapping("/{id}")
	public ResponseEntity<DeckResponseDTO> atualizar(@PathVariable Long id, @Valid @RequestBody DeckRequestDTO request) {
		return ResponseEntity.ok(deckService.atualizar(id, request));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> excluir(@PathVariable Long id) {
		deckService.excluir(id);
		return ResponseEntity.noContent().build();
	}

}
