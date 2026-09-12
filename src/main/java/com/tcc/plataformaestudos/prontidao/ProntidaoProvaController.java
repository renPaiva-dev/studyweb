package com.tcc.plataformaestudos.prontidao;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** UC31 — Prontidão para Prova (docs/contrato-api.md, seção "Prontidão para Prova (UC31)"). */
@RestController
@RequestMapping("/api/decks/{id}")
@RequiredArgsConstructor
public class ProntidaoProvaController {

	private final ProntidaoProvaService prontidaoProvaService;

	@GetMapping("/prova-alvo")
	public ResponseEntity<DataAlvoProvaResponseDTO> obterDataAlvo(@PathVariable("id") Long id) {
		return ResponseEntity.ok(prontidaoProvaService.obterDataAlvo(id));
	}

	@PutMapping("/prova-alvo")
	public ResponseEntity<DataAlvoProvaResponseDTO> definirDataAlvo(
			@PathVariable("id") Long id, @Valid @RequestBody DataAlvoProvaRequestDTO request) {
		return ResponseEntity.ok(prontidaoProvaService.definirDataAlvo(id, request.dataAlvo()));
	}

	@DeleteMapping("/prova-alvo")
	public ResponseEntity<Void> removerDataAlvo(@PathVariable("id") Long id) {
		prontidaoProvaService.removerDataAlvo(id);
		return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	}

	@GetMapping("/prontidao-prova")
	public ResponseEntity<ProntidaoProvaResponseDTO> calcularProntidao(@PathVariable("id") Long id) {
		return ResponseEntity.ok(prontidaoProvaService.calcularProntidao(id));
	}

}
