package com.tcc.plataformaestudos.ia;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.deck.Deck;
import com.tcc.plataformaestudos.deck.DeckService;
import com.tcc.plataformaestudos.material.MaterialOrigem;
import com.tcc.plataformaestudos.material.MaterialOrigemRepository;
import com.tcc.plataformaestudos.material.StatusProcessamento;

import lombok.RequiredArgsConstructor;

/**
 * UC32 — Perguntar sobre o material do deck (RN41), detalhado em
 * Docs/extensao-pergunta-material.md. Mesmo RAG-lite de
 * {@link ExplicacaoService} (UC14/RN19) — sem vector store, sem embeddings,
 * ancoragem via injeção direta do {@code texto_extraido} no prompt — mas
 * escopado ao deck inteiro: reúne todos os materiais {@code PROCESSADO} do
 * deck, não só o mais recente. RN01 é garantida por
 * {@link DeckService#buscarDeckDoUsuarioAutenticado(Long)}.
 *
 * <p>Diferente de {@link ExplicacaoService}, aqui não há fallback "sem
 * ancoragem": uma pergunta livre sobre um deck sem nenhum material
 * processado não tem contexto nenhum para responder (RN41), então lança
 * {@link MaterialNaoDisponivelException} (400) em vez de chamar a IA sem
 * base alguma.
 */
@Service
@RequiredArgsConstructor
public class PerguntaMaterialService {

	private static final Logger log = LoggerFactory.getLogger(PerguntaMaterialService.class);

	private static final int MAXIMO_TENTATIVAS = 2;

	private final DeckService deckService;
	private final MaterialOrigemRepository materialOrigemRepository;
	private final GeminiClient geminiClient;

	@Transactional(readOnly = true)
	public PerguntaMaterialResponseDTO perguntar(Long deckId, PerguntaMaterialRequestDTO request) {
		Deck deck = deckService.buscarDeckDoUsuarioAutenticado(deckId);

		List<MaterialOrigem> materiais = materialOrigemRepository
				.findByDeckIdAndStatusProcessamentoAndTextoExtraidoIsNotNull(deck.getId(), StatusProcessamento.PROCESSADO);

		if (materiais.isEmpty()) {
			throw new MaterialNaoDisponivelException(
					"Este deck ainda não tem nenhum material processado para consultar");
		}

		String prompt = montarPrompt(request.pergunta(), materiais);
		String resposta = gerarComRetry(deckId, prompt);

		log.info("Pergunta sobre material do deck respondida: deckId={}, materiaisConsultados={}", deckId, materiais.size());
		return new PerguntaMaterialResponseDTO(resposta, materiais.size());
	}

	private String gerarComRetry(Long deckId, String prompt) {
		// B10: captura GeracaoConteudoIAException (não só GeracaoRespostaMaterialException)
		// para que o retry cubra tanto falha de infraestrutura do GeminiClient
		// (timeout, rate limit, chave inválida, rede) quanto resposta em branco.
		GeracaoConteudoIAException ultimaFalha = null;

		for (int tentativa = 1; tentativa <= MAXIMO_TENTATIVAS; tentativa++) {
			log.info("Chamando API de IA para pergunta sobre material do deck: deckId={}, tentativa={}", deckId, tentativa);

			try {
				String textoGerado = geminiClient.gerarConteudo(prompt);
				String resposta = validarResposta(textoGerado);

				log.info("Resposta sobre material do deck concluída: deckId={}, tentativa={}, status=SUCESSO", deckId, tentativa);
				return resposta;
			} catch (GeracaoConteudoIAException e) {
				ultimaFalha = e;
				log.warn("Tentativa {} de responder pergunta sobre material falhou: deckId={}, status=FALHA, motivo={}",
						tentativa, deckId, e.getMessage());
			}
		}

		log.error("Geração de resposta sobre material esgotou as {} tentativas: deckId={}, status=FALHA", MAXIMO_TENTATIVAS, deckId);
		throw ultimaFalha;
	}

	private String validarResposta(String textoGerado) {
		if (textoGerado == null || textoGerado.isBlank()) {
			throw new GeracaoRespostaMaterialException("IA não retornou nenhuma resposta");
		}
		return textoGerado.trim();
	}

	private String montarPrompt(String pergunta, List<MaterialOrigem> materiais) {
		String contexto = materiais.stream()
				.map(material -> "Material: %s\n%s".formatted(material.getNomeArquivo(), material.getTextoExtraido()))
				.collect(Collectors.joining("\n\n---\n\n"));

		return """
				Você é um assistente de estudos. Um estudante tem uma pergunta sobre
				o material de estudo abaixo.

				Use SOMENTE o texto de referência abaixo (extraído dos materiais que
				o próprio estudante enviou) para responder. Se a resposta não estiver
				nesse texto, diga isso claramente em vez de inventar informação.
				Responda em texto simples, sem markdown.

				Pergunta: %s

				Texto de referência:
				%s
				""".formatted(pergunta, contexto);
	}

}
