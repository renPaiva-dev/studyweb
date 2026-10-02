package com.tcc.plataformaestudos.config;

import java.sql.SQLException;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class TratamentoErrosGlobal {

	private static final Logger log = LoggerFactory.getLogger(TratamentoErrosGlobal.class);

	private static final String SQL_STATE_TEXTO_LONGO_DEMAIS = "22001";

	@ExceptionHandler(NegocioException.class)
	public ResponseEntity<ErrorResponseDTO> tratarNegocioException(NegocioException ex, WebRequest request) {
		return construirResposta(ex.getStatus(), ex.getMessage(), request);
	}

	/**
	 * Cobre AuthenticationException lançada dentro da execução normal do
	 * controller/service. O 401 disparado pela cadeia de filtros do Spring
	 * Security por ausência/invalidez de token (antes do DispatcherServlet)
	 * é tratado por {@link JwtAuthenticationEntryPoint}, no mesmo formato.
	 */
	@ExceptionHandler(AuthenticationException.class)
	public ResponseEntity<ErrorResponseDTO> tratarAutenticacaoAusente(AuthenticationException ex, WebRequest request) {
		return construirResposta(HttpStatus.UNAUTHORIZED, "Token de autenticação ausente ou inválido", request);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponseDTO> tratarDadosInvalidos(MethodArgumentNotValidException ex, WebRequest request) {
		String mensagem = ex.getBindingResult().getFieldErrors().stream()
				.map(FieldError::getDefaultMessage)
				.reduce((a, b) -> a + "; " + b)
				.orElse("Dados inválidos");

		return construirResposta(HttpStatus.BAD_REQUEST, mensagem, request);
	}

	/**
	 * RN06: quando o arquivo excede spring.servlet.multipart.max-file-size, o
	 * Spring rejeita antes até de chegar ao MaterialOrigemService — sem este
	 * handler, cairia no fallback genérico como 500 em vez de 400.
	 */
	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<ErrorResponseDTO> tratarArquivoExcedeTamanho(MaxUploadSizeExceededException ex, WebRequest request) {
		return construirResposta(HttpStatus.BAD_REQUEST, "O arquivo enviado excede o tamanho máximo de 15MB", request);
	}

	/**
	 * B18: padrão "check-then-act" sem lock (ex.: unicidade de e-mail/nomeUsuario
	 * no cadastro/atualização de perfil) — duas requisições concorrentes podem
	 * passar a checagem antes de qualquer commit; o segundo INSERT/UPDATE
	 * estoura esta exceção no banco. Sem este handler, caía no fallback
	 * genérico como 500 em vez do 409 (conflito) que o cliente já trata para
	 * os outros casos de duplicidade.
	 */
	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ErrorResponseDTO> tratarViolacaoDeIntegridade(DataIntegrityViolationException ex, WebRequest request) {
		// SQLState 22001 (string_data_right_truncation): texto maior que a
		// coluna. Não é conflito — responder 409 "já existe" confundia o
		// usuário (ex.: quiz com resposta longa antes da V13).
		if (SQL_STATE_TEXTO_LONGO_DEMAIS.equals(extrairSqlState(ex))) {
			log.warn("Texto excede o tamanho da coluna: {}", ex.getMostSpecificCause().getMessage());
			return construirResposta(HttpStatus.BAD_REQUEST, "Um dos textos enviados excede o tamanho máximo permitido", request);
		}

		return construirResposta(HttpStatus.CONFLICT, "Este recurso já existe ou conflita com um dado já cadastrado", request);
	}

	private static String extrairSqlState(Throwable ex) {
		for (Throwable causa = ex; causa != null; causa = causa.getCause()) {
			if (causa instanceof SQLException sqlException && sqlException.getSQLState() != null) {
				return sqlException.getSQLState();
			}
		}
		return null;
	}

	/**
	 * Rede de segurança final: qualquer exceção não mapeada por um handler
	 * específico caía sem tratamento (fora deste @RestControllerAdvice),
	 * causando um forward interno para /error — que, por não ser permitAll,
	 * respondia 401 e mascarava o erro real. Este handler garante 500 no
	 * formato padrão do contrato, com a causa raiz sempre logada.
	 */
	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponseDTO> tratarErroNaoMapeado(Exception ex, WebRequest request) {
		log.error("Erro não tratado", ex);
		return construirResposta(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno inesperado", request);
	}

	private ResponseEntity<ErrorResponseDTO> construirResposta(HttpStatus status, String mensagem, WebRequest request) {
		String path = request.getDescription(false).replace("uri=", "");
		ErrorResponseDTO corpo = new ErrorResponseDTO(Instant.now(), status.value(), status.getReasonPhrase(), mensagem, path);

		return ResponseEntity.status(status).body(corpo);
	}

}
