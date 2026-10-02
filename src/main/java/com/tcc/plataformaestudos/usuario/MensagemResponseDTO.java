package com.tcc.plataformaestudos.usuario;

/**
 * N10 (Docs/auditoria-coerencia-seguranca-2026-09.md): campo chamado
 * {@code message}, não {@code mensagem}, para ficar consistente com
 * {@link com.tcc.plataformaestudos.config.ErrorResponseDTO} - antes toda
 * resposta de sucesso "textual" da API usava um nome de campo e toda
 * resposta de erro usava outro para o mesmo tipo de conteúdo (texto legível
 * pro usuário).
 */
public record MensagemResponseDTO(String message) {
}
