package com.tcc.plataformaestudos.quiz;

import java.util.List;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

/**
 * Serializa {@code QuestaoQuiz.alternativas} (JSONB no dicionário de dados)
 * como uma coluna de texto única via Jackson, em vez de uma tabela auxiliar
 * normalizada: as alternativas de uma questão nunca são consultadas ou
 * filtradas individualmente em nenhum caso de uso — são sempre lidas e
 * escritas como um bloco único junto da questão que as contém. Uma tabela
 * própria só adicionaria joins sem trazer nenhum benefício real aqui.
 *
 * <p>Instancia seu próprio {@code ObjectMapper} (em vez de receber via
 * injeção, como {@code GeminiClient}) porque {@code AttributeConverter} é
 * instanciado pelo provedor JPA, não pelo container Spring.
 */
@Converter
public class AlternativasConverter implements AttributeConverter<List<AlternativaQuiz>, String> {

	private static final ObjectMapper OBJECT_MAPPER = JsonMapper.builder().build();

	@Override
	public String convertToDatabaseColumn(List<AlternativaQuiz> alternativas) {
		try {
			return OBJECT_MAPPER.writeValueAsString(alternativas);
		} catch (JacksonException e) {
			throw new IllegalStateException("Falha ao serializar as alternativas do quiz", e);
		}
	}

	@Override
	public List<AlternativaQuiz> convertToEntityAttribute(String json) {
		try {
			return OBJECT_MAPPER.readValue(json, new TypeReference<List<AlternativaQuiz>>() { });
		} catch (JacksonException e) {
			throw new IllegalStateException("Falha ao interpretar as alternativas do quiz", e);
		}
	}

}
