package com.tcc.plataformaestudos.material;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tcc.plataformaestudos.config.AcessoNegadoException;
import com.tcc.plataformaestudos.config.RecursoNaoEncontradoException;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.usuario.UsuarioAutenticado;

@ExtendWith(MockitoExtension.class)
class MaterialOrigemServiceTest {

	private static final Long USUARIO_ID = 1L;
	private static final Long DECK_ID = 10L;

	@Mock
	private MaterialOrigemRepository materialOrigemRepository;

	@Mock
	private DeckService deckService;

	@Mock
	private PdfTextExtractorService pdfTextExtractorService;

	@TempDir
	private Path tempDir;

	private MaterialOrigemService materialOrigemService;

	@BeforeEach
	void configurar() {
		materialOrigemService = new MaterialOrigemService(
				materialOrigemRepository, deckService, pdfTextExtractorService, tempDir.toString());

		UsuarioAutenticado principal = new UsuarioAutenticado(USUARIO_ID, "ana@email.com");
		var authentication = new UsernamePasswordAuthenticationToken(principal, null, List.of());
		SecurityContextHolder.getContext().setAuthentication(authentication);
	}

	@AfterEach
	void limparContextoDeSeguranca() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void deveEnviarPdfComSucessoQuandoArquivoValidoEExtracaoFunciona() {
		Deck deck = new Deck();
		deck.setId(DECK_ID);

		MockMultipartFile arquivo = new MockMultipartFile(
				"arquivo", "apostila.pdf", "application/pdf", "conteudo-fake".getBytes(StandardCharsets.UTF_8));

		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);
		when(pdfTextExtractorService.extrairTexto(any(File.class)))
				.thenReturn("Texto extraído com conteúdo suficiente para passar da validação mínima de caracteres.");
		when(materialOrigemRepository.save(any(MaterialOrigem.class))).thenAnswer(invocation -> invocation.getArgument(0));

		MaterialOrigemResponseDTO resposta = materialOrigemService.enviarPdf(DECK_ID, arquivo);

		assertThat(resposta.nomeArquivo()).isEqualTo("apostila.pdf");
		assertThat(resposta.statusProcessamento()).isEqualTo(StatusProcessamento.PROCESSADO);
	}

	@Test
	void deveRejeitarArquivoQueNaoEhPdfAntesDeProcessar() {
		Deck deck = new Deck();
		deck.setId(DECK_ID);
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);

		MockMultipartFile arquivo = new MockMultipartFile(
				"arquivo", "apostila.txt", "text/plain", "conteudo".getBytes(StandardCharsets.UTF_8));

		assertThatThrownBy(() -> materialOrigemService.enviarPdf(DECK_ID, arquivo))
				.isInstanceOf(ArquivoInvalidoException.class);

		verifyNoInteractions(pdfTextExtractorService);
		verify(materialOrigemRepository, never()).save(any());
	}

	@Test
	void deveRejeitarArquivoAcimaDoTamanhoMaximo() {
		Deck deck = new Deck();
		deck.setId(DECK_ID);
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);

		byte[] conteudoGrande = new byte[16 * 1024 * 1024];
		MockMultipartFile arquivo = new MockMultipartFile("arquivo", "apostila.pdf", "application/pdf", conteudoGrande);

		assertThatThrownBy(() -> materialOrigemService.enviarPdf(DECK_ID, arquivo))
				.isInstanceOf(ArquivoInvalidoException.class);

		verifyNoInteractions(pdfTextExtractorService);
		verify(materialOrigemRepository, never()).save(any());
	}

	@Test
	void deveMarcarStatusErroQuandoExtracaoDeTextoFalha() {
		Deck deck = new Deck();
		deck.setId(DECK_ID);

		MockMultipartFile arquivo = new MockMultipartFile(
				"arquivo", "apostila.pdf", "application/pdf", "conteudo-fake".getBytes(StandardCharsets.UTF_8));

		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);
		when(pdfTextExtractorService.extrairTexto(any(File.class)))
				.thenThrow(new ExtracaoTextoException("PDF corrompido"));
		when(materialOrigemRepository.save(any(MaterialOrigem.class))).thenAnswer(invocation -> invocation.getArgument(0));

		MaterialOrigemResponseDTO resposta = materialOrigemService.enviarPdf(DECK_ID, arquivo);

		assertThat(resposta.statusProcessamento()).isEqualTo(StatusProcessamento.ERRO);
	}

	@Test
	void deveBuscarPorIdComSucessoQuandoMaterialPertenceAoUsuario() {
		MaterialOrigem material = new MaterialOrigem();
		material.setId(5L);
		material.setNomeArquivo("apostila.pdf");
		material.setStatusProcessamento(StatusProcessamento.PROCESSADO);

		when(materialOrigemRepository.findByIdAndDeckUsuarioId(5L, USUARIO_ID)).thenReturn(Optional.of(material));

		MaterialOrigemResponseDTO resposta = materialOrigemService.buscarPorId(5L);

		assertThat(resposta.id()).isEqualTo(5L);
	}

	@Test
	void deveLancarAcessoNegadoExceptionQuandoMaterialPertenceADeckDeOutroUsuario() {
		when(materialOrigemRepository.findByIdAndDeckUsuarioId(5L, USUARIO_ID)).thenReturn(Optional.empty());
		when(materialOrigemRepository.existsById(5L)).thenReturn(true);

		assertThatThrownBy(() -> materialOrigemService.buscarPorId(5L))
				.isInstanceOf(AcessoNegadoException.class);
	}

	@Test
	void deveLancarRecursoNaoEncontradoExceptionQuandoMaterialNaoExiste() {
		when(materialOrigemRepository.findByIdAndDeckUsuarioId(5L, USUARIO_ID)).thenReturn(Optional.empty());
		when(materialOrigemRepository.existsById(5L)).thenReturn(false);

		assertThatThrownBy(() -> materialOrigemService.buscarPorId(5L))
				.isInstanceOf(RecursoNaoEncontradoException.class);
	}

}
