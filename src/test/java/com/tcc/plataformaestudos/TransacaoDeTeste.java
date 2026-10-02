package com.tcc.plataformaestudos;

import static org.mockito.Mockito.mock;

import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * TransactionTemplate para testes unitários de services que separam a
 * chamada à IA das transações (ex.: FlashcardGenerationService): executa o
 * callback direto, sem banco, com um gerenciador de transação falso.
 */
public final class TransacaoDeTeste {

	private TransacaoDeTeste() {
	}

	public static TransactionTemplate template() {
		return new TransactionTemplate(mock(PlatformTransactionManager.class));
	}

}
