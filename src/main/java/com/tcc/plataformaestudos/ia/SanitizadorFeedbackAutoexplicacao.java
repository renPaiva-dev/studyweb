package com.tcc.plataformaestudos.ia;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

import tools.jackson.databind.JsonNode;

/**
 * UC34/RN43 — valida e sanitiza o JSON devolvido pela IA para a
 * autoexplicação (Docs/extensao-elaboracao-flashcard.md §5.3). O backend é a
 * fonte de verdade: o frontend nunca "conserta" a resposta da IA.
 *
 * <p>Regra central: um `trecho` só é mantido se aparecer no texto do
 * estudante (comparação sem diferenciar maiúsculas e com espaços
 * normalizados). Quando aparece, é devolvido exatamente como o estudante o
 * escreveu, para o frontend localizá-lo com uma busca literal. Senão vira
 * null e a anotação passa a ser uma nota geral — a interface nunca sublinha
 * algo que o aluno não escreveu. Trechos sobrepostos a um já aceito também
 * viram null, para o sublinhado nunca se sobrepor.
 */
final class SanitizadorFeedbackAutoexplicacao {

	static final int MAXIMO_ANOTACOES = 4;

	private SanitizadorFeedbackAutoexplicacao() {
	}

	static AutoexplicacaoResponseDTO sanitizar(JsonNode raiz, String textoEstudante, boolean ancoradaNoMaterial) {
		VereditoAutoexplicacao veredito = converterEnum(VereditoAutoexplicacao.class, texto(raiz.path("veredito")));
		if (veredito == null) {
			throw new GeracaoElaboracaoException("IA retornou um veredito inválido");
		}

		String comentarioGeral = texto(raiz.path("comentarioGeral"));
		if (comentarioGeral == null) {
			throw new GeracaoElaboracaoException("IA não retornou o comentário geral");
		}

		TextoNormalizado textoNormalizado = normalizar(textoEstudante);
		List<Intervalo> ocupados = new ArrayList<>();
		List<AnotacaoPosicionada> anotacoes = new ArrayList<>();

		JsonNode anotacoesBrutas = raiz.path("anotacoes");
		if (anotacoesBrutas.isArray()) {
			for (JsonNode bruta : anotacoesBrutas) {
				if (anotacoes.size() == MAXIMO_ANOTACOES) {
					break;
				}

				TipoAnotacao tipo = converterEnum(TipoAnotacao.class, texto(bruta.path("tipo")));
				String comentario = texto(bruta.path("comentario"));
				if (tipo == null || comentario == null) {
					continue;
				}

				Intervalo intervalo = localizar(textoNormalizado, texto(bruta.path("trecho")), ocupados);
				if (intervalo == null) {
					anotacoes.add(new AnotacaoPosicionada(new AnotacaoAutoexplicacaoDTO(null, tipo, comentario), Integer.MAX_VALUE));
				} else {
					ocupados.add(intervalo);
					String trechoOriginal = textoEstudante.substring(intervalo.inicio(), intervalo.fim());
					anotacoes.add(new AnotacaoPosicionada(new AnotacaoAutoexplicacaoDTO(trechoOriginal, tipo, comentario), intervalo.inicio()));
				}
			}
		}

		List<AnotacaoAutoexplicacaoDTO> ordenadas = anotacoes.stream()
				.sorted(Comparator.comparingInt(AnotacaoPosicionada::posicao))
				.map(AnotacaoPosicionada::anotacao)
				.toList();

		return new AutoexplicacaoResponseDTO(veredito, comentarioGeral, ordenadas, texto(raiz.path("faltou")), ancoradaNoMaterial);
	}

	/** Texto de um nó JSON, ou null se ausente, não textual ou em branco. */
	static String texto(JsonNode no) {
		if (no == null || no.isMissingNode() || no.isNull() || !no.isValueNode()) {
			return null;
		}
		String valor = no.asText().trim();
		return valor.isEmpty() ? null : valor;
	}

	static <E extends Enum<E>> E converterEnum(Class<E> tipo, String valor) {
		if (valor == null) {
			return null;
		}
		return Arrays.stream(tipo.getEnumConstants())
				.filter(constante -> constante.name().equalsIgnoreCase(valor))
				.findFirst()
				.orElse(null);
	}

	private static Intervalo localizar(TextoNormalizado texto, String trecho, List<Intervalo> ocupados) {
		if (trecho == null) {
			return null;
		}

		String alvo = normalizar(trecho).texto();
		if (alvo.isEmpty()) {
			return null;
		}

		int indice = texto.texto().indexOf(alvo);
		while (indice >= 0) {
			int inicio = texto.origem()[indice];
			int fim = texto.origem()[indice + alvo.length() - 1] + 1;
			Intervalo candidato = new Intervalo(inicio, fim);

			if (ocupados.stream().noneMatch(candidato::sobrepoe)) {
				return candidato;
			}
			indice = texto.texto().indexOf(alvo, indice + 1);
		}
		return null;
	}

	/**
	 * Minúsculas, espaços em sequência reduzidos a um e sem espaço nas pontas.
	 * {@code origem[i]} guarda o índice, no texto original, do i-ésimo
	 * caractere normalizado — permite devolver o trecho exatamente como o
	 * estudante o escreveu.
	 */
	private static TextoNormalizado normalizar(String original) {
		StringBuilder normalizado = new StringBuilder(original.length());
		int[] origem = new int[original.length()];
		boolean espacoPendente = false;

		for (int i = 0; i < original.length(); i++) {
			char caractere = original.charAt(i);
			if (Character.isWhitespace(caractere)) {
				espacoPendente = normalizado.length() > 0;
				continue;
			}
			if (espacoPendente) {
				origem[normalizado.length()] = i;
				normalizado.append(' ');
				espacoPendente = false;
			}
			origem[normalizado.length()] = i;
			normalizado.append(Character.toLowerCase(caractere));
		}

		return new TextoNormalizado(normalizado.toString(), Arrays.copyOf(origem, normalizado.length()));
	}

	private record TextoNormalizado(String texto, int[] origem) {
	}

	private record Intervalo(int inicio, int fim) {

		boolean sobrepoe(Intervalo outro) {
			return inicio < outro.fim && outro.inicio < fim;
		}
	}

	private record AnotacaoPosicionada(AnotacaoAutoexplicacaoDTO anotacao, int posicao) {
	}

}
