package com.tcc.plataformaestudos.usuario;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final UsuarioService usuarioService;
	private final PasswordResetService passwordResetService;
	private final VerificacaoEmailService verificacaoEmailService;

	@PostMapping("/cadastro")
	public ResponseEntity<UsuarioResponseDTO> cadastrar(@Valid @RequestBody CadastroRequestDTO request) {
		UsuarioResponseDTO usuario = usuarioService.cadastrar(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(usuario);
	}

	@PostMapping("/login")
	public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
		LoginResponseDTO resposta = usuarioService.autenticar(request);
		return ResponseEntity.ok(resposta);
	}

	@PostMapping("/esqueci-senha")
	public ResponseEntity<MensagemResponseDTO> esqueciSenha(@Valid @RequestBody EsqueciSenhaRequestDTO request) {
		return ResponseEntity.ok(passwordResetService.solicitarRedefinicao(request.email()));
	}

	@PostMapping("/redefinir-senha")
	public ResponseEntity<MensagemResponseDTO> redefinirSenha(@Valid @RequestBody RedefinirSenhaRequestDTO request) {
		return ResponseEntity.ok(passwordResetService.redefinirSenha(request.token(), request.novaSenha()));
	}

	@PostMapping("/verificar-email")
	public ResponseEntity<MensagemResponseDTO> verificarEmail(@Valid @RequestBody VerificarEmailRequestDTO request) {
		return ResponseEntity.ok(verificacaoEmailService.verificarEmail(request.token()));
	}

	@PostMapping("/reenviar-verificacao")
	public ResponseEntity<MensagemResponseDTO> reenviarVerificacao(@Valid @RequestBody ReenviarVerificacaoRequestDTO request) {
		return ResponseEntity.ok(verificacaoEmailService.reenviarVerificacao(request.email()));
	}

}
