package com.tcc.plataformaestudos.revisao;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.usuario.Usuario;
import com.tcc.plataformaestudos.usuario.UsuarioRepository;

import lombok.RequiredArgsConstructor;

/**
 * Extrai de {@link LembreteRevisaoService} apenas a parte que toca o banco,
 * como uma classe/bean separada: {@code @Transactional} não tem efeito em
 * chamadas de um método para outro dentro da MESMA classe (a auto-invocação
 * não passa pelo proxy do Spring que abre/fecha a transação) — por isso os
 * métodos abaixo precisam estar num bean à parte, injetado no service.
 */
@Service
@RequiredArgsConstructor
class LembreteRevisaoDadosService {

	private final RevisaoFlashcardRepository revisaoFlashcardRepository;
	private final UsuarioRepository usuarioRepository;

	@Transactional(readOnly = true)
	List<LembreteRevisaoDTO> montarLembretesDeTodosOsUsuarios() {
		List<Flashcard> pendentes = revisaoFlashcardRepository.findTodosPendentesDeRevisao(LocalDate.now());

		Map<Long, List<Flashcard>> porUsuarioId = pendentes.stream()
				.collect(Collectors.groupingBy(f -> f.getDeck().getUsuario().getId()));

		return porUsuarioId.values().stream().map(this::paraLembreteDTO).toList();
	}

	@Transactional(readOnly = true)
	LembreteRevisaoDTO montarLembreteDoUsuario(Long usuarioId) {
		Usuario usuario = usuarioRepository.getReferenceById(usuarioId);
		List<Flashcard> pendentes = revisaoFlashcardRepository.findPendentesDeRevisaoDoUsuario(usuarioId, LocalDate.now());

		return new LembreteRevisaoDTO(usuario.getEmail(), usuario.getNome(), pendentes.size(), agruparPorDeck(pendentes));
	}

	private LembreteRevisaoDTO paraLembreteDTO(List<Flashcard> flashcardsDoUsuario) {
		Usuario usuario = flashcardsDoUsuario.get(0).getDeck().getUsuario();
		return new LembreteRevisaoDTO(
				usuario.getEmail(), usuario.getNome(), flashcardsDoUsuario.size(), agruparPorDeck(flashcardsDoUsuario));
	}

	private Map<String, Long> agruparPorDeck(List<Flashcard> flashcards) {
		return flashcards.stream()
				.collect(Collectors.groupingBy(f -> f.getDeck().getTitulo(), Collectors.counting()));
	}

}
