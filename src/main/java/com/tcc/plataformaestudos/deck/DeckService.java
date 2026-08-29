package com.tcc.plataformaestudos.deck;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.config.AcessoNegadoException;
import com.tcc.plataformaestudos.config.RecursoNaoEncontradoException;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;
import com.tcc.plataformaestudos.usuario.SecurityUtils;
import com.tcc.plataformaestudos.usuario.Usuario;
import com.tcc.plataformaestudos.usuario.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * UC02 — Criar/gerenciar deck. RN03 (deck pertence a exatamente um usuário) e
 * RN01 (isolamento por usuário) são garantidas em
 * {@link #buscarDeckDoUsuarioAutenticado(Long)}, ponto único reutilizado por
 * buscarPorId/atualizar/excluir.
 */
@Service
@RequiredArgsConstructor
public class DeckService {

	private static final Logger log = LoggerFactory.getLogger(DeckService.class);

	private final DeckRepository deckRepository;
	private final UsuarioRepository usuarioRepository;
	private final FlashcardRepository flashcardRepository;

	@Transactional
	public DeckResponseDTO criar(DeckRequestDTO request) {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();
		Usuario usuario = usuarioRepository.getReferenceById(usuarioId);

		Deck deck = new Deck();
		deck.setUsuario(usuario);
		deck.setTitulo(request.titulo());
		deck.setDescricao(request.descricao());

		Deck salvo = deckRepository.save(deck);
		log.info("Deck criado: deckId={}, usuarioId={}", salvo.getId(), usuarioId);

		return DeckResponseDTO.fromEntity(salvo, 0);
	}

	@Transactional(readOnly = true)
	public List<DeckResponseDTO> listar() {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();

		return deckRepository.findByUsuarioId(usuarioId).stream()
				.map(deck -> DeckResponseDTO.fromEntity(deck, flashcardRepository.countByDeckId(deck.getId())))
				.toList();
	}

	@Transactional(readOnly = true)
	public DeckResponseDTO buscarPorId(Long deckId) {
		Deck deck = buscarDeckDoUsuarioAutenticado(deckId);
		return DeckResponseDTO.fromEntity(deck, flashcardRepository.countByDeckId(deckId));
	}

	@Transactional
	public DeckResponseDTO atualizar(Long deckId, DeckRequestDTO request) {
		Deck deck = buscarDeckDoUsuarioAutenticado(deckId);
		deck.setTitulo(request.titulo());
		deck.setDescricao(request.descricao());

		Deck atualizado = deckRepository.save(deck);
		log.info("Deck atualizado: deckId={}", deckId);

		return DeckResponseDTO.fromEntity(atualizado, flashcardRepository.countByDeckId(deckId));
	}

	@Transactional
	public void excluir(Long deckId) {
		Deck deck = buscarDeckDoUsuarioAutenticado(deckId);
		deckRepository.delete(deck);
		log.info("Deck excluído: deckId={}", deckId);
	}

	/**
	 * Centraliza RN01: busca o deck e garante que pertence ao usuário
	 * autenticado, sem carregar a entidade de outro usuário além do necessário
	 * para essa checagem. 404 se o deck não existe; 403 se existe mas é de
	 * outro usuário. Público para reuso por outros services que dependem de
	 * um deck já verificado (ex.: MaterialOrigemService, UC03).
	 */
	public Deck buscarDeckDoUsuarioAutenticado(Long deckId) {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();

		return deckRepository.findByIdAndUsuarioId(deckId, usuarioId)
				.orElseGet(() -> {
					if (deckRepository.existsById(deckId)) {
						throw new AcessoNegadoException("Você não tem permissão para acessar este deck");
					}
					throw new RecursoNaoEncontradoException("Deck não encontrado");
				});
	}

}
