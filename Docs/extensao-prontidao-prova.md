# Extensão de Escopo — Previsão de Prontidão para Prova (UC31/RN40)

Feature nova (não existia em nenhum RN/UC anterior). Diferente de UC13/UC14/UC27,
**não chama a IA em nenhum momento** — é inteiramente algorítmica, derivada do
próprio estado do SM-2 (RN09) já persistido em `revisao_flashcard`. Reaproveita
a mesma família de consultas "última revisão por flashcard, com tópico" que já
existe em `DashboardRepository` (UC15/RN20) e o mesmo agrupamento por tópico
(RN17). Adiciona uma única coluna nova (`deck.data_alvo_prova`) — sem tabela
nova, sem dependência nova.

## 0. Motivação (contexto da conversa que originou esta spec)

Comparando o sistema com "só usar NotebookLM + Anki": nenhum dos dois cruza a
curva de esquecimento do SM-2 com uma data-alvo real de prova para dizer *o
que* revisar *antes de quando*. Esta feature fecha esse buraco com uma
contribuição algorítmica própria (não um wrapper de LLM), o que também
fortalece a seção de fundamentação teórica da monografia (cita-se
explicitamente a premissa de calibração do SM-2, não só "a IA disse").

## 1. Nova Regra de Negócio (RN40)

> **RN40** — O estudante pode definir uma data-alvo de prova para um deck.
> A partir dela, o sistema estima, por flashcard, a probabilidade de retenção
> na data-alvo, com base no estado do SM-2 (RN09) da última revisão —
> assumindo que o `intervalo_dias` calculado foi calibrado para uma retenção
> de aproximadamente 90% na data da próxima revisão (`proxima_revisao`), e que
> a retenção decai exponencialmente a partir da última revisão real. O
> sistema agrega essa estimativa por tópico (RN17), calcula um índice de
> prontidão geral do deck e devolve os tópicos ordenados da menor para a
> maior retenção estimada (plano de revisão priorizado). Flashcards nunca
> revisados contam com retenção estimada de 0%. A consulta de prontidão sem
> data-alvo definida é um erro (400).

## 2. Novo Caso de Uso (UC31)

> **UC31 — Definir data-alvo de prova e consultar prontidão**
> Ator: Estudante · Pré-condições: deck existente, pertencente ao usuário
> autenticado (RN01) · Pós-condições: data-alvo persistida no deck (não a
> prontidão em si, que é sempre recalculada sob demanda, mesmo espírito de
> RN18).
> Fluxo principal:
> 1. Estudante define a data da prova para um deck.
> 2. Sistema aplica RN01 e valida que a data não é no passado.
> 3. A qualquer momento antes da prova, o estudante consulta a prontidão.
> 4. Sistema calcula, por flashcard, a retenção estimada na data-alvo (RN40),
>    a partir do estado SM-2 da última revisão de cada um.
> 5. Sistema agrega por tópico (RN17) e devolve o índice geral de prontidão e
>    o plano de revisão priorizado.
> Fluxos alternativos: A1 — estudante remove a data-alvo definida.
> Fluxos de exceção: E1 — consulta de prontidão sem data-alvo definida → 400.
> E2 — data-alvo no passado ao definir → 400.
> Regras relacionadas: RN40, RN01, RN17

## 3. Decisões técnicas (RN40 não define — precisam ser fixadas em código, mesmo padrão de RN14/`estaEmRisco` e RN18/`RecomendacaoEstudoService`)

RN40 deixa em aberto o modelo exato da curva de esquecimento e alguns
critérios de agregação. Decisões adotadas, a documentar no javadoc das novas
classes:

- **Modelo da curva de esquecimento**: aproximação exponencial
  `R(t) = 0.9 ^ (t / intervalo)`, onde `t` = dias entre a última revisão real
  (`data_revisao`) e a data-alvo, e `intervalo` = `intervalo_dias` vigente
  nessa última revisão. Premissa: o próprio SM-2 calibra `intervalo_dias`
  para que a retenção esperada na data da próxima revisão
  (`proxima_revisao` = `data_revisao + intervalo_dias`) seja de
  aproximadamente 90% — é a mesma premissa de "retenção-alvo" usada por
  implementações de mercado de repetição espaçada (ex.: o cálculo de "true
  retention" do Anki) para aproximar uma curva de memória sem precisar
  implementar um modelo mais sofisticado (ex.: FSRS), fora de escopo deste
  TCC. Em `t = intervalo`, a fórmula devolve exatamente `R = 0.9`; em
  `t = 0` (avaliado no próprio dia da última revisão), `R = 1`.
- **Flashcard nunca revisado** (nenhuma linha em `revisao_flashcard`):
  retenção estimada = **0%**. Decisão deliberadamente diferente de RN14 (onde
  um flashcard nunca revisado é neutro — não conta como dominado nem em
  risco): ali a semântica é "desempenho histórico"; aqui é "o que
  realisticamente será lembrado na prova" — um flashcard nunca estudado tem
  chance real de ser esquecido, e escondê-lo do cálculo inflaria
  artificialmente o índice de prontidão.
- **`t` negativo** (só ocorreria se a data-alvo já tivesse passado da última
  revisão real no momento da consulta — não deveria acontecer no fluxo normal
  já que a data-alvo é validada como não-passada ao ser definida, mas o tempo
  passa entre definir e consultar): `t` é limitado (`Math.max(0, t)`) antes de
  entrar na fórmula, por segurança — nunca gera retenção > 100%.
- **Limiar mínimo aceitável de retenção** (usado só para contar
  `flashcardsPrecisandoRevisao` por tópico, não para excluir nada do
  resultado) = **0,75** (75%) — valor de exemplo, mesmo espírito do "ex.: 15"
  de RN08 e do "3" de RN18, não uma constante de negócio fechada.
- **"Sem categoria"** (tópico nulo, RN17) **é incluído** na lista de tópicos —
  ao contrário de RN18/UC13 (que o exclui por não ser uma recomendação de
  foco *acionável*), aqui o objetivo é cobertura completa do deck para a
  prova, não escolher um único tópico de destaque; excluí-lo esconderia parte
  real da prontidão do estudante.
- **Deck sem flashcards**: `totalFlashcards = 0`, `prontidaoGeral = 0`,
  `topicos = []`, mensagem informando que o deck ainda não tem flashcards —
  mesmo padrão de `DashboardResponseDTO` para deck vazio (não retorna 100% por
  "não ter nada a esquecer").
- **Sem chamada à IA nesta feature** — 100% determinística/algorítmica.
  Reforça a narrativa já usada em UC13/UC14/UC27 de "IA usada com parcimônia,
  só quando há sinal real" — aqui nem chega a precisar de IA.

## 4. Modelo de dados

Uma única coluna nova em `DECK` — sem tabela nova, sem persistir a prontidão
em si (RN40 é clara: calculada sob demanda, mesmo espírito de RN18).

| Atributo | Tipo | Restrições |
|---|---|---|
| data_alvo_prova | DATE | NULL (RN40 — data definida pelo estudante; ausente até a primeira chamada de `PUT /api/decks/{id}/prova-alvo`) |

Migration `V10__adicionar_data_alvo_prova_deck.sql`:
```sql
-- UC31/RN40: data-alvo de prova por deck, usada para estimar a retencao
-- esperada de cada flashcard naquela data (curva de esquecimento calibrada
-- pelo proprio SM-2/RN09). Nula ate o estudante definir uma data.
ALTER TABLE deck ADD COLUMN data_alvo_prova DATE;
```

## 5. Reuso de infraestrutura

- `DashboardRepository` ganha um novo método de consulta, mesma família de
  `buscarUltimaRevisaoComTopicoPorFlashcard` (mesmo LEFT JOIN correlacionado
  por `MAX(dataRevisao)`), trazendo também `dataRevisao` e `intervaloDias`
  (que a projeção existente não tem, porque o dashboard não precisa deles):
  nova projeção `EstadoProntidaoProjecao(flashcardId, topico, dataRevisao,
  intervaloDias)`.
- `CriterioDesempenhoFlashcard` ganha uma constante pública `SEM_CATEGORIA`
  (hoje é um literal privado duplicável em `DashboardService`) — extraída
  para não duplicar o literal numa segunda classe que também precisa dele
  (`ProntidaoProvaService`). `DashboardService` passa a referenciar a mesma
  constante; comportamento idêntico, sem novo teste necessário ali.
- `DeckService.buscarDeckDoUsuarioAutenticado` aplica RN01, igual a todos os
  outros services de deck.
- A fórmula da curva de esquecimento fica isolada numa classe pura e estática
  própria (`CalculadoraRetencao`, pacote novo `prontidao`), no mesmo espírito
  de `CriterioDesempenhoFlashcard`: função sem estado, testável isoladamente,
  sem se misturar à orquestração do service.

## 6. Novo pacote `com.tcc.plataformaestudos.prontidao`

- **`CalculadoraRetencao`** (classe utilitária, métodos `public static`):
  - `double estimarRetencao(LocalDateTime dataRevisao, Integer intervaloDias, LocalDate dataAlvo)`
    — `0.0` se `dataRevisao == null` (nunca revisado); caso contrário,
    `t = max(0, DAYS.between(dataRevisao.toLocalDate(), dataAlvo))`,
    `intervalo = max(1, intervaloDias)` (defesa contra divisão por zero —
    `intervalo_dias` nunca deveria ser 0 depois de uma revisão real, RN09/RN11
    sempre gravam pelo menos 1), retorna `Math.pow(0.9, t / (double) intervalo)`.
- **`DataAlvoProvaRequestDTO`** — `record(LocalDate dataAlvo)`.
- **`DataAlvoProvaResponseDTO`** — `record(LocalDate dataAlvo)` (nulo se nunca definida).
- **`TopicoProntidaoDTO`** — `record(String topico, int totalFlashcards, BigDecimal retencaoMediaEstimada, int flashcardsPrecisandoRevisao)`.
- **`ProntidaoProvaResponseDTO`** — `record(LocalDate dataAlvoProva, long diasRestantes, int totalFlashcards, BigDecimal prontidaoGeral, List<TopicoProntidaoDTO> topicos, String mensagem)`
  — `topicos` já vem ordenado por `retencaoMediaEstimada` ascendente (mais urgente primeiro — é o próprio "plano de revisão priorizado" de RN40, sem precisar de um campo separado).
- **`DataAlvoProvaInvalidaException`** — estende `NegocioException` (400) — data no passado.
- **`DataAlvoProvaNaoDefinidaException`** — estende `NegocioException` (400) — prontidão consultada sem data-alvo.
- **`ProntidaoProvaService`**:
  - `DataAlvoProvaResponseDTO obterDataAlvo(Long deckId)` — RN01, devolve a data atual (ou `null`).
  - `DataAlvoProvaResponseDTO definirDataAlvo(Long deckId, LocalDate dataAlvo)` — RN01; valida `!dataAlvo.isBefore(LocalDate.now())` (senão `DataAlvoProvaInvalidaException`); persiste via `deckRepository.save`.
  - `void removerDataAlvo(Long deckId)` — RN01; seta `null`, persiste.
  - `ProntidaoProvaResponseDTO calcularProntidao(Long deckId)`:
    1. RN01 via `deckService.buscarDeckDoUsuarioAutenticado`.
    2. Se `deck.getDataAlvoProva() == null` → `DataAlvoProvaNaoDefinidaException`.
    3. Busca `dashboardRepository.buscarUltimaRevisaoParaProntidao(deckId)`.
    4. Se vazio → devolve o DTO "deck vazio" (seção 3).
    5. Para cada estado, `CalculadoraRetencao.estimarRetencao(...)`.
    6. Agrupa por tópico (`topico != null ? topico : CriterioDesempenhoFlashcard.SEM_CATEGORIA`), calcula média de retenção e contagem abaixo do limiar (seção 3) por grupo.
    7. Monta `topicos` ordenados por `retencaoMediaEstimada` ascendente.
    8. `prontidaoGeral` = média simples das retenções de todos os flashcards do deck (não a média dos percentuais por tópico — evita viés de tópicos pequenos).
    9. `mensagem` — texto determinístico (sem IA): lista os nomes dos tópicos com `flashcardsPrecisandoRevisao > 0` (até 3), ou uma mensagem de "boa prontidão" se nenhum tópico estiver abaixo do limiar.
- **`ProntidaoProvaController`**:
  ```java
  @GetMapping("/api/decks/{id}/prova-alvo")
  public ResponseEntity<DataAlvoProvaResponseDTO> obterDataAlvo(@PathVariable("id") Long id) { ... }

  @PutMapping("/api/decks/{id}/prova-alvo")
  public ResponseEntity<DataAlvoProvaResponseDTO> definirDataAlvo(@PathVariable("id") Long id, @Valid @RequestBody DataAlvoProvaRequestDTO request) { ... }

  @DeleteMapping("/api/decks/{id}/prova-alvo")
  public ResponseEntity<Void> removerDataAlvo(@PathVariable("id") Long id) { ... } // 204

  @GetMapping("/api/decks/{id}/prontidao-prova")
  public ResponseEntity<ProntidaoProvaResponseDTO> calcularProntidao(@PathVariable("id") Long id) { ... }
  ```

## 7. Extensão do Contrato de API

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| GET | `/api/decks/{id}/prova-alvo` | — | `200` — `{ dataAlvo }` (`null` se nunca definida) | `401` · `404` (não existe ou não é seu — RN01) |
| PUT | `/api/decks/{id}/prova-alvo` | `{ dataAlvo: "2026-10-01" }` | `200` — `{ dataAlvo }` | `400` (data no passado) · `401` · `404` (RN01) |
| DELETE | `/api/decks/{id}/prova-alvo` | — | `204` | `401` · `404` (RN01) |
| GET | `/api/decks/{id}/prontidao-prova` | — | `200` — `{ dataAlvoProva, diasRestantes, totalFlashcards, prontidaoGeral, topicos: [ { topico, totalFlashcards, retencaoMediaEstimada, flashcardsPrecisandoRevisao } ], mensagem }` (RN40; `topicos` ordenado por `retencaoMediaEstimada` asc) | `400` (data-alvo não definida) · `401` · `404` (RN01) |

Sem rate limiting específico (não chama IA nem serviço externo, RNF10 não se aplica).

## 8. Testes unitários

**`CalculadoraRetencaoTest`** (função pura, sem mocks):
- `dataRevisao == null` → `0.0`.
- `t == 0` (dataAlvo == dataRevisao) → `1.0`.
- `t == intervaloDias` → `≈0.9` (delta pequeno).
- `t == 2 * intervaloDias` → `≈0.81` (`0.9²`).
- `intervaloDias == 0` (defesa) → não lança exceção, trata como 1.
- `dataAlvo` antes de `dataRevisao` (t negativo) → clampado para `t=0` → `1.0`.

**`ProntidaoProvaServiceTest`** (mock `DeckService`/`DeckRepository`/`DashboardRepository`):
- RN01: deck de outro usuário → exceção propagada (mock de `buscarDeckDoUsuarioAutenticado` lançando).
- `definirDataAlvo` com data no passado → `DataAlvoProvaInvalidaException`, nunca chama `deckRepository.save`.
- `definirDataAlvo` com data válida → persiste e devolve a data.
- `calcularProntidao` sem data-alvo definida (`deck.getDataAlvoProva() == null`) → `DataAlvoProvaNaoDefinidaException`.
- `calcularProntidao` com deck sem flashcards → DTO "vazio" (zeros, sem erro).
- `calcularProntidao` com flashcards variados (revisado com boa retenção, revisado com retenção baixa, nunca revisado) e dois tópicos + "Sem categoria" → agregação por tópico correta, `topicos` ordenado por retenção ascendente, `flashcardsPrecisandoRevisao` contado com o limiar de 0,75, `prontidaoGeral` é a média simples de todas as retenções (não a média dos percentuais por tópico).
- `removerDataAlvo` → persiste `null`.

## 9. Prompt de implementação (executado nesta mesma sessão — registrado para consistência com as demais specs)

```
Leia Docs/regras-de-negocio.md (RN40), Docs/casos-de-uso.md (UC31),
Docs/contrato-api.md (seção "Prontidão para Prova") e esta spec completa
antes de continuar. Não altere nenhum comportamento existente — os testes de
DashboardServiceTest devem continuar passando sem alteração de asserção
(só a extração da constante SEM_CATEGORIA muda de lugar, não de valor).

1. Migration V10__adicionar_data_alvo_prova_deck.sql (coluna nullable).
2. Deck: campo dataAlvoProva (LocalDate, coluna data_alvo_prova).
3. CriterioDesempenhoFlashcard: adiciona constante publica SEM_CATEGORIA;
   DashboardService passa a referencia-la em vez do literal privado.
4. DashboardRepository: novo metodo buscarUltimaRevisaoParaProntidao(deckId)
   + projecao EstadoProntidaoProjecao(flashcardId, topico, dataRevisao,
   intervaloDias), mesmo padrao de buscarUltimaRevisaoComTopicoPorFlashcard.
5. Pacote com.tcc.plataformaestudos.prontidao: CalculadoraRetencao,
   DataAlvoProvaRequestDTO/ResponseDTO, TopicoProntidaoDTO,
   ProntidaoProvaResponseDTO, DataAlvoProvaInvalidaException,
   DataAlvoProvaNaoDefinidaException, ProntidaoProvaService,
   ProntidaoProvaController — conforme secoes 6 e 7 desta spec.
6. Testes conforme secao 8. Sem chamada a IA nem banco real (mock de
   DeckService/DeckRepository/DashboardRepository).
7. Frontend: prontidaoApi.ts (client centralizado, seguindo
   boas-praticas-frontend.md secao 2) + um componente ProntidaoProvaCard
   (formulario de data-alvo + indice geral + lista de topicos priorizados),
   montado em DashboardTab. Estado de loading/erro/retry, mesmo padrao das
   demais abas do dashboard.

Siga Docs/boas-praticas-backend.md e boas-praticas-frontend.md em tudo.
```

## 10. Teste manual

1. Deck com flashcards revisados há dias variados (alguns com
   `proxima_revisao` próxima, outros bem atrasados, um nunca revisado) →
   `PUT /api/decks/{id}/prova-alvo` com uma data daqui a 10 dias → `GET
   .../prontidao-prova` → confirma que o flashcard nunca revisado aparece
   com a pior retenção (perto de 0%) e que os tópicos vêm ordenados do pior
   para o melhor.
2. `GET /api/decks/{id}/prontidao-prova` sem nunca ter chamado o `PUT` antes
   → `400`.
3. `PUT` com uma data no passado → `400`.
4. `DELETE /api/decks/{id}/prova-alvo` seguido de novo `GET
   .../prontidao-prova` → volta a dar `400` (data removida).
5. RN01: usuário B chama qualquer um desses endpoints no deck do usuário A →
   `404`.

## 11. Como isso reforça a narrativa do TCC

Diferente de UC13/UC14/UC27 (que usam a IA generativa com parcimônia, mas
ainda a usam), esta feature **não usa IA nenhuma** — é uma contribuição
algorítmica própria sobre um dado que o sistema já produz (o estado do SM-2),
o que dá um argumento de defesa adicional e diferente dos demais: mesmo sem
custo de API nem risco de alucinação, o sistema ainda consegue gerar uma
recomendação acionável e personalizada, só com matemática sobre os dados
reais do estudante. É também a resposta direta a "por que não só usar
NotebookLM + Anki": nenhum dos dois cruza a curva de esquecimento com uma
data-alvo de prova real para produzir um plano de revisão priorizado.
