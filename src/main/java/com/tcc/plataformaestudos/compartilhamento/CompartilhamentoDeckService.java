package com.tcc.plataformaestudos.compartilhamento;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.config.RecursoNaoEncontradoException;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;

import lombok.RequiredArgsConstructor;

/**
 * UC29 — Compartilhar deck via link público somente leitura. RN01 (dono do
 * deck) é garantida reutilizando {@link DeckService#buscarDeckDoUsuarioAutenticado(Long)}
 * em toda operação que gerencia o link; o acesso público (RN37) não passa
 * por essa checagem — é liberado por token válido e ativo.
 */
@Service
@RequiredArgsConstructor
public class CompartilhamentoDeckService {

	private static final Logger log = LoggerFactory.getLogger(CompartilhamentoDeckService.class);

	private final CompartilhamentoDeckRepository compartilhamentoDeckRepository;
	private final FlashcardRepository flashcardRepository;
	private final DeckService deckService;

	@Transactional(readOnly = true)
	public CompartilhamentoDeckResponseDTO buscarStatus(Long deckId) {
		deckService.buscarDeckDoUsuarioAutenticado(deckId);

		return compartilhamentoDeckRepository.findByDeckId(deckId)
				.map(CompartilhamentoDeckResponseDTO::fromEntity)
				.orElseGet(CompartilhamentoDeckResponseDTO::inativo);
	}

	/** RN38: gera (ou regenera, se já existir/estiver revogado) um token novo. */
	@Transactional
	public CompartilhamentoDeckResponseDTO ativar(Long deckId) {
		Deck deck = deckService.buscarDeckDoUsuarioAutenticado(deckId);

		CompartilhamentoDeck compartilhamento = compartilhamentoDeckRepository.findByDeckId(deckId)
				.orElseGet(() -> {
					CompartilhamentoDeck novo = new CompartilhamentoDeck();
					novo.setDeck(deck);
					return novo;
				});

		compartilhamento.ativar();
		CompartilhamentoDeck salvo = compartilhamentoDeckRepository.save(compartilhamento);
		log.info("Link de compartilhamento ativado: deckId={}", deckId);

		return CompartilhamentoDeckResponseDTO.fromEntity(salvo);
	}

	@Transactional
	public void revogar(Long deckId) {
		deckService.buscarDeckDoUsuarioAutenticado(deckId);

		CompartilhamentoDeck compartilhamento = compartilhamentoDeckRepository.findByDeckId(deckId)
				.orElseThrow(() -> new RecursoNaoEncontradoException("Este deck não possui link de compartilhamento"));

		compartilhamento.revogar();
		compartilhamentoDeckRepository.save(compartilhamento);
		log.info("Link de compartilhamento revogado: deckId={}", deckId);
	}

	/** RN37: acesso público, sem dono — 404 tanto para token inexistente quanto revogado (não distingue os dois). */
	@Transactional(readOnly = true)
	public DeckCompartilhadoResponseDTO buscarPorToken(String token) {
		CompartilhamentoDeck compartilhamento = compartilhamentoDeckRepository.findByTokenAndAtivoTrue(token)
				.orElseThrow(() -> new RecursoNaoEncontradoException("Link de compartilhamento inválido ou revogado"));

		Deck deck = compartilhamento.getDeck();
		List<Flashcard> flashcards = flashcardRepository.findByDeckId(deck.getId());

		return DeckCompartilhadoResponseDTO.fromEntity(deck, flashcards);
	}

}
