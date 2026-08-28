package com.tcc.plataformaestudos.flashcard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.usuario.Usuario;
import com.tcc.plataformaestudos.usuario.UsuarioAutenticado;

@ExtendWith(MockitoExtension.class)
class FlashcardServiceTest {

	private static final Long USUARIO_ID = 1L;
	private static final Long DECK_ID = 10L;
	private static final Long FLASHCARD_ID = 100L;

	@Mock
	private FlashcardRepository flashcardRepository;

	@Mock
	private DeckService deckService;

	@InjectMocks
	private FlashcardService flashcardService;

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

	private Flashcard flashcardExistente() {
		Usuario usuario = new Usuario();
		usuario.setId(USUARIO_ID);

		Deck deck = new Deck();
		deck.setId(DECK_ID);
		deck.setUsuario(usuario);

		Flashcard flashcard = new Flashcard();
		flashcard.setId(FLASHCARD_ID);
		flashcard.setDeck(deck);
		flashcard.setPergunta("Pergunta original");
		flashcard.setResposta("Resposta original");
		flashcard.setOrigem(OrigemFlashcard.MANUAL);
		return flashcard;
	}

	@Test
	void deveListarFlashcardsDoDeck() {
		Deck deck = new Deck();
		deck.setId(DECK_ID);
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);
		when(flashcardRepository.findByDeckId(DECK_ID)).thenReturn(List.of(flashcardExistente()));

		List<FlashcardResponseDTO> resposta = flashcardService.listar(DECK_ID);

		assertThat(resposta).hasSize(1);
		assertThat(resposta.get(0).id()).isEqualTo(FLASHCARD_ID);
	}

	@Test
	void deveCriarFlashcardManualComSucesso() {
		Deck deck = new Deck();
		deck.setId(DECK_ID);
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);
		when(flashcardRepository.save(any(Flashcard.class))).thenAnswer(invocation -> {
			Flashcard flashcard = invocation.getArgument(0);
			flashcard.setId(FLASHCARD_ID);
			return flashcard;
		});

		FlashcardRequestDTO request = new FlashcardRequestDTO("O que é mitose?", "Divisão celular.", "Mito = divisão", "Biologia");

		FlashcardResponseDTO resposta = flashcardService.criarManual(DECK_ID, request);

		assertThat(resposta.origem()).isEqualTo(OrigemFlashcard.MANUAL);
		assertThat(resposta.pergunta()).isEqualTo("O que é mitose?");
		assertThat(resposta.mnemonico()).isEqualTo("Mito = divisão");
		assertThat(resposta.topico()).isEqualTo("Biologia");
	}

	@Test
	void deveFalharValidacaoAntesDeChegarNoRepositorioQuandoPerguntaVazia() {
		Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
		FlashcardRequestDTO request = new FlashcardRequestDTO("", "Resposta qualquer", null, null);

		Set<ConstraintViolation<FlashcardRequestDTO>> violacoes = validator.validate(request);

		assertThat(violacoes).isNotEmpty();
		verify(flashcardRepository, never()).save(any());
	}

	@Test
	void deveAtualizarFlashcardComSucessoQuandoPertenceAoUsuario() {
		Flashcard flashcard = flashcardExistente();
		when(flashcardRepository.findByIdAndDeckUsuarioId(FLASHCARD_ID, USUARIO_ID)).thenReturn(Optional.of(flashcard));
		when(flashcardRepository.save(flashcard)).thenReturn(flashcard);

		FlashcardRequestDTO request = new FlashcardRequestDTO("Nova pergunta", "Nova resposta", "Novo mnemônico", "Novo tópico");
		FlashcardResponseDTO resposta = flashcardService.atualizar(FLASHCARD_ID, request);

		assertThat(resposta.pergunta()).isEqualTo("Nova pergunta");
		assertThat(resposta.resposta()).isEqualTo("Nova resposta");
		assertThat(resposta.mnemonico()).isEqualTo("Novo mnemônico");
		assertThat(resposta.topico()).isEqualTo("Novo tópico");
	}

	@Test
	void deveLancarAcessoNegadoExceptionAoAtualizarFlashcardDeOutroUsuario() {
		when(flashcardRepository.findByIdAndDeckUsuarioId(FLASHCARD_ID, USUARIO_ID)).thenReturn(Optional.empty());
		when(flashcardRepository.existsById(FLASHCARD_ID)).thenReturn(true);

		FlashcardRequestDTO request = new FlashcardRequestDTO("Pergunta", "Resposta", null, null);

		assertThatThrownBy(() -> flashcardService.atualizar(FLASHCARD_ID, request))
				.isInstanceOf(AcessoNegadoException.class);
	}

	@Test
	void deveExcluirFlashcardComSucessoQuandoPertenceAoUsuario() {
		Flashcard flashcard = flashcardExistente();
		when(flashcardRepository.findByIdAndDeckUsuarioId(FLASHCARD_ID, USUARIO_ID)).thenReturn(Optional.of(flashcard));

		flashcardService.excluir(FLASHCARD_ID);

		verify(flashcardRepository).delete(flashcard);
	}

	@Test
	void deveLancarAcessoNegadoExceptionAoExcluirFlashcardDeOutroUsuario() {
		when(flashcardRepository.findByIdAndDeckUsuarioId(FLASHCARD_ID, USUARIO_ID)).thenReturn(Optional.empty());
		when(flashcardRepository.existsById(FLASHCARD_ID)).thenReturn(true);

		assertThatThrownBy(() -> flashcardService.excluir(FLASHCARD_ID))
				.isInstanceOf(AcessoNegadoException.class);
	}

	@Test
	void deveConfirmarApenasSugestoesAceitasComOrigemIaEDescartarAsDemais() {
		Deck deck = new Deck();
		deck.setId(DECK_ID);
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);
		when(flashcardRepository.save(any(Flashcard.class))).thenAnswer(invocation -> invocation.getArgument(0));

		ConfirmarSugestoesRequestDTO request = new ConfirmarSugestoesRequestDTO(List.of(
				new SugestaoConfirmacaoDTO("O que é mitose?", "Divisão celular.", true, "Biologia"),
				new SugestaoConfirmacaoDTO("Pergunta descartada", "Resposta descartada", false, "Biologia"),
				new SugestaoConfirmacaoDTO("O que é meiose?", "Divisão celular reducional.", true, null)));

		List<FlashcardResponseDTO> criados = flashcardService.confirmarSugestoes(DECK_ID, request);

		assertThat(criados).hasSize(2);
		assertThat(criados).allSatisfy(f -> assertThat(f.origem()).isEqualTo(OrigemFlashcard.IA));
		assertThat(criados.get(0).pergunta()).isEqualTo("O que é mitose?");
		assertThat(criados.get(0).topico()).isEqualTo("Biologia");
		assertThat(criados.get(1).pergunta()).isEqualTo("O que é meiose?");
		assertThat(criados.get(1).topico()).isNull();
		verify(flashcardRepository, times(2)).save(any(Flashcard.class));
	}

	@Test
	void naoDevePersistirNadaQuandoTodasAsSugestoesForemDescartadas() {
		Deck deck = new Deck();
		deck.setId(DECK_ID);
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);

		ConfirmarSugestoesRequestDTO request = new ConfirmarSugestoesRequestDTO(List.of(
				new SugestaoConfirmacaoDTO("Pergunta descartada", "Resposta descartada", false, null)));

		List<FlashcardResponseDTO> criados = flashcardService.confirmarSugestoes(DECK_ID, request);

		assertThat(criados).isEmpty();
		verify(flashcardRepository, never()).save(any());
	}

}
