package com.tcc.plataformaestudos.ia;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

/**
 * Exceção base para falha de infraestrutura ao chamar o serviço de IA
 * (timeout, rate limit/429, chave inválida/403, erro de rede, status HTTP de
 * erro, resposta sem texto) — lançada diretamente por
 * {@link GeminiClient#gerarConteudo(String)}, sem depender de qual service de
 * geração está chamando.
 *
 * <p>Cada exceção específica de "JSON/resposta mal formatada" de um service
 * de geração ({@link GeracaoFlashcardsException}, {@link GeracaoProvaException},
 * {@link GeracaoExplicacaoException}, {@link GeracaoRecomendacaoException})
 * estende esta classe, para que o {@code gerarComRetry} de cada service
 * capture uma única exceção (esta) cobrindo tanto a falha de infraestrutura
 * quanto sua própria falha de interpretação — antes da correção, cada service
 * só capturava sua exceção irmã, sem relação de herança com a exceção de
 * infraestrutura de fato lançada por {@code GeminiClient}, então o retry de
 * até 2 tentativas nunca cobria falha real de rede/cota (bug B10 da
 * auditoria de 2026-09).
 */
public class GeracaoConteudoIAException extends NegocioException {

	public GeracaoConteudoIAException(String mensagem) {
		super(HttpStatus.BAD_GATEWAY, mensagem);
	}

	public GeracaoConteudoIAException(String mensagem, Throwable causa) {
		super(HttpStatus.BAD_GATEWAY, mensagem, causa);
	}

}
