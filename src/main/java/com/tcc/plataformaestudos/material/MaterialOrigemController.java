package com.tcc.plataformaestudos.material;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class MaterialOrigemController {

	private final MaterialOrigemService materialOrigemService;

	@PostMapping(value = "/api/decks/{id}/materiais", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<MaterialOrigemResponseDTO> enviarPdf(
			@PathVariable("id") Long deckId,
			@RequestParam("arquivo") MultipartFile arquivo) {

		MaterialOrigemResponseDTO material = materialOrigemService.enviarPdf(deckId, arquivo);
		return ResponseEntity.status(HttpStatus.CREATED).body(material);
	}

	@GetMapping("/api/materiais/{id}")
	public ResponseEntity<MaterialOrigemResponseDTO> buscarPorId(@PathVariable("id") Long id) {
		return ResponseEntity.ok(materialOrigemService.buscarPorId(id));
	}

}
