package com.tcc.plataformaestudos.revisao;

import java.util.Map;

/**
 * UC30 — dados já extraídos das entidades (dentro da transação) para compor
 * o e-mail de lembrete fora dela — {@link LembreteRevisaoService} nunca
 * chama {@link com.tcc.plataformaestudos.usuario.EmailService} com uma
 * transação de banco aberta (mesmo cuidado do achado de performance sobre
 * chamada externa dentro de {@code @Transactional}).
 */
record LembreteRevisaoDTO(String email, String nomeUsuario, int totalPendentes, Map<String, Long> pendentesPorDeck) {
}
