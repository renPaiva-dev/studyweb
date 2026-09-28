package com.tcc.plataformaestudos.ia;

/**
 * UC34/RN43 — `trecho` é sempre uma cópia literal do texto do estudante, ou
 * null quando a IA citou algo que não está no texto (ver
 * {@link SanitizadorFeedbackAutoexplicacao}).
 */
public record AnotacaoAutoexplicacaoDTO(String trecho, TipoAnotacao tipo, String comentario) {
}
