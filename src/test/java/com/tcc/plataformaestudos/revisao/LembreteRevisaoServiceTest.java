package com.tcc.plataformaestudos.revisao;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tcc.plataformaestudos.usuario.EmailService;
import com.tcc.plataformaestudos.usuario.UsuarioAutenticado;

@ExtendWith(MockitoExtension.class)
class LembreteRevisaoServiceTest {

	private static final Long USUARIO_ID = 7L;

	@Mock
	private LembreteRevisaoDadosService lembreteRevisaoDadosService;

	@Mock
	private EmailService emailService;

	@InjectMocks
	private LembreteRevisaoService lembreteRevisaoService;

	@Captor
	private ArgumentCaptor<String> corpoCaptor;

	@AfterEach
	void limparContextoDeSeguranca() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void deveEnviarUmEmailPorUsuarioComPendenciasNoJobDiario() {
		LembreteRevisaoDTO joao = new LembreteRevisaoDTO("joao@email.com", "João", 3, Map.of("Anatomia", 3L));
		LembreteRevisaoDTO maria = new LembreteRevisaoDTO("maria@email.com", "Maria", 0, Map.of());
		when(lembreteRevisaoDadosService.montarLembretesDeTodosOsUsuarios()).thenReturn(List.of(joao, maria));

		lembreteRevisaoService.enviarLembretesDiarios();

		verify(emailService).enviarEmail(eq("joao@email.com"), anyString(), corpoCaptor.capture());
		assertThat(corpoCaptor.getValue()).contains("3 flashcards pendentes").contains("Anatomia: 3");

		verify(emailService).enviarEmail(eq("maria@email.com"), anyString(), corpoCaptor.capture());
		assertThat(corpoCaptor.getAllValues().get(1)).contains("em dia com suas revisões");
	}

	@Test
	void naoDeveChamarEmailServiceQuandoNaoHaUsuariosComPendencias() {
		when(lembreteRevisaoDadosService.montarLembretesDeTodosOsUsuarios()).thenReturn(List.of());

		lembreteRevisaoService.enviarLembretesDiarios();

		verifyNoMoreInteractions(emailService);
	}

	@Test
	void deveEnviarLembreteManualParaUsuarioAutenticadoMesmoSemPendencias() {
		autenticarUsuario(USUARIO_ID);
		LembreteRevisaoDTO semPendencias = new LembreteRevisaoDTO("ana@email.com", "Ana", 0, Map.of());
		when(lembreteRevisaoDadosService.montarLembreteDoUsuario(USUARIO_ID)).thenReturn(semPendencias);

		lembreteRevisaoService.enviarLembreteManualParaUsuarioAutenticado();

		verify(emailService).enviarEmail(eq("ana@email.com"), anyString(), corpoCaptor.capture());
		assertThat(corpoCaptor.getValue()).contains("em dia com suas revisões");
	}

	private void autenticarUsuario(Long usuarioId) {
		UsuarioAutenticado principal = new UsuarioAutenticado(usuarioId, "usuario@email.com");
		SecurityContextHolder.getContext()
				.setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, List.of()));
	}

}
