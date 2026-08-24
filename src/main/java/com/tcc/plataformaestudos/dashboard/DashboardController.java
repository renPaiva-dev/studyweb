package com.tcc.plataformaestudos.dashboard;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/**
 * UC11 — Dashboard de Progresso (docs/contrato-api.md).
 */
@RestController
@RequiredArgsConstructor
public class DashboardController {

	private final DashboardService dashboardService;

	@GetMapping("/api/decks/{id}/dashboard")
	public ResponseEntity<DashboardResponseDTO> obterDashboard(@PathVariable("id") Long deckId) {
		return ResponseEntity.ok(dashboardService.obterDashboard(deckId));
	}

}
