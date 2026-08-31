package com.tcc.plataformaestudos.compartilhamento;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/**
 * UC29 — gestão (pelo dono) do link de compartilhamento de um deck. Recurso
 * singular por deck: no máximo um link por vez (docs/contrato-api.md).
 */
@RestController
@RequestMapping("/api/decks/{id}/compartilhamento")
@RequiredArgsConstructor
public class CompartilhamentoDeckController {

	private final CompartilhamentoDeckService compartilhamentoDeckService;

	@GetMapping
	public ResponseEntity<CompartilhamentoDeckResponseDTO> buscarStatus(@PathVariable("id") Long deckId) {
		return ResponseEntity.ok(compartilhamentoDeckService.buscarStatus(deckId));
	}

	@PostMapping
	public ResponseEntity<CompartilhamentoDeckResponseDTO> ativar(@PathVariable("id") Long deckId) {
		return ResponseEntity.ok(compartilhamentoDeckService.ativar(deckId));
	}

	@DeleteMapping
	public ResponseEntity<Void> revogar(@PathVariable("id") Long deckId) {
		compartilhamentoDeckService.revogar(deckId);
		return ResponseEntity.noContent().build();
	}

}
