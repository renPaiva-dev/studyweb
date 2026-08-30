package com.tcc.plataformaestudos.quiz;

/** UC27/RN35 — estilo de prova escolhido pelo usuário, usado para orientar o prompt de geração via IA. */
public enum EstiloProva {

	ENEM(
			"ENEM",
			"no estilo do ENEM: questões contextualizadas, trazendo uma situação, texto de apoio breve ou "
					+ "aplicação prática antes da pergunta, exigindo interpretação além da memorização"),
	VESTIBULAR(
			"Vestibular",
			"no estilo de vestibular tradicional: questões diretas, técnicas e objetivas, cobrando o "
					+ "conteúdo com precisão"),
	GERAL(
			"Conhecimentos Gerais",
			"no estilo de prova de conhecimentos gerais: perguntas diretas e objetivas, sem contexto elaborado");

	private final String rotulo;
	private final String descricaoParaPrompt;

	EstiloProva(String rotulo, String descricaoParaPrompt) {
		this.rotulo = rotulo;
		this.descricaoParaPrompt = descricaoParaPrompt;
	}

	public String getRotulo() {
		return rotulo;
	}

	public String getDescricaoParaPrompt() {
		return descricaoParaPrompt;
	}

}
