package com.tcc.plataformaestudos.colecao;

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
@RequestMapping("/api/colecoes")
@RequiredArgsConstructor
public class ColecaoController {

	private final ColecaoService colecaoService;

	@GetMapping
	public ResponseEntity<List<ColecaoResponseDTO>> listar() {
		return ResponseEntity.ok(colecaoService.listar());
	}

	@PostMapping
	public ResponseEntity<ColecaoResponseDTO> criar(@Valid @RequestBody ColecaoRequestDTO request) {
		ColecaoResponseDTO colecao = colecaoService.criar(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(colecao);
	}

	@GetMapping("/{id}")
	public ResponseEntity<ColecaoDetalheDTO> buscarPorId(@PathVariable Long id) {
		return ResponseEntity.ok(colecaoService.buscarPorId(id));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ColecaoResponseDTO> atualizar(@PathVariable Long id, @Valid @RequestBody ColecaoRequestDTO request) {
		return ResponseEntity.ok(colecaoService.atualizar(id, request));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> excluir(@PathVariable Long id) {
		colecaoService.excluir(id);
		return ResponseEntity.noContent().build();
	}

}
