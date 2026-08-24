package com.tcc.plataformaestudos.ia;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tcc.plataformaestudos.material.MaterialOrigem;
import com.tcc.plataformaestudos.material.MaterialOrigemService;
import com.tcc.plataformaestudos.material.StatusProcessamento;

import lombok.RequiredArgsConstructor;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/**
 * UC04 — Gerar flashcards via IA. RN01 é garantida por
 * {@link MaterialOrigemService#buscarMaterialDoUsuarioAutenticado(Long)}.
 * RN07 é validada antes de qualquer chamada à IA. RN08 limita a resposta a
 * {@value #MAXIMO_FLASHCARDS} sugestões, mesmo que a IA retorne mais. RN16
 * registra cada chamada em log (timestamp + status).
 */
@Service
@RequiredArgsConstructor
public class FlashcardGenerationService {

	private static final Logger log = LoggerFactory.getLogger(FlashcardGenerationService.class);

	private static final int MAXIMO_FLASHCARDS = 15;
	private static final int MAXIMO_TENTATIVAS = 2;

	private final MaterialOrigemService materialOrigemService;
	private final GeminiClient geminiClient;
	private final ObjectMapper objectMapper;

	@Transactional(readOnly = true)
	public SugestoesFlashcardsResponseDTO gerarSugestoes(Long materialId) {
		MaterialOrigem material = materialOrigemService.buscarMaterialDoUsuarioAutenticado(materialId);
		validarMaterialProntoParaIA(material);

		String prompt = montarPrompt(material.getTextoExtraido());
		List<FlashcardSugestaoDTO> sugestoes = gerarComRetry(materialId, prompt);

		return new SugestoesFlashcardsResponseDTO(sugestoes);
	}

	private void validarMaterialProntoParaIA(MaterialOrigem material) {
		boolean semTexto = material.getTextoExtraido() == null || material.getTextoExtraido().isBlank();

		if (material.getStatusProcessamento() != StatusProcessamento.PROCESSADO || semTexto) {
			throw new MaterialNaoProcessadoException(
					"Material ainda não foi processado com sucesso; não é possível gerar flashcards (RN07)");
		}
	}

	private List<FlashcardSugestaoDTO> gerarComRetry(Long materialId, String prompt) {
		GeracaoFlashcardsException ultimaFalha = null;

		for (int tentativa = 1; tentativa <= MAXIMO_TENTATIVAS; tentativa++) {
			log.info("Chamando API de IA para geração de flashcards: materialId={}, tentativa={}", materialId, tentativa);

			try {
				String textoGerado = geminiClient.gerarConteudo(prompt);
				List<FlashcardSugestaoDTO> sugestoes = interpretarResposta(textoGerado);

				log.info("Geração de flashcards concluída: materialId={}, tentativa={}, status=SUCESSO, total={}",
						materialId, tentativa, sugestoes.size());

				return sugestoes;
			} catch (GeracaoFlashcardsException e) {
				ultimaFalha = e;
				log.warn("Tentativa {} de geração de flashcards falhou: materialId={}, status=FALHA, motivo={}",
						tentativa, materialId, e.getMessage());
			}
		}

		log.error("Geração de flashcards esgotou as {} tentativas: materialId={}, status=FALHA", MAXIMO_TENTATIVAS, materialId);
		throw ultimaFalha;
	}

	private List<FlashcardSugestaoDTO> interpretarResposta(String textoGerado) {
		List<FlashcardSugestaoDTO> sugestoes;

		try {
			sugestoes = objectMapper.readValue(textoGerado, new TypeReference<List<FlashcardSugestaoDTO>>() { });
		} catch (JacksonException e) {
			throw new GeracaoFlashcardsException("JSON retornado pela IA está mal formatado", e);
		}

		List<FlashcardSugestaoDTO> validas = sugestoes.stream()
				.filter(this::temPerguntaERespostaPreenchidas)
				.limit(MAXIMO_FLASHCARDS)
				.toList();

		if (validas.isEmpty()) {
			throw new GeracaoFlashcardsException("IA não retornou nenhuma sugestão de flashcard válida");
		}

		return validas;
	}

	private boolean temPerguntaERespostaPreenchidas(FlashcardSugestaoDTO sugestao) {
		return sugestao.pergunta() != null && !sugestao.pergunta().isBlank()
				&& sugestao.resposta() != null && !sugestao.resposta().isBlank();
	}

	private String montarPrompt(String textoExtraido) {
		return """
				Você é um assistente que cria flashcards de estudo a partir de um texto.
				Gere no máximo %d flashcards com base no texto abaixo.
				Responda apenas com um array JSON no formato [{"pergunta": "...", "resposta": "..."}],
				sem markdown, sem crases, sem texto fora do JSON.

				Texto:
				%s
				""".formatted(MAXIMO_FLASHCARDS, textoExtraido);
	}

}
