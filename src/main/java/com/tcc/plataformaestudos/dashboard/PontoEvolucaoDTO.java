package com.tcc.plataformaestudos.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PontoEvolucaoDTO(LocalDate data, BigDecimal mediaQualidade, long totalRevisoes) {
}
