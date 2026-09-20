package com.tcc.plataformaestudos.colecao;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.config.RecursoNaoEncontradoException;
import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckRepository;
import com.tcc.plataformaestudos.flashcard.ContagemFlashcardsPorDeckDTO;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;
import com.tcc.plataformaestudos.usuario.SecurityUtils;
import com.tcc.plataformaestudos.usuario.Usuario;
import com.tcc.plataformaestudos.usuario.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * UC33 — organizar decks em coleções. RN01/RN42 (isolamento por usuário) são
 * garantidas em {@link #buscarColecaoDoUsuarioAutenticado(Long)}, ponto único
 * reutilizado por buscarPorId/atualizar/excluir — mesmo padrão de
 * {@code DeckService#buscarDeckDoUsuarioAutenticado} (B15): sempre 404, nunca
 * 403, tanto para coleção inexistente quanto para coleção de outro usuário.
 */
@Service
@RequiredArgsConstructor
public class ColecaoService {

	private static final Logger log = LoggerFactory.getLogger(ColecaoService.class);

	private final ColecaoRepository colecaoRepository;
	private final UsuarioRepository usuarioRepository;
	private final DeckRepository deckRepository;
	private final FlashcardRepository flashcardRepository;

	@Transactional
	public ColecaoResponseDTO criar(ColecaoRequestDTO request) {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();
		Usuario usuario = usuarioRepository.getReferenceById(usuarioId);

		Colecao colecao = new Colecao();
		colecao.setUsuario(usuario);
		colecao.setNome(request.nome());
		colecao.setDescricao(request.descricao());

		Colecao salva = colecaoRepository.save(colecao);
		log.info("Coleção criada: colecaoId={}, usuarioId={}", salva.getId(), usuarioId);

		return ColecaoResponseDTO.fromEntity(salva, 0);
	}

	/** Mesmo padrão de {@code DeckService#listar} (B4): contagem agregada, sem N+1. */
	@Transactional(readOnly = true)
	public List<ColecaoResponseDTO> listar() {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();

		List<Colecao> colecoes = colecaoRepository.findByUsuarioId(usuarioId);
		if (colecoes.isEmpty()) {
			return List.of();
		}

		List<Long> colecaoIds = colecoes.stream().map(Colecao::getId).toList();
		Map<Long, Long> totalDecksPorColecao = deckRepository.contarPorColecaoIdAgrupado(colecaoIds).stream()
				.collect(Collectors.toMap(ContagemDecksPorColecaoDTO::colecaoId, ContagemDecksPorColecaoDTO::total));

		return colecoes.stream()
				.map(colecao -> ColecaoResponseDTO.fromEntity(colecao, totalDecksPorColecao.getOrDefault(colecao.getId(), 0L)))
				.toList();
	}

	@Transactional(readOnly = true)
	public ColecaoDetalheDTO buscarPorId(Long colecaoId) {
		Colecao colecao = buscarColecaoDoUsuarioAutenticado(colecaoId);

		List<Deck> decks = deckRepository.findByColecaoId(colecaoId);
		Map<Long, Long> totalFlashcardsPorDeck;
		if (decks.isEmpty()) {
			totalFlashcardsPorDeck = Map.of();
		} else {
			List<Long> deckIds = decks.stream().map(Deck::getId).toList();
			totalFlashcardsPorDeck = flashcardRepository.contarPorDeckIdAgrupado(deckIds).stream()
					.collect(Collectors.toMap(ContagemFlashcardsPorDeckDTO::deckId, ContagemFlashcardsPorDeckDTO::total));
		}

		Map<Long, Long> totalFlashcardsPorDeckFinal = totalFlashcardsPorDeck;
		List<DeckResumoDTO> decksResumo = decks.stream()
				.map(deck -> new DeckResumoDTO(deck.getId(), deck.getTitulo(),
						totalFlashcardsPorDeckFinal.getOrDefault(deck.getId(), 0L).intValue()))
				.toList();

		return ColecaoDetalheDTO.fromEntity(colecao, decksResumo);
	}

	@Transactional
	public ColecaoResponseDTO atualizar(Long colecaoId, ColecaoRequestDTO request) {
		Colecao colecao = buscarColecaoDoUsuarioAutenticado(colecaoId);
		colecao.setNome(request.nome());
		colecao.setDescricao(request.descricao());

		Colecao atualizada = colecaoRepository.save(colecao);
		log.info("Coleção atualizada: colecaoId={}", colecaoId);

		long totalDecks = deckRepository.findByColecaoId(colecaoId).size();
		return ColecaoResponseDTO.fromEntity(atualizada, totalDecks);
	}

	/**
	 * RN42: exclui a coleção — os decks associados não são excluídos, apenas
	 * desvinculados (`colecao_id` volta a NULL via FK `ON DELETE SET NULL`,
	 * ver migration V11), diferente da cascata de exclusão de deck (RN13).
	 */
	@Transactional
	public void excluir(Long colecaoId) {
		Colecao colecao = buscarColecaoDoUsuarioAutenticado(colecaoId);
		colecaoRepository.delete(colecao);
		log.info("Coleção excluída: colecaoId={}", colecaoId);
	}

	/**
	 * Centraliza RN01/RN42: busca a coleção e garante que pertence ao usuário
	 * autenticado. Sempre 404 — nunca 403 — mesmo padrão de
	 * {@code DeckService#buscarDeckDoUsuarioAutenticado} (evita enumeração de
	 * IDs de coleção de outros usuários).
	 */
	public Colecao buscarColecaoDoUsuarioAutenticado(Long colecaoId) {
		Long usuarioId = SecurityUtils.obterUsuarioAutenticadoId();

		return colecaoRepository.findByIdAndUsuarioId(colecaoId, usuarioId)
				.orElseThrow(() -> new RecursoNaoEncontradoException("Coleção não encontrada"));
	}

}
