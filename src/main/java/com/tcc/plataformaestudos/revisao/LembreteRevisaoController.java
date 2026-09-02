package com.tcc.plataformaestudos.revisao;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tcc.plataformaestudos.usuario.MensagemResponseDTO;

import lombok.RequiredArgsConstructor;

/** UC30 — disparo manual do lembrete de revisão, para o próprio usuário testar. */
@RestController
@RequestMapping("/api/usuario/lembrete-revisao")
@RequiredArgsConstructor
public class LembreteRevisaoController {

	private final LembreteRevisaoService lembreteRevisaoService;

	@PostMapping("/teste")
	public ResponseEntity<MensagemResponseDTO> enviarTeste() {
		lembreteRevisaoService.enviarLembreteManualParaUsuarioAutenticado();
		return ResponseEntity.ok(new MensagemResponseDTO("Lembrete enviado para o seu e-mail."));
	}

}
