package com.tcc.plataformaestudos.flashcard;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.config.AcessoNegadoException;
import com.tcc.plataformaestudos.config.RecursoNaoEncontradoException;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.usuario.SecurityUtils;

import lombok.RequiredArgsConstructor;

/**
 * UC05 — Criar/editar/excluir flashcard (manual e via confirmação de
 * sugestões da IA) e UC06 (mnemônico). RN01 é garantida por
 * {@link DeckService#buscarDeckDoUsuarioAutenticado(Long)} (endpoints
 * escopados a um deck) e por {@link #buscarFlashcardDoUsuarioAutenticado(Long)}
 * (endpoints escopados a um flashcard individual — reutilizável no futuro
 * pelo fluxo de estudo, UC07/UC08). RN04 marca a origem (MANUAL ou IA). RN05
 * é implementada em confirmarSugestoes: apenas os aceitos são persistidos.
 * RN17: o `topico` de cada sugestão aceita (gerado em UC04/UC12) é persistido
 * junto; para flashcards manuais o campo é opcional.
 */
@Service
@RequiredArgsConstructor
public class FlashcardService {

	private static final Logger log = LoggerFactory.getLogger(FlashcardService.class);

	private final FlashcardRepository flashcardRepository;
	private final DeckService deckService;

	@Transactional(readOnly = true)
	public List<FlashcardResponseDTO> listar(Long deckId) {
		deckService.buscarDeckDoUsuarioAutenticado(deckId);

		return flashcardRepository.findByDeckId(deckId).stream()
				.map(FlashcardResponseDTO::fromEntity)
				.toList();
	}

	@Transactional
	public FlashcardResponseDTO criarManual(Long deckId, FlashcardRequestDTO request) {
		Deck deck = deckService.buscarDeckDoUsuarioAutenticado(deckId);

		Flashcard flashcard = new Flashcard();
		flashcard.setDeck(deck);
		flashcard.setPergunta(request.pergunta());
		flashcard.setResposta(request.resposta());
		flashcard.setMnemonico(request.mnemonico());
		flashcard.setTopico(request.topico());
		flashcard.setOrigem(OrigemFlashcard.MANUAL);

		Flashcard salvo = flashcardRepository.save(flashcard);
		log.info("Flashcard manual criado: flashcardId={}, deckId={}", salvo.getId(), deckId);

		return FlashcardResponseDTO.fromEntity(salvo);
	}

	@Transactional
	public List<FlashcardResponseDTO> confirmarSugestoes(Long deckId, ConfirmarSugestoesRequestDTO request) {
		Deck deck = deckService.buscarDeckDoUsuarioAutenticado(deckId);

		List<Flashcard> aceitos = request.sugestoes().stream()
				.filter(SugestaoConfirmacaoDTO::aceitar)
				.map(sugestao -> criarFlashcardIA(deck, sugestao))
				.map(flashcardRepository::save)
				.toList();

		log.info("Sugestões confirmadas: deckId={}, aceitas={}, descartadas={}",
				deckId, aceitos.size(), request.sugestoes().size() - aceitos.size());

		return aceitos.stream().map(FlashcardResponseDTO::fromEntity).toList();
	}

	@Transactional
	public FlashcardResponseDTO atualizar(Long flashcardId, FlashcardRequestDTO request) {
		Flashcard flashcard = buscarFlashcardDoUsuarioAutenticado(flashcardId);
		flashcard.setPergunta(request.pergunta());
		flashcard.setResposta(request.resposta());
		flashcard.setMnemonico(request.mnemonico());
		flashcard.setTopico(request.topico());

		Flashcard atualizado = flashcardRepository.save(flashcard);
		log.info("Flashcard atualizado: flashcardId={}", flashcardId);

		return FlashcardResponseDTO.fromEntity(atualizado);
	}

	@Transactional
	public void excluir(Long flashcardId) {
		Flashcard flashcard = buscarFlashcardDoUsuarioAutenticado(flashcardId);
		flashcardRepository.delete(flashcard);
		log.info("Flashcard excluído: flashcardId={}", flashcardId);
	}

	private Flashcard criarFlashcardIA(Deck deck, SugestaoConfirmacaoDTO sugestao) {
		Flashcard flashcard = new Flashcard();
		flashcard.setDeck(deck);
		flashcard.setPergunta(sugestao.pergunta());
		flashcard.setResposta(sugestao.resposta());
		flashcard.setTopico(sugestao.topico());
		flashcard.setOrigem(OrigemFlashcard.IA);
		return flashcard;
	}

	/**
	 * Centraliza RN01 para um flashcard individual: busca e garante que
	 * pertence (via deck) ao usuário autenticado, sem carregar a entidade de
	 * outro usuário além do necessário para essa checagem. 404 se não existe;
	 * 403 se existe mas é de outro usuário. Público para reuso por
	 * editar/excluir e, futuramente, pelo fluxo de estudo (UC07/UC08).
	 */
	public Flashcard buscarFlashcardDoUsuarioAutenticado(Long flashcardId) {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();

		return flashcardRepository.findByIdAndDeckUsuarioId(flashcardId, usuarioId)
				.orElseGet(() -> {
					if (flashcardRepository.existsById(flashcardId)) {
						throw new AcessoNegadoException("Você não tem permissão para acessar este flashcard");
					}
					throw new RecursoNaoEncontradoException("Flashcard não encontrado");
				});
	}

}
