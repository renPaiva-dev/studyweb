package com.tcc.plataformaestudos.revisao;

import java.util.Map;

/**
 * UC30 — dados já extraídos das entidades (dentro da transação) para compor
 * o e-mail de lembrete fora dela — {@link LembreteRevisaoService} nunca
 * chama {@link com.tcc.plataformaestudos.usuario.EmailService} com uma
 * transação de banco aberta (mesmo cuidado do achado de performance sobre
 * chamada externa dentro de {@code @Transactional}). N3 (achado da
 * auditoria): o campo se chama {@code nome} (não {@code nomeUsuario}) porque
 * carrega {@code usuario.getNome()} — o nome de exibição usado no corpo do
 * e-mail ("Olá, {nome}!") — e não o {@code nomeUsuario} (identificador
 * público único, RN22), que é um conceito diferente no resto do sistema.
 */
record LembreteRevisaoDTO(String email, String nome, int totalPendentes, Map<String, Long> pendentesPorDeck) {
}
