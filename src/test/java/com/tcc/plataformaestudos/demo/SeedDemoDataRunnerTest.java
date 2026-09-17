package com.tcc.plataformaestudos.demo;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckRepository;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;
import com.tcc.plataformaestudos.quiz.TentativaQuizRepository;
import com.tcc.plataformaestudos.revisao.RevisaoFlashcardRepository;
import com.tcc.plataformaestudos.usuario.Usuario;
import com.tcc.plataformaestudos.usuario.UsuarioRepository;

/**
 * Garante que {@link SeedDemoDataRunner} não quebra ao subir a aplicação e
 * de fato povoa uma conta de demonstração usável (decks, flashcards com
 * histórico de revisão e ao menos uma tentativa de quiz) — sem isso, um erro
 * no seeder só seria descoberto na hora da apresentação.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "app.seed-demo.enabled=true")
class SeedDemoDataRunnerTest {

	@Autowired
	private UsuarioRepository usuarioRepository;

	@Autowired
	private DeckRepository deckRepository;

	@Autowired
	private FlashcardRepository flashcardRepository;

	@Autowired
	private RevisaoFlashcardRepository revisaoFlashcardRepository;

	@Autowired
	private TentativaQuizRepository tentativaQuizRepository;

	@Test
	void deveCriarContaDemoComDecksFlashcardsHistoricoDeRevisaoETentativasDeQuiz() {
		Optional<Usuario> usuario = usuarioRepository.findByEmail("banca@studyweb.local");
		assertThat(usuario).isPresent();
		assertThat(usuario.get().isEmailVerificado()).isTrue();

		List<Deck> decks = deckRepository.findByUsuarioId(usuario.get().getId());
		assertThat(decks).hasSize(3);

		List<Flashcard> flashcards = decks.stream().flatMap(d -> flashcardRepository.findByDeckId(d.getId()).stream()).toList();
		assertThat(flashcards).hasSize(36);

		long comHistorico = flashcards.stream()
				.filter(f -> !revisaoFlashcardRepository.findByFlashcardIdIn(List.of(f.getId())).isEmpty())
				.count();
		assertThat(comHistorico).isGreaterThan(0).isLessThan(flashcards.size());

		assertThat(tentativaQuizRepository.count()).isGreaterThanOrEqualTo(2);
	}

}
