package com.tcc.plataformaestudos.usuario;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** UC21/RN26 — ver VerificacaoEmailServiceTest para o fluxo de geração/uso do token. */
@ExtendWith(MockitoExtension.class)
class LimpezaContasNaoVerificadasServiceTest {

	@Mock
	private UsuarioRepository usuarioRepository;

	@InjectMocks
	private LimpezaContasNaoVerificadasService limpezaContasNaoVerificadasService;

	private Usuario usuarioComId(Long id) {
		Usuario usuario = new Usuario();
		usuario.setId(id);
		usuario.setNome("Ana Estudante");
		usuario.setNomeUsuario("ana_estudante");
		usuario.setEmail("ana@email.com");
		usuario.setEmailVerificado(false);
		return usuario;
	}

	@Test
	void deveRemoverContasNaoVerificadasComTokensExpirados() {
		Usuario candidato = usuarioComId(1L);
		when(usuarioRepository.buscarNaoVerificadosComTokensExpirados(any())).thenReturn(List.of(candidato));

		limpezaContasNaoVerificadasService.limparContasExpiradas();

		verify(usuarioRepository).deleteAll(List.of(candidato));
	}

	@Test
	void naoDeveChamarDeleteAllQuandoNaoHaCandidatos() {
		when(usuarioRepository.buscarNaoVerificadosComTokensExpirados(any())).thenReturn(List.of());

		limpezaContasNaoVerificadasService.limparContasExpiradas();

		verify(usuarioRepository, never()).deleteAll(anyList());
	}

}
