package com.tcc.plataformaestudos.usuario;

import org.springframework.http.HttpStatus;

import com.tcc.plataformaestudos.config.NegocioException;

/**
 * RN32 — o token JWT continua válido (assinatura e validade OK) até expirar
 * naturalmente, mesmo depois de a conta ter sido excluída (direito ao
 * esquecimento, exclusão em cascata). Esse é um cenário esperado e
 * documentado, não uma falha de infraestrutura: antes lançava
 * {@code IllegalStateException} (sem handler dedicado), caindo no fallback
 * genérico do {@code TratamentoErrosGlobal} como 500 logado em ERROR (bug B17
 * da auditoria de 2026-09). Mapeada para 401, conforme docs/contrato-api.md
 * (perfil, senha, exclusão de conta e exportação de dados só documentam 401).
 */
public class UsuarioNaoEncontradoException extends NegocioException {

	public UsuarioNaoEncontradoException(Long usuarioId) {
		super(HttpStatus.UNAUTHORIZED, "Usuário autenticado não encontrado; a conta pode ter sido excluída");
	}

}
