package com.tcc.plataformaestudos.compartilhamento;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.tcc.plataformaestudos.config.RecursoNaoEncontradoException;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;

@ExtendWith(MockitoExtension.class)
class CompartilhamentoDeckServiceTest {

	private static final Long DECK_ID = 10L;

	@Mock
	private CompartilhamentoDeckRepository compartilhamentoDeckRepository;

	@Mock
	private FlashcardRepository flashcardRepository;

	@Mock
	private DeckService deckService;

	@InjectMocks
	private CompartilhamentoDeckService compartilhamentoDeckService;

	private Deck deck;

	@BeforeEach
	void configurarDeck() {
		deck = new Deck();
		deck.setId(DECK_ID);
		deck.setTitulo("Anatomia");
		deck.setDescricao("Sistema cardiovascular");
	}

	@Test
	void deveRetornarStatusInativoQuandoNuncaFoiCompartilhado() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);
		when(compartilhamentoDeckRepository.findByDeckId(DECK_ID)).thenReturn(Optional.empty());

		CompartilhamentoDeckResponseDTO resposta = compartilhamentoDeckService.buscarStatus(DECK_ID);

		assertThat(resposta.ativo()).isFalse();
		assertThat(resposta.token()).isNull();
	}

	@Test
	void deveAtivarCompartilhamentoGerandoNovoTokenNaPrimeiraVez() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);
		when(compartilhamentoDeckRepository.findByDeckId(DECK_ID)).thenReturn(Optional.empty());
		when(compartilhamentoDeckRepository.save(any(CompartilhamentoDeck.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

		CompartilhamentoDeckResponseDTO resposta = compartilhamentoDeckService.ativar(DECK_ID);

		assertThat(resposta.ativo()).isTrue();
		assertThat(resposta.token()).isNotBlank();
	}

	@Test
	void deveRegenerarTokenAoReativarCompartilhamentoJaExistente() {
		CompartilhamentoDeck existente = new CompartilhamentoDeck();
		existente.setDeck(deck);
		existente.setToken("token-antigo-revogado");
		existente.setAtivo(false);

		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);
		when(compartilhamentoDeckRepository.findByDeckId(DECK_ID)).thenReturn(Optional.of(existente));
		when(compartilhamentoDeckRepository.save(any(CompartilhamentoDeck.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

		CompartilhamentoDeckResponseDTO resposta = compartilhamentoDeckService.ativar(DECK_ID);

		assertThat(resposta.ativo()).isTrue();
		assertThat(resposta.token()).isNotEqualTo("token-antigo-revogado");
	}

	@Test
	void deveRevogarCompartilhamentoExistente() {
		CompartilhamentoDeck existente = new CompartilhamentoDeck();
		existente.setDeck(deck);
		existente.setToken("token-ativo");
		existente.setAtivo(true);

		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);
		when(compartilhamentoDeckRepository.findByDeckId(DECK_ID)).thenReturn(Optional.of(existente));

		compartilhamentoDeckService.revogar(DECK_ID);

		assertThat(existente.isAtivo()).isFalse();
		assertThat(existente.getRevogadoEm()).isNotNull();
		verify(compartilhamentoDeckRepository).save(existente);
	}

	@Test
	void deveLancarRecursoNaoEncontradoAoRevogarSemCompartilhamentoExistente() {
		when(deckService.buscarDeckDoUsuarioAutenticado(DECK_ID)).thenReturn(deck);
		when(compartilhamentoDeckRepository.findByDeckId(DECK_ID)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> compartilhamentoDeckService.revogar(DECK_ID))
				.isInstanceOf(RecursoNaoEncontradoException.class);
	}

	@Test
	void deveBuscarDeckPorTokenAtivo() {
		CompartilhamentoDeck existente = new CompartilhamentoDeck();
		existente.setDeck(deck);
		existente.setToken("token-valido");
		existente.setAtivo(true);

		Flashcard flashcard = new Flashcard();
		flashcard.setId(1L);
		flashcard.setPergunta("O que é a aorta?");
		flashcard.setResposta("A maior artéria do corpo humano.");

		when(compartilhamentoDeckRepository.findByTokenAndAtivoTrue("token-valido")).thenReturn(Optional.of(existente));
		when(flashcardRepository.findByDeckId(DECK_ID)).thenReturn(List.of(flashcard));

		DeckCompartilhadoResponseDTO resposta = compartilhamentoDeckService.buscarPorToken("token-valido");

		assertThat(resposta.titulo()).isEqualTo("Anatomia");
		assertThat(resposta.flashcards()).hasSize(1);
		assertThat(resposta.flashcards().get(0).pergunta()).isEqualTo("O que é a aorta?");
	}

	@Test
	void deveLancarRecursoNaoEncontradoParaTokenInvalidoOuRevogado() {
		when(compartilhamentoDeckRepository.findByTokenAndAtivoTrue("token-invalido")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> compartilhamentoDeckService.buscarPorToken("token-invalido"))
				.isInstanceOf(RecursoNaoEncontradoException.class);
	}

}
