package com.tcc.plataformaestudos.deck;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.config.RecursoNaoEncontradoException;
import com.tcc.plataformaestudos.flashcard.ContagemFlashcardsPorDeckDTO;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;
import com.tcc.plataformaestudos.material.ArquivoFisicoService;
import com.tcc.plataformaestudos.usuario.SecurityUtils;
import com.tcc.plataformaestudos.usuario.Usuario;
import com.tcc.plataformaestudos.usuario.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * UC02 — Criar/gerenciar deck. RN03 (deck pertence a exatamente um usuário) e
 * RN01 (isolamento por usuário) são garantidas em
 * {@link #buscarDeckDoUsuarioAutenticado(Long)}, ponto único reutilizado por
 * buscarPorId/atualizar/excluir. B15: essa checagem unifica em 404 tanto o
 * caso "deck não existe" quanto "deck existe mas é de outro usuário", para
 * não permitir enumerar IDs de deck de outros usuários por diferença de
 * status HTTP — mesmo cuidado já tomado no lado público
 * (CompartilhamentoDeckService).
 */
@Service
@RequiredArgsConstructor
public class DeckService {

	private static final Logger log = LoggerFactory.getLogger(DeckService.class);

	private final DeckRepository deckRepository;
	private final UsuarioRepository usuarioRepository;
	private final FlashcardRepository flashcardRepository;
	private final ArquivoFisicoService arquivoFisicoService;

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

	/**
	 * B4: em vez de uma query {@code COUNT} por deck (N+1), busca a contagem
	 * de flashcards de todos os decks do usuário numa única consulta
	 * agregada, e usa o mapa resultante para montar cada
	 * {@link DeckResponseDTO}.
	 */
	@Transactional(readOnly = true)
	public List<DeckResponseDTO> listar() {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();

		List<Deck> decks = deckRepository.findByUsuarioId(usuarioId);
		if (decks.isEmpty()) {
			return List.of();
		}

		List<Long> deckIds = decks.stream().map(Deck::getId).toList();
		Map<Long, Long> totalFlashcardsPorDeck = flashcardRepository.contarPorDeckIdAgrupado(deckIds).stream()
				.collect(Collectors.toMap(ContagemFlashcardsPorDeckDTO::deckId, ContagemFlashcardsPorDeckDTO::total));

		return decks.stream()
				.map(deck -> DeckResponseDTO.fromEntity(deck, totalFlashcardsPorDeck.getOrDefault(deck.getId(), 0L)))
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

	/**
	 * B1/UC22/RN29: antes de excluir o deck, apaga o arquivo físico de cada
	 * material associado — a cascata do JPA/banco só remove as linhas de
	 * {@code material_origem}, nunca o arquivo em disco. Sem isso, o arquivo
	 * fica órfão em {@code uploads/{deckId}/} para sempre.
	 */
	@Transactional
	public void excluir(Long deckId) {
		Deck deck = buscarDeckDoUsuarioAutenticado(deckId);
		arquivoFisicoService.excluirTodos(deck.getMateriais());
		deckRepository.delete(deck);
		log.info("Deck excluído: deckId={}", deckId);
	}

	/**
	 * Centraliza RN01: busca o deck e garante que pertence ao usuário
	 * autenticado, sem carregar a entidade de outro usuário além do necessário
	 * para essa checagem. B15: sempre 404 — tanto quando o deck não existe
	 * quanto quando existe mas pertence a outro usuário — para não permitir
	 * enumerar deck IDs de outros usuários pela diferença entre 403 e 404.
	 * Público para reuso por outros services que dependem de um deck já
	 * verificado (ex.: MaterialOrigemService, UC03).
	 */
	public Deck buscarDeckDoUsuarioAutenticado(Long deckId) {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();

		return deckRepository.findByIdAndUsuarioId(deckId, usuarioId)
				.orElseThrow(() -> new RecursoNaoEncontradoException("Deck não encontrado"));
	}

}
