package com.tcc.plataformaestudos.dashboard;

import java.util.Set;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/**
 * UC11 — Dashboard de Progresso, estendido por UC15 — Dashboard Avançado
 * (docs/contrato-api.md).
 */
@RestController
@RequiredArgsConstructor
public class DashboardController {

	private static final Set<Integer> PERIODOS_VALIDOS = Set.of(7, 30, 90);

	private final DashboardService dashboardService;

	@GetMapping("/api/decks/{id}/dashboard")
	public ResponseEntity<DashboardResponseDTO> obterDashboard(@PathVariable("id") Long deckId) {
		return ResponseEntity.ok(dashboardService.obterDashboard(deckId));
	}

	@GetMapping("/api/decks/{id}/dashboard/evolucao")
	public ResponseEntity<EvolucaoResponseDTO> obterEvolucao(
			@PathVariable("id") Long deckId,
			@RequestParam(name = "dias", defaultValue = "30") int dias) {
		validarDias(dias);
		return ResponseEntity.ok(dashboardService.obterEvolucao(deckId, dias));
	}

	@GetMapping("/api/decks/{id}/dashboard/topicos")
	public ResponseEntity<TopicosResponseDTO> obterTopicos(@PathVariable("id") Long deckId) {
		return ResponseEntity.ok(dashboardService.obterDetalhamentoPorTopico(deckId));
	}

	@GetMapping("/api/decks/{id}/dashboard/atividade")
	public ResponseEntity<AtividadeResponseDTO> obterAtividade(@PathVariable("id") Long deckId) {
		return ResponseEntity.ok(dashboardService.obterAtividade(deckId));
	}

	@GetMapping("/api/usuario/dashboard-geral")
	public ResponseEntity<DashboardGeralResponseDTO> obterDashboardGeral() {
		return ResponseEntity.ok(dashboardService.obterDashboardGeral());
	}

	/** Validação de formato básico (contrato só aceita 7/30/90 — 400 caso contrário). */
	private void validarDias(int dias) {
		if (!PERIODOS_VALIDOS.contains(dias)) {
			throw new PeriodoInvalidoException("O parâmetro 'dias' deve ser 7, 30 ou 90");
		}
	}

}
