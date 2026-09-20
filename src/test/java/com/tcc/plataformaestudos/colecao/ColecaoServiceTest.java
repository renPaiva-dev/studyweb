package com.tcc.plataformaestudos.colecao;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.tcc.plataformaestudos.config.RecursoNaoEncontradoException;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckRepository;
import com.tcc.plataformaestudos.flashcard.ContagemFlashcardsPorDeckDTO;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;
import com.tcc.plataformaestudos.usuario.Usuario;
import com.tcc.plataformaestudos.usuario.UsuarioAutenticado;
import com.tcc.plataformaestudos.usuario.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class ColecaoServiceTest {

	private static final Long USUARIO_ID = 1L;

	@Mock
	private ColecaoRepository colecaoRepository;

	@Mock
	private UsuarioRepository usuarioRepository;

	@Mock
	private DeckRepository deckRepository;

	@Mock
	private FlashcardRepository flashcardRepository;

	@InjectMocks
	private ColecaoService colecaoService;

	@BeforeEach
	void autenticarUsuario() {
		UsuarioAutenticado principal = new UsuarioAutenticado(USUARIO_ID, "ana@email.com");
		var authentication = new UsernamePasswordAuthenticationToken(principal, null, List.of());
		SecurityContextHolder.getContext().setAuthentication(authentication);
	}

	@AfterEach
	void limparContextoDeSeguranca() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void deveCriarColecaoComSucesso() {
		ColecaoRequestDTO request = new ColecaoRequestDTO("Medicina", "Decks de graduação em Medicina");
		Usuario usuario = new Usuario();
		usuario.setId(USUARIO_ID);

		when(usuarioRepository.getReferenceById(USUARIO_ID)).thenReturn(usuario);
		when(colecaoRepository.save(any(Colecao.class))).thenAnswer(invocation -> {
			Colecao colecao = invocation.getArgument(0);
			colecao.setId(10L);
			colecao.setCriadoEm(LocalDateTime.now());
			colecao.setAtualizadoEm(LocalDateTime.now());
			return colecao;
		});

		ColecaoResponseDTO resposta = colecaoService.criar(request);

		assertThat(resposta.id()).isEqualTo(10L);
		assertThat(resposta.nome()).isEqualTo("Medicina");
		assertThat(resposta.descricao()).isEqualTo("Decks de graduação em Medicina");
		assertThat(resposta.totalDecks()).isZero();
	}

	@Test
	void deveFalharValidacaoAntesDeChegarNoRepositorioQuandoNomeVazio() {
		Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
		ColecaoRequestDTO request = new ColecaoRequestDTO("", "descrição qualquer");

		Set<ConstraintViolation<ColecaoRequestDTO>> violacoes = validator.validate(request);

		assertThat(violacoes).isNotEmpty();
		verify(colecaoRepository, never()).save(any());
	}

	@Test
	void deveListarApenasColecoesDoUsuarioAutenticado() {
		Colecao colecao = criarColecaoExistente(10L, USUARIO_ID);
		when(colecaoRepository.findByUsuarioId(USUARIO_ID)).thenReturn(List.of(colecao));
		when(deckRepository.contarPorColecaoIdAgrupado(List.of(10L)))
				.thenReturn(List.of(new ContagemDecksPorColecaoDTO(10L, 3L)));

		List<ColecaoResponseDTO> resposta = colecaoService.listar();

		assertThat(resposta).hasSize(1);
		assertThat(resposta.get(0).id()).isEqualTo(10L);
		assertThat(resposta.get(0).totalDecks()).isEqualTo(3);
	}

	/** Mesmo espírito de B4 (DeckService#listar): sem query por coleção, contagem vem agregada. */
	@Test
	void deveContarDecksDeVariasColecoesNumaUnicaConsultaAgregadaAoListar() {
		Colecao colecaoA = criarColecaoExistente(10L, USUARIO_ID);
		Colecao colecaoB = criarColecaoExistente(20L, USUARIO_ID);
		when(colecaoRepository.findByUsuarioId(USUARIO_ID)).thenReturn(List.of(colecaoA, colecaoB));
		when(deckRepository.contarPorColecaoIdAgrupado(List.of(10L, 20L)))
				.thenReturn(List.of(new ContagemDecksPorColecaoDTO(10L, 2L)));

		List<ColecaoResponseDTO> resposta = colecaoService.listar();

		assertThat(resposta).hasSize(2);
		assertThat(resposta.get(0).totalDecks()).isEqualTo(2);
		assertThat(resposta.get(1).totalDecks()).isZero();
	}

	@Test
	void deveRetornarListaVaziaSemConsultarContagemQuandoUsuarioNaoTemColecoes() {
		when(colecaoRepository.findByUsuarioId(USUARIO_ID)).thenReturn(List.of());

		List<ColecaoResponseDTO> resposta = colecaoService.listar();

		assertThat(resposta).isEmpty();
		verify(deckRepository, never()).contarPorColecaoIdAgrupado(any());
	}

	@Test
	void deveBuscarPorIdComSucessoQuandoColecaoPertenceAoUsuario() {
		Colecao colecao = criarColecaoExistente(10L, USUARIO_ID);
		Deck deck = new Deck();
		deck.setId(100L);
		deck.setTitulo("Anatomia");
		when(colecaoRepository.findByIdAndUsuarioId(10L, USUARIO_ID)).thenReturn(Optional.of(colecao));
		when(deckRepository.findByColecaoId(10L)).thenReturn(List.of(deck));
		when(flashcardRepository.contarPorDeckIdAgrupado(List.of(100L)))
				.thenReturn(List.of(new ContagemFlashcardsPorDeckDTO(100L, 7L)));

		ColecaoDetalheDTO resposta = colecaoService.buscarPorId(10L);

		assertThat(resposta.id()).isEqualTo(10L);
		assertThat(resposta.decks()).hasSize(1);
		assertThat(resposta.decks().get(0).titulo()).isEqualTo("Anatomia");
		assertThat(resposta.decks().get(0).totalFlashcards()).isEqualTo(7);
	}

	/** RN01/RN42 — mesmo cuidado de B15 em DeckService: sempre 404, nunca 403. */
	@Test
	void deveLancarRecursoNaoEncontradoExceptionQuandoColecaoPertenceAOutroUsuario() {
		when(colecaoRepository.findByIdAndUsuarioId(10L, USUARIO_ID)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> colecaoService.buscarPorId(10L))
				.isInstanceOf(RecursoNaoEncontradoException.class);
	}

	@Test
	void deveAtualizarColecaoComSucessoQuandoColecaoPertenceAoUsuario() {
		Colecao colecao = criarColecaoExistente(10L, USUARIO_ID);
		when(colecaoRepository.findByIdAndUsuarioId(10L, USUARIO_ID)).thenReturn(Optional.of(colecao));
		when(colecaoRepository.save(colecao)).thenReturn(colecao);
		when(deckRepository.findByColecaoId(10L)).thenReturn(List.of());

		ColecaoResponseDTO resposta = colecaoService.atualizar(10L, new ColecaoRequestDTO("Novo nome", "Nova descrição"));

		assertThat(resposta.nome()).isEqualTo("Novo nome");
		assertThat(resposta.descricao()).isEqualTo("Nova descrição");
	}

	/** RN42: excluir a coleção não deve excluir nem tocar nos decks — só o registro da coleção. */
	@Test
	void deveExcluirColecaoComSucessoQuandoColecaoPertenceAoUsuario() {
		Colecao colecao = criarColecaoExistente(10L, USUARIO_ID);
		when(colecaoRepository.findByIdAndUsuarioId(10L, USUARIO_ID)).thenReturn(Optional.of(colecao));

		colecaoService.excluir(10L);

		verify(colecaoRepository).delete(colecao);
		verify(deckRepository, never()).delete(any());
	}

	private Colecao criarColecaoExistente(Long id, Long usuarioId) {
		Usuario usuario = new Usuario();
		usuario.setId(usuarioId);

		Colecao colecao = new Colecao();
		colecao.setId(id);
		colecao.setUsuario(usuario);
		colecao.setNome("Medicina");
		colecao.setDescricao("Decks de graduação em Medicina");
		colecao.setCriadoEm(LocalDateTime.now());
		colecao.setAtualizadoEm(LocalDateTime.now());
		return colecao;
	}

}
