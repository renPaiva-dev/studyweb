package com.tcc.plataformaestudos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling: job diario de lembrete de revisao pendente (ver
// com.tcc.plataformaestudos.revisao.LembreteRevisaoService).
@SpringBootApplication
@EnableScheduling
public class PlataformaEstudosApplication {

	public static void main(String[] args) {
		SpringApplication.run(PlataformaEstudosApplication.class, args);
	}

}
