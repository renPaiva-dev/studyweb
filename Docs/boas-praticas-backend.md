# Boas Práticas de Backend (Java + Spring Boot)

Este documento define os padrões que o código do backend deve seguir. Ao
implementar qualquer funcionalidade, aplique estas regras por padrão — não é
necessário que o prompt as repita toda vez.

## 1. Arquitetura em camadas

Responsabilidade de cada camada — não misturar:

| Camada | Responsabilidade | Não deve fazer |
|---|---|---|
| `Controller` | Receber request, validar formato básico, chamar o service, montar a response HTTP | Lógica de negócio, acesso direto ao repository |
| `Service` | Regras de negócio (RN), orquestração, transações | Detalhes de HTTP (status code, headers) |
| `Repository` | Acesso a dados (Spring Data JPA) | Regras de negócio |

Nunca chame um `Repository` diretamente de um `Controller`. Nunca coloque
regra de negócio (ex.: cálculo do SM-2, validação de RN08) dentro do
`Controller`.

## 2. DTOs — nunca expor Entity diretamente

- Toda entrada de dados do controller usa um **DTO de request** (`record`), nunca a `@Entity` diretamente.
- Toda saída usa um **DTO de response**, mesmo que seja quase idêntico à entidade — isso evita vazar campos internos (ex.: `senha_hash`) e desacopla o contrato de API (`docs/contrato-api.md`) da estrutura do banco.
- Nomenclatura sugerida: `DeckRequestDTO`, `DeckResponseDTO`, `FlashcardSugestaoDTO`, etc.
- Mapeamento entre Entity e DTO: métodos estáticos simples (`DeckResponseDTO.fromEntity(deck)`) ou MapStruct, se o projeto crescer. Evite fazer isso "na mão" repetido em vários lugares — centralize num método ou mapper.

## 3. Validação

- Use Bean Validation (`@NotBlank`, `@Email`, `@Min`, `@Max`, `@Size`) nos DTOs de request.
- Ative com `@Valid` no parâmetro do controller.
- Validações que dependem de estado do banco (ex.: RN02 — e-mail único) **não** dá pra fazer só com anotação — isso vai no service, com uma consulta explícita antes de salvar.
- Toda regra de negócio (RN01 a RN16) deve ter um ponto único e claro no código onde é validada — evite duplicar a mesma checagem em vários services.

## 4. Tratamento de exceções

- Uma exceção customizada por tipo de erro de negócio (ex.: `RecursoNaoEncontradoException`, `AcessoNegadoException`, `GeracaoFlashcardsException`).
- Um único `@RestControllerAdvice` centraliza a conversão dessas exceções para o formato de erro padrão definido em `docs/contrato-api.md`.
- Nunca deixar uma exceção "vazar" como stack trace cru na resposta HTTP.
- Nunca usar `Exception` genérica para controle de fluxo de negócio — sempre uma exceção específica e nomeada.

## 5. Segurança e RN01 (isolamento por usuário)

- Todo endpoint que recebe `{id}` de um recurso pertencente a um usuário (deck, flashcard, material, etc.) deve verificar que o recurso pertence ao usuário autenticado **antes** de retornar ou modificar qualquer coisa — implementando RN01 e retornando `403` em caso de violação (ver `docs/contrato-api.md`).
- Centralize essa checagem (ex.: um método `verificarPropriedade(deck, usuarioLogado)` reutilizado nos services), não duplique a lógica em cada método.
- Nunca logar senha, token JWT completo, ou texto extraído de PDF do usuário em nível `INFO`. Use `DEBUG` com cautela, e nunca em produção.
- Senha sempre com hash (bcrypt) — nunca comparar senha em texto plano.
- Segredos (chave JWT, `GEMINI_API_KEY`, credenciais de banco) sempre via variável de ambiente, nunca hardcoded ou commitado.

## 6. Injeção de dependência

- Injeção via **construtor**, nunca `@Autowired` em campo. Com Lombok, use `@RequiredArgsConstructor` e campos `private final`.
- Isso facilita escrever testes unitários com Mockito (construtor explícito = fácil de mockar).

## 7. Transações

- Métodos de `Service` que fazem mais de uma escrita no banco (ex.: criar flashcard + registrar log de uso de IA) devem ser anotados com `@Transactional`, garantindo atomicidade.
- Métodos de leitura pura podem usar `@Transactional(readOnly = true)` para otimização.

## 8. Testes

- Todo `Service` com lógica de negócio não trivial (especialmente `FlashcardGenerationService` e o cálculo do SM-2) deve ter teste unitário com JUnit + Mockito, mockando dependências externas (repository, `GeminiClient`).
- Nomenclatura de teste: `deveFazerXQuandoY()` ou `should_fazerX_quandoY()` — escolha um padrão e mantenha consistente no projeto inteiro.
- Testes não devem chamar a API real do Gemini nem o banco real — sempre mockados/em memória (H2, se necessário para testes de integração).
- Ao implementar uma regra de negócio (RN), o ideal é já escrever o teste que comprova aquela regra especificamente (ex.: teste dedicado para "RN12: fator de facilidade nunca fica abaixo de 1.3").

## 9. Logs

- Usar SLF4J (`private static final Logger log = LoggerFactory.getLogger(Classe.class)`), nunca `System.out.println`.
- Logar: início/fim de operações relevantes, erros com contexto suficiente para debugar, chamadas à API de IA (RN16 exige isso explicitamente).
- Não logar dados sensíveis (ver seção 5).

## 10. Banco de dados

- Alterações de schema via ferramenta de migration (Flyway ou Liquibase), não `ddl-auto: update` em produção — isso evita perder controle do histórico de mudanças no banco, importante inclusive para o capítulo de "versionamento" do TCC.
- Toda constraint definida no DDL (`docs/modelo-de-dados.md`) deve ter equivalente na entidade JPA (Bean Validation e/ou `@Column` com `nullable=false`, etc.) — dupla camada de garantia, nunca só uma.

## 11. Nomenclatura e organização

- Pacotes por feature, não por tipo técnico: `com.tcc.plataformaestudos.flashcard` (contendo controller, service, repository, dto daquela feature), em vez de `com.tcc.plataformaestudos.controllers`, `.services`, etc. separados.
- Nomes de métodos em português ou inglês — escolha um e seja consistente no projeto inteiro (recomendo português para nomes de domínio, já que os RN/UC estão em português, e inglês para termos técnicos genéricos como `save`, `findById`).

## 12. Antes de considerar uma funcionalidade "pronta"

Checklist rápido:
- [ ] Segue exatamente o contrato definido em `docs/contrato-api.md` (método, path, status codes)?
- [ ] Todas as RN relacionadas ao caso de uso estão implementadas e testadas?
- [ ] RN01 (isolamento por usuário) foi verificada, se aplicável?
- [ ] Tem teste unitário cobrindo o caminho feliz e pelo menos um caminho de erro?
- [ ] Nenhum dado sensível é logado ou vaza na resposta de erro?
