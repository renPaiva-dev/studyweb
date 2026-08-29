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

import com.tcc.plataformaestudos.config.AcessoNegadoException;
import com.tcc.plataformaestudos.config.RecursoNaoEncontradoException;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;
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
		when(flashcardRepository.countByDeckId(10L)).thenReturn(14L);

		List<DeckResponseDTO> resposta = deckService.listar();

		assertThat(resposta).hasSize(1);
		assertThat(resposta.get(0).id()).isEqualTo(10L);
		assertThat(resposta.get(0).totalFlashcards()).isEqualTo(14);
	}

	@Test
	void deveBuscarPorIdComSucessoQuandoDeckPertenceAoUsuario() {
		Deck deck = criarDeckExistente(10L, USUARIO_ID);
		when(deckRepository.findByIdAndUsuarioId(10L, USUARIO_ID)).thenReturn(Optional.of(deck));

		DeckResponseDTO resposta = deckService.buscarPorId(10L);

		assertThat(resposta.id()).isEqualTo(10L);
	}

	@Test
	void deveLancarAcessoNegadoExceptionQuandoDeckPertenceAOutroUsuario() {
		when(deckRepository.findByIdAndUsuarioId(10L, USUARIO_ID)).thenReturn(Optional.empty());
		when(deckRepository.existsById(10L)).thenReturn(true);

		assertThatThrownBy(() -> deckService.buscarPorId(10L))
				.isInstanceOf(AcessoNegadoException.class);
	}

	@Test
	void deveLancarRecursoNaoEncontradoExceptionQuandoDeckNaoExiste() {
		when(deckRepository.findByIdAndUsuarioId(10L, USUARIO_ID)).thenReturn(Optional.empty());
		when(deckRepository.existsById(10L)).thenReturn(false);

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
