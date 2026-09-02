package com.tcc.plataformaestudos.ia;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.dashboard.CriterioDesempenhoFlashcard;
import com.tcc.plataformaestudos.dashboard.DashboardRepository;
import com.tcc.plataformaestudos.dashboard.UltimaRevisaoComTopicoProjecao;
import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardRepository;

import lombok.RequiredArgsConstructor;

/**
 * UC13 — Obter recomendação de foco de estudo (RN18), incluído por UC04's
 * classificação de tópico (RN17) e detalhado em
 * Docs/extensao-recomendacao-foco-estudo.md. RN01 é garantida por
 * {@link DeckService#buscarDeckDoUsuarioAutenticado(Long)}. Reaproveita a
 * mesma projeção do detalhamento por tópico do dashboard (UC15/RN20 —
 * {@link DashboardRepository#buscarUltimaRevisaoComTopicoPorFlashcard(Long)})
 * e o mesmo critério de "em risco" de RN14
 * ({@link CriterioDesempenhoFlashcard#estaEmRisco(Integer, java.time.LocalDate)}) —
 * nenhuma regra de negócio duplicada, nenhuma tabela nova (a recomendação
 * nunca é persistida, RN18).
 *
 * <p>RN18 não define precisamente "maior concentração" nem "dados
 * suficientes" — decisões adotadas (ver Docs/extensao-recomendacao-foco-estudo.md
 * §1): concentração = contagem absoluta de flashcards em risco no tópico
 * (não percentual); "Sem categoria" (tópico nulo) nunca é elegível como
 * foco; dados suficientes = tópico vencedor com pelo menos
 * {@value #LIMIAR_MINIMO_FLASHCARDS_EM_RISCO} flashcards em risco (valor de
 * exemplo, mesmo espírito do "ex.: 15" da RN08).
 */
@Service
@RequiredArgsConstructor
public class RecomendacaoEstudoService {

	private static final Logger log = LoggerFactory.getLogger(RecomendacaoEstudoService.class);

	private static final int LIMIAR_MINIMO_FLASHCARDS_EM_RISCO = 3;
	private static final int MAXIMO_PERGUNTAS_NO_PROMPT = 10;
	private static final int MAXIMO_TENTATIVAS = 2;
	private static final String MENSAGEM_PADRAO =
			"Continue revisando normalmente — ainda não há dados suficientes para uma recomendação de foco.";

	private final DeckService deckService;
	private final DashboardRepository dashboardRepository;
	private final FlashcardRepository flashcardRepository;
	private final GeminiClient geminiClient;

	@Transactional(readOnly = true)
	public RecomendacaoEstudoResponseDTO gerarRecomendacao(Long deckId) {
		deckService.buscarDeckDoUsuarioAutenticado(deckId);

		List<UltimaRevisaoComTopicoProjecao> estados = dashboardRepository.buscarUltimaRevisaoComTopicoPorFlashcard(deckId);
		Optional<TopicoEmRisco> vencedor = escolherTopicoVencedor(estados);

		if (vencedor.isEmpty() || vencedor.get().idsEmRisco().size() < LIMIAR_MINIMO_FLASHCARDS_EM_RISCO) {
			log.info("Recomendação de foco de estudo: deckId={}, baseadoEmDados=false (dados insuficientes)", deckId);
			return new RecomendacaoEstudoResponseDTO(MENSAGEM_PADRAO, null, false);
		}

		TopicoEmRisco topicoVencedor = vencedor.get();
		List<Flashcard> flashcardsEmRisco = flashcardRepository.findAllById(topicoVencedor.idsEmRisco());
		String prompt = montarPrompt(topicoVencedor, flashcardsEmRisco);
		String recomendacao = gerarComRetry(deckId, prompt);

		log.info("Recomendação de foco de estudo: deckId={}, baseadoEmDados=true, topicoFoco={}",
				deckId, topicoVencedor.topico());
		return new RecomendacaoEstudoResponseDTO(recomendacao, topicoVencedor.topico(), true);
	}

	/**
	 * Agrupa por tópico (excluindo "Sem categoria" — {@code topico == null}
	 * nunca é elegível como foco), conta flashcards em risco (RN14) por
	 * grupo e descarta tópicos sem nenhum. O vencedor é o de maior contagem
	 * absoluta de flashcards em risco; empate é resolvido pelo maior
	 * percentual em risco do tópico; empate residual, pelo nome do tópico
	 * (só para determinismo — não é requisito de negócio).
	 */
	private Optional<TopicoEmRisco> escolherTopicoVencedor(List<UltimaRevisaoComTopicoProjecao> estados) {
		Map<String, List<UltimaRevisaoComTopicoProjecao>> porTopico = estados.stream()
				.filter(e -> e.topico() != null)
				.collect(Collectors.groupingBy(UltimaRevisaoComTopicoProjecao::topico));

		Comparator<TopicoEmRisco> criterioDeVitoria = Comparator
				.comparingInt((TopicoEmRisco c) -> c.idsEmRisco().size())
				.thenComparingDouble(c -> c.idsEmRisco().size() / (double) c.totalNoTopico())
				.thenComparing(Comparator.comparing(TopicoEmRisco::topico).reversed());

		return porTopico.entrySet().stream()
				.map(entrada -> montarTopicoEmRisco(entrada.getKey(), entrada.getValue()))
				.filter(candidato -> !candidato.idsEmRisco().isEmpty())
				.max(criterioDeVitoria);
	}

	private TopicoEmRisco montarTopicoEmRisco(String topico, List<UltimaRevisaoComTopicoProjecao> estadosDoTopico) {
		List<Long> idsEmRisco = estadosDoTopico.stream()
				.filter(e -> CriterioDesempenhoFlashcard.estaEmRisco(e.qualidadeResposta(), e.proximaRevisao()))
				.map(UltimaRevisaoComTopicoProjecao::flashcardId)
				.toList();

		return new TopicoEmRisco(topico, idsEmRisco, estadosDoTopico.size());
	}

	private String gerarComRetry(Long deckId, String prompt) {
		GeracaoRecomendacaoException ultimaFalha = null;

		for (int tentativa = 1; tentativa <= MAXIMO_TENTATIVAS; tentativa++) {
			log.info("Chamando API de IA para recomendação de foco de estudo: deckId={}, tentativa={}", deckId, tentativa);

			try {
				// Nota: geminiClient.gerarConteudo pode lançar GeracaoFlashcardsException
				// (não GeracaoRecomendacaoException) em falha de infraestrutura — dívida
				// pré-existente do GeminiClient (ver Docs/extensao-recomendacao-foco-estudo.md
				// §3). Ainda mapeia para 502 via NegocioException, só a mensagem/log
				// ficam menos precisos; não corrigido aqui de propósito.
				String textoGerado = geminiClient.gerarConteudo(prompt);
				String recomendacao = validarResposta(textoGerado);

				log.info("Recomendação de foco de estudo concluída: deckId={}, tentativa={}, status=SUCESSO",
						deckId, tentativa);
				return recomendacao;
			} catch (GeracaoRecomendacaoException e) {
				ultimaFalha = e;
				log.warn("Tentativa {} de gerar recomendação falhou: deckId={}, status=FALHA, motivo={}",
						tentativa, deckId, e.getMessage());
			}
		}

		log.error("Geração de recomendação esgotou as {} tentativas: deckId={}, status=FALHA", MAXIMO_TENTATIVAS, deckId);
		throw ultimaFalha;
	}

	private String validarResposta(String textoGerado) {
		if (textoGerado == null || textoGerado.isBlank()) {
			throw new GeracaoRecomendacaoException("IA não retornou nenhuma recomendação");
		}
		return textoGerado.trim();
	}

	private String montarPrompt(TopicoEmRisco topicoVencedor, List<Flashcard> flashcardsEmRisco) {
		String perguntas = flashcardsEmRisco.stream()
				.limit(MAXIMO_PERGUNTAS_NO_PROMPT)
				.map(flashcard -> "- " + flashcard.getPergunta())
				.collect(Collectors.joining("\n"));

		return """
				Você é um assistente de estudos. Um estudante está com dificuldade no
				tópico "%s": %d de %d flashcards desse tópico estão marcados como "em
				risco" (respostas recentes fracas ou revisão muito atrasada).

				Perguntas dos flashcards em risco desse tópico:
				%s

				Em até 2 frases, escreva uma recomendação curta, direta e motivadora de
				como o estudante deve focar seus próximos estudos nesse tópico. Não
				repita as perguntas, não dê a resposta de nenhuma delas. Responda em
				texto simples, sem markdown, sem aspas ao redor de toda a resposta.
				""".formatted(topicoVencedor.topico(), topicoVencedor.idsEmRisco().size(), topicoVencedor.totalNoTopico(), perguntas);
	}

	private record TopicoEmRisco(String topico, List<Long> idsEmRisco, int totalNoTopico) {
	}

}
