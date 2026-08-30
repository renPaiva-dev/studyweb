package com.tcc.plataformaestudos.usuario;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * UC19 — Editar perfil (docs/contrato-api.md, seção "Conta e Perfil").
 */
@RestController
@RequestMapping("/api/usuario/perfil")
@RequiredArgsConstructor
public class PerfilController {

	private final UsuarioService usuarioService;

	@GetMapping
	public ResponseEntity<UsuarioResponseDTO> obterPerfil() {
		return ResponseEntity.ok(usuarioService.obterPerfil());
	}

	@PutMapping
	public ResponseEntity<UsuarioResponseDTO> atualizarPerfil(@Valid @RequestBody AtualizarPerfilRequestDTO request) {
		return ResponseEntity.ok(usuarioService.atualizarPerfil(request));
	}

}
