package com.tcc.plataformaestudos.usuario;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * UC26 (trocar senha), UC24 (exportar dados) e UC25 (excluir conta) —
 * docs/contrato-api.md, seções "Trocar Senha", "Exportação de Dados — LGPD"
 * e "Exclusão de Conta — LGPD". Endpoints de gestão de conta distintos do
 * CRUD de perfil em {@link PerfilController}.
 */
@RestController
@RequestMapping("/api/usuario")
@RequiredArgsConstructor
public class ContaController {

	private final UsuarioService usuarioService;
	private final ExportacaoDadosService exportacaoDadosService;

	@PutMapping("/senha")
	public ResponseEntity<MensagemResponseDTO> trocarSenha(@Valid @RequestBody TrocarSenhaRequestDTO request) {
		return ResponseEntity.ok(usuarioService.trocarSenha(request));
	}

	@GetMapping("/exportar-dados")
	public ResponseEntity<ExportacaoDadosDTO> exportarDados() {
		return ResponseEntity.ok(exportacaoDadosService.exportarDados());
	}

	@DeleteMapping("/conta")
	public ResponseEntity<Void> excluirConta(@Valid @RequestBody ExcluirContaRequestDTO request) {
		usuarioService.excluirConta(request.senha());
		return ResponseEntity.noContent().build();
	}

}
