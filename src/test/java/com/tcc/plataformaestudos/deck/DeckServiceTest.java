package com.tcc.plataformaestudos.deck;

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
import com.tcc.plataformaestudos.flashcard.ContagemFlashcardsPorDeckDTO;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;
import com.tcc.plataformaestudos.material.ArquivoFisicoService;
import com.tcc.plataformaestudos.material.MaterialOrigem;
import com.tcc.plataformaestudos.usuario.Usuario;
import com.tcc.plataformaestudos.usuario.UsuarioAutenticado;
import com.tcc.plataformaestudos.usuario.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class DeckServiceTest {

	private static final Long USUARIO_ID = 1L;

	@Mock
	private DeckRepository deckRepository;

	@Mock
	private UsuarioRepository usuarioRepository;

	@Mock
	private FlashcardRepository flashcardRepository;

	@Mock
	private ArquivoFisicoService arquivoFisicoService;

	@InjectMocks
	private DeckService deckService;

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
	void deveCriarDeckComSucesso() {
		DeckRequestDTO request = new DeckRequestDTO("Anatomia", "Sistema cardiovascular");
		Usuario usuario = new Usuario();
		usuario.setId(USUARIO_ID);

		when(usuarioRepository.getReferenceById(USUARIO_ID)).thenReturn(usuario);
		when(deckRepository.save(any(Deck.class))).thenAnswer(invocation -> {
			Deck deck = invocation.getArgument(0);
			deck.setId(10L);
			deck.setCriadoEm(LocalDateTime.now());
			deck.setAtualizadoEm(LocalDateTime.now());
			return deck;
		});

		DeckResponseDTO resposta = deckService.criar(request);

		assertThat(resposta.id()).isEqualTo(10L);
		assertThat(resposta.titulo()).isEqualTo("Anatomia");
		assertThat(resposta.descricao()).isEqualTo("Sistema cardiovascular");
		assertThat(resposta.totalFlashcards()).isZero();
	}

	@Test
	void deveFalharValidacaoAntesDeChegarNoRepositorioQuandoTituloVazio() {
		Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
		DeckRequestDTO request = new DeckRequestDTO("", "descrição qualquer");

		Set<ConstraintViolation<DeckRequestDTO>> violacoes = validator.validate(request);

		assertThat(violacoes).isNotEmpty();
		verify(deckRepository, never()).save(any());
	}

	@Test
	void deveListarApenasDecksDoUsuarioAutenticado() {
		Deck deck = criarDeckExistente(10L, USUARIO_ID);
		when(deckRepository.findByUsuarioId(USUARIO_ID)).thenReturn(List.of(deck));
		when(flashcardRepository.contarPorDeckIdAgrupado(List.of(10L)))
				.thenReturn(List.of(new ContagemFlashcardsPorDeckDTO(10L, 14L)));

		List<DeckResponseDTO> resposta = deckService.listar();

		assertThat(resposta).hasSize(1);
		assertThat(resposta.get(0).id()).isEqualTo(10L);
		assertThat(resposta.get(0).totalFlashcards()).isEqualTo(14);
	}

	/**
	 * B4: listar() não deve mais disparar uma query COUNT por deck (N+1) —
	 * com vários decks, a contagem de flashcards vem de uma única consulta
	 * agregada ({@code contarPorDeckIdAgrupado}), nunca de
	 * {@code countByDeckId} chamado individualmente por deck.
	 */
	@Test
	void deveContarFlashcardsDeVariosDecksNumaUnicaConsultaAgregadaAoListar() {
		Deck deckA = criarDeckExistente(10L, USUARIO_ID);
		Deck deckB = criarDeckExistente(20L, USUARIO_ID);
		when(deckRepository.findByUsuarioId(USUARIO_ID)).thenReturn(List.of(deckA, deckB));
		when(flashcardRepository.contarPorDeckIdAgrupado(List.of(10L, 20L)))
				.thenReturn(List.of(new ContagemFlashcardsPorDeckDTO(10L, 3L)));

		List<DeckResponseDTO> resposta = deckService.listar();

		assertThat(resposta).hasSize(2);
		assertThat(resposta.get(0).totalFlashcards()).isEqualTo(3);
		// Deck sem entrada no mapa agregado (nenhum flashcard) deve cair para 0, não gerar NPE nem query extra.
		assertThat(resposta.get(1).totalFlashcards()).isZero();
		verify(flashcardRepository, never()).countByDeckId(any());
	}

	@Test
	void deveRetornarListaVaziaSemConsultarContagemQuandoUsuarioNaoTemDecks() {
		when(deckRepository.findByUsuarioId(USUARIO_ID)).thenReturn(List.of());

		List<DeckResponseDTO> resposta = deckService.listar();

		assertThat(resposta).isEmpty();
		verify(flashcardRepository, never()).contarPorDeckIdAgrupado(any());
	}

	@Test
	void deveBuscarPorIdComSucessoQuandoDeckPertenceAoUsuario() {
		Deck deck = criarDeckExistente(10L, USUARIO_ID);
		when(deckRepository.findByIdAndUsuarioId(10L, USUARIO_ID)).thenReturn(Optional.of(deck));

		DeckResponseDTO resposta = deckService.buscarPorId(10L);

		assertThat(resposta.id()).isEqualTo(10L);
	}

	/**
	 * B15: deck existente mas de outro usuário deve dar o mesmo 404 de "deck
	 * não encontrado" — nunca 403 — para não permitir enumerar deck IDs de
	 * outros usuários pela diferença de status HTTP (mesmo cuidado já
	 * existente no lado público, CompartilhamentoDeckService). Note que
	 * {@code deckRepository.existsById} não é mais consultado: a decisão
	 * 403-vs-404 que causava a enumeração foi removida por completo.
	 */
	@Test
	void deveLancarRecursoNaoEncontradoExceptionQuandoDeckPertenceAOutroUsuario() {
		when(deckRepository.findByIdAndUsuarioId(10L, USUARIO_ID)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> deckService.buscarPorId(10L))
				.isInstanceOf(RecursoNaoEncontradoException.class);

		verify(deckRepository, never()).existsById(any());
	}

	@Test
	void deveLancarRecursoNaoEncontradoExceptionQuandoDeckNaoExiste() {
		when(deckRepository.findByIdAndUsuarioId(10L, USUARIO_ID)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> deckService.buscarPorId(10L))
				.isInstanceOf(RecursoNaoEncontradoException.class);
	}

	@Test
	void deveAtualizarDeckComSucessoQuandoDeckPertenceAoUsuario() {
		Deck deck = criarDeckExistente(10L, USUARIO_ID);
		when(deckRepository.findByIdAndUsuarioId(10L, USUARIO_ID)).thenReturn(Optional.of(deck));
		when(deckRepository.save(deck)).thenReturn(deck);

		DeckResponseDTO resposta = deckService.atualizar(10L, new DeckRequestDTO("Novo título", "Nova descrição"));

		assertThat(resposta.titulo()).isEqualTo("Novo título");
		assertThat(resposta.descricao()).isEqualTo("Nova descrição");
	}

	@Test
	void deveExcluirDeckComSucessoQuandoDeckPertenceAoUsuario() {
		Deck deck = criarDeckExistente(10L, USUARIO_ID);
		when(deckRepository.findByIdAndUsuarioId(10L, USUARIO_ID)).thenReturn(Optional.of(deck));

		deckService.excluir(10L);

		verify(deckRepository).delete(deck);
	}

	/**
	 * B1: excluir um deck precisa apagar o arquivo físico de cada material
	 * associado antes de remover o deck do banco — a cascata do JPA só apaga
	 * as linhas de material_origem, nunca o arquivo em uploads/{deckId}/.
	 * Sem essa chamada, o arquivo vira órfão em disco para sempre.
	 */
	@Test
	void deveApagarArquivosFisicosDeTodosOsMateriaisAoExcluirDeck() {
		Deck deck = criarDeckExistente(10L, USUARIO_ID);
		MaterialOrigem material1 = new MaterialOrigem();
		material1.setId(1L);
		material1.setCaminhoArquivo("uploads/10/a.pdf");
		MaterialOrigem material2 = new MaterialOrigem();
		material2.setId(2L);
		material2.setCaminhoArquivo("uploads/10/b.pdf");
		deck.setMateriais(List.of(material1, material2));

		when(deckRepository.findByIdAndUsuarioId(10L, USUARIO_ID)).thenReturn(Optional.of(deck));

		deckService.excluir(10L);

		verify(arquivoFisicoService).excluirTodos(deck.getMateriais());
		verify(deckRepository).delete(deck);
	}

	@Test
	void deveExcluirDeckSemMateriaisSemErroQuandoListaDeMateriaisVazia() {
		Deck deck = criarDeckExistente(10L, USUARIO_ID);
		when(deckRepository.findByIdAndUsuarioId(10L, USUARIO_ID)).thenReturn(Optional.of(deck));

		deckService.excluir(10L);

		verify(arquivoFisicoService).excluirTodos(List.of());
		verify(deckRepository).delete(deck);
	}

	private Deck criarDeckExistente(Long id, Long usuarioId) {
		Usuario usuario = new Usuario();
		usuario.setId(usuarioId);

		Deck deck = new Deck();
		deck.setId(id);
		deck.setUsuario(usuario);
		deck.setTitulo("Anatomia");
		deck.setDescricao("Sistema cardiovascular");
		deck.setCriadoEm(LocalDateTime.now());
		deck.setAtualizadoEm(LocalDateTime.now());
		return deck;
	}

}
