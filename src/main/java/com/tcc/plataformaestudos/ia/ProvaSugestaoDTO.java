package com.tcc.plataformaestudos.ia;

import java.util.List;

/** UC27/RN35 — uma questão de prova personalizada sugerida pela IA, antes de validação/persistência. */
public record ProvaSugestaoDTO(String enunciado, List<String> alternativas, String respostaCorreta, String explicacao) {
}
