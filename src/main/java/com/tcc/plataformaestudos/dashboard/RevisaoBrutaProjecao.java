package com.tcc.plataformaestudos.dashboard;

import java.time.LocalDateTime;

/**
 * Data e qualidade de uma revisão, sem agregação — a agregação por dia
 * (evolução temporal, UC15/RN20) é feita no service, pois {@code cast(x as
 * date)} em HQL não resolve para {@link java.time.LocalDate} numa
 * constructor-projection (Hibernate produz um tipo incompatível), e este
 * projeto evita função nativa de dialeto específico para algo tão simples.
 */
public record RevisaoBrutaProjecao(LocalDateTime dataRevisao, Integer qualidadeResposta) {
}
