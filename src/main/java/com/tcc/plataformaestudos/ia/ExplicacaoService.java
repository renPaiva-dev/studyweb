package com.tcc.plataformaestudos.ia;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.flashcard.FlashcardService;
import com.tcc.plataformaestudos.material.MaterialOrigem;
import com.tcc.plataformaestudos.material.MaterialOrigemRepository;
import com.tcc.plataformaestudos.material.StatusProcessamento;

import lombok.RequiredArgsConstructor;

/**
 * UC14 — Solicitar explicação de um flashcard (RN19), detalhado em
 * Docs/extensao-explicacao-rag-lite.md. RAG-lite: sem vector store, sem
 * embeddings — a ancoragem vem de injetar o {@code texto_extraido} (UC03)
 * diretamente no prompt, já que os PDFs deste domínio cabem na janela de
 * contexto do modelo. RN01 é garantida por
 * {@link FlashcardService#buscarFlashcardDoUsuarioAutenticado(Long)}.
 *
 * <p>Não há vínculo individual flashcard→material (um material gera N
 * flashcards, mas o flashcard não guarda de qual material veio) — decisão
 * documentada na spec: usa-se o material mais recente e utilizável (status
 * PROCESSADO, com texto extraído) do deck ao qual o flashcard pertence.
 * Sem nenhum material nessas condições, a explicação é gerada sem
 * ancoragem (RN19), sinalizando isso em {@code ancoradaNoMaterial}.
 */
@Service
@RequiredArgsConstructor
public class ExplicacaoService {

	private static final Logger log = LoggerFactory.getLogger(ExplicacaoService.class);

	private static final int MAXIMO_TENTATIVAS = 2;

	private final FlashcardService flashcardService;
	private final MaterialOrigemRepository materialOrigemRepository;
	private final GeminiClient geminiClient;

	@Transactional(readOnly = true)
	public ExplicacaoResponseDTO gerarExplicacao(Long flashcardId) {
		Flashcard flashcard = flashcardService.buscarFlashcardDoUsuarioAutenticado(flashcardId);

		Optional<MaterialOrigem> material = materialOrigemRepository
				.findFirstByDeckIdAndStatusProcessamentoAndTextoExtraidoIsNotNullOrderByCriadoEmDesc(
						flashcard.getDeck().getId(), StatusProcessamento.PROCESSADO);

		boolean ancoradaNoMaterial = material.isPresent();
		String prompt = ancoradaNoMaterial
				? montarPromptAncorado(flashcard, material.get().getTextoExtraido())
				: montarPromptSemAncoragem(flashcard);

		String explicacao = gerarComRetry(flashcardId, ancoradaNoMaterial, prompt);

		return new ExplicacaoResponseDTO(explicacao, ancoradaNoMaterial);
	}

	private String gerarComRetry(Long flashcardId, boolean ancoradaNoMaterial, String prompt) {
		// B10: captura GeracaoConteudoIAException (não só GeracaoExplicacaoException)
		// para que o retry cubra tanto falha de infraestrutura do GeminiClient
		// (timeout, rate limit, chave inválida, rede) quanto resposta em branco.
		GeracaoConteudoIAException ultimaFalha = null;

		for (int tentativa = 1; tentativa <= MAXIMO_TENTATIVAS; tentativa++) {
			log.info("Chamando API de IA para explicação de flashcard: flashcardId={}, ancoradaNoMaterial={}, tentativa={}",
					flashcardId, ancoradaNoMaterial, tentativa);

			try {
				String textoGerado = geminiClient.gerarConteudo(prompt);
				String explicacao = validarResposta(textoGerado);

				log.info("Explicação de flashcard concluída: flashcardId={}, ancoradaNoMaterial={}, tentativa={}, status=SUCESSO",
						flashcardId, ancoradaNoMaterial, tentativa);
				return explicacao;
			} catch (GeracaoConteudoIAException e) {
				ultimaFalha = e;
				log.warn("Tentativa {} de gerar explicação falhou: flashcardId={}, status=FALHA, motivo={}",
						tentativa, flashcardId, e.getMessage());
			}
		}

		log.error("Geração de explicação esgotou as {} tentativas: flashcardId={}, status=FALHA", MAXIMO_TENTATIVAS, flashcardId);
		throw ultimaFalha;
	}

	private String validarResposta(String textoGerado) {
		if (textoGerado == null || textoGerado.isBlank()) {
			throw new GeracaoExplicacaoException("IA não retornou nenhuma explicação");
		}
		return textoGerado.trim();
	}

	private String montarPromptAncorado(Flashcard flashcard, String textoExtraido) {
		return """
				Você é um assistente de estudos. Um estudante tem dúvida sobre o
				flashcard abaixo.
				Pergunta: %s
				Resposta: %s

				Use SOMENTE o texto de referência abaixo (extraído do material que o
				próprio estudante enviou) para escrever uma explicação alternativa e
				mais didática da resposta. Não invente informação que não esteja
				nesse texto. Responda em texto simples, sem markdown.

				Texto de referência:
				%s
				""".formatted(flashcard.getPergunta(), flashcard.getResposta(), textoExtraido);
	}

	private String montarPromptSemAncoragem(Flashcard flashcard) {
		return """
				Você é um assistente de estudos. Escreva uma explicação alternativa e
				mais didática para o flashcard abaixo. Responda em texto simples, sem
				markdown.
				Pergunta: %s
				Resposta: %s
				""".formatted(flashcard.getPergunta(), flashcard.getResposta());
	}

}
