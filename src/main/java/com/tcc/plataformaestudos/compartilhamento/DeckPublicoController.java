package com.tcc.plataformaestudos.compartilhamento;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/**
 * UC29 — acesso público (sem autenticação) a um deck via link de
 * compartilhamento. Liberado em SecurityConfig (permitAll); RN01 não se
 * aplica aqui de propósito.
 */
@RestController
@RequestMapping("/api/compartilhamentos")
@RequiredArgsConstructor
public class DeckPublicoController {

	private final CompartilhamentoDeckService compartilhamentoDeckService;

	@GetMapping("/{token}")
	public ResponseEntity<DeckCompartilhadoResponseDTO> buscarPorToken(@PathVariable String token) {
		return ResponseEntity.ok(compartilhamentoDeckService.buscarPorToken(token));
	}

}
