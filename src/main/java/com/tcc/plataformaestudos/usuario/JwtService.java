package com.tcc.plataformaestudos.usuario;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtService {

	private final SecretKey chave;
	private final long expiracaoMs;

	public JwtService(@Value("${jwt.secret}") String secret, @Value("${jwt.expiration-ms}") long expiracaoMs) {
		this.chave = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.expiracaoMs = expiracaoMs;
	}

	public TokenGerado gerarToken(Usuario usuario) {
		Instant agora = Instant.now();
		Instant expiraEm = agora.plusMillis(expiracaoMs);

		String token = Jwts.builder()
				.subject(usuario.getEmail())
				.claim("usuarioId", usuario.getId())
				.issuedAt(Date.from(agora))
				.expiration(Date.from(expiraEm))
				.signWith(chave)
				.compact();

		return new TokenGerado(token, expiraEm);
	}

	public String extrairEmail(String token) {
		return parseClaims(token).getSubject();
	}

	public Long extrairUsuarioId(String token) {
		return parseClaims(token).get("usuarioId", Long.class);
	}

	public boolean validar(String token) {
		try {
			parseClaims(token);
			return true;
		} catch (JwtException | IllegalArgumentException e) {
			return false;
		}
	}

	private Claims parseClaims(String token) {
		return Jwts.parser()
				.verifyWith(chave)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public record TokenGerado(String valor, Instant expiraEm) {
	}

}
