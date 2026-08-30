package com.tcc.plataformaestudos.ia;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.tcc.plataformaestudos.flashcard.Flashcard;
import com.tcc.plataformaestudos.quiz.EstiloProva;

import lombok.RequiredArgsConstructor;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/**
 * UC27/RN35 — Gerar prova personalizada via IA a partir de flashcards
 * escolhidos pelo usuário e de um estilo de prova. Questões são inéditas:
 * o prompt pede explicitamente para não reaproveitar literalmente
 * pergunta/resposta dos flashcards, apenas o tema deles — diferente do quiz
 * determinístico de UC10, que reaproveita a resposta do próprio flashcard.
 */
@Service
@RequiredArgsConstructor
public class ProvaGenerationService {

	private static final Logger log = LoggerFactory.getLogger(ProvaGenerationService.class);

	private static final int NUMERO_QUESTOES = 5;
	private static final int NUMERO_ALTERNATIVAS = 4;
	private static final int MAXIMO_TENTATIVAS = 2;

	private final GeminiClient geminiClient;
	private final ObjectMapper objectMapper;

	public List<ProvaSugestaoDTO> gerarQuestoes(List<Flashcard> flashcardsBase, EstiloProva estilo) {
		String prompt = montarPrompt(flashcardsBase, estilo);
		return gerarComRetry(prompt);
	}

	private List<ProvaSugestaoDTO> gerarComRetry(String prompt) {
		GeracaoProvaException ultimaFalha = null;

		for (int tentativa = 1; tentativa <= MAXIMO_TENTATIVAS; tentativa++) {
			log.info("Chamando API de IA para geração de prova personalizada: tentativa={}", tentativa);

			try {
				String textoGerado = geminiClient.gerarConteudo(prompt);
				List<ProvaSugestaoDTO> questoes = interpretarResposta(textoGerado);

				log.info("Geração de prova concluída: tentativa={}, status=SUCESSO, total={}", tentativa, questoes.size());
				return questoes;
			} catch (GeracaoProvaException e) {
				ultimaFalha = e;
				log.warn("Tentativa {} de geração de prova falhou: status=FALHA, motivo={}", tentativa, e.getMessage());
			}
		}

		log.error("Geração de prova esgotou as {} tentativas: status=FALHA", MAXIMO_TENTATIVAS);
		throw ultimaFalha;
	}

	private List<ProvaSugestaoDTO> interpretarResposta(String textoGerado) {
		List<ProvaSugestaoDTO> sugestoes;

		try {
			sugestoes = objectMapper.readValue(textoGerado, new TypeReference<List<ProvaSugestaoDTO>>() { });
		} catch (JacksonException e) {
			throw new GeracaoProvaException("JSON retornado pela IA está mal formatado", e);
		}

		List<ProvaSugestaoDTO> validas = sugestoes.stream()
				.filter(this::ehQuestaoValida)
				.limit(NUMERO_QUESTOES)
				.toList();

		if (validas.isEmpty()) {
			throw new GeracaoProvaException("IA não retornou nenhuma questão de prova válida");
		}

		return validas;
	}

	private boolean ehQuestaoValida(ProvaSugestaoDTO sugestao) {
		if (sugestao.enunciado() == null || sugestao.enunciado().isBlank()) {
			return false;
		}
		if (sugestao.explicacao() == null || sugestao.explicacao().isBlank()) {
			return false;
		}
		if (sugestao.alternativas() == null || sugestao.alternativas().size() != NUMERO_ALTERNATIVAS) {
			return false;
		}
		if (sugestao.alternativas().stream().anyMatch(alternativa -> alternativa == null || alternativa.isBlank())) {
			return false;
		}
		return sugestao.respostaCorreta() != null && sugestao.alternativas().contains(sugestao.respostaCorreta());
	}

	private String montarPrompt(List<Flashcard> flashcardsBase, EstiloProva estilo) {
		String temas = flashcardsBase.stream()
				.map(flashcard -> "- Pergunta: " + flashcard.getPergunta() + " | Resposta: " + flashcard.getResposta())
				.collect(Collectors.joining("\n"));

		return """
				Você é um assistente que cria provas de múltipla escolha originais para um estudante revisar um tema.
				Gere exatamente %d questões %s.
				Cada questão deve ter exatamente %d alternativas, sendo apenas 1 correta.
				As questões devem ser sobre o mesmo assunto dos flashcards de referência abaixo, mas NUNCA repita
				literalmente a pergunta ou a resposta de nenhum flashcard — crie questões inéditas que testem o
				mesmo conhecimento de outra forma.
				Para cada questão, inclua também uma breve explicação (1 a 3 frases) de por que a alternativa
				correta está certa.
				Responda apenas com um array JSON no formato
				[{"enunciado": "...", "alternativas": ["...", "...", "...", "..."], "respostaCorreta": "...", "explicacao": "..."}],
				sem markdown, sem crases, sem texto fora do JSON. O valor de "respostaCorreta" deve ser
				exatamente igual a um dos textos em "alternativas".

				Flashcards de referência (não repita literalmente):
				%s
				""".formatted(NUMERO_QUESTOES, estilo.getDescricaoParaPrompt(), NUMERO_ALTERNATIVAS, temas);
	}

}
