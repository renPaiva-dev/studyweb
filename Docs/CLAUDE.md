# Plataforma de Estudos com Geração de Flashcards por IA

Contexto persistente para o Claude Code. Leia este arquivo antes de qualquer
implementação. Os documentos completos de especificação estão em `Docs/`.

## Stack

- Backend: Java 17 + Spring Boot (arquitetura em camadas: controller / service / repository)
- Banco de dados: PostgreSQL
- Frontend: React
- IA: API Gemini (via chamada HTTP simples, sem SDK — ver `Docs/integracao-ia.md`)
- Autenticação: JWT

## Convenções

- Pacotes Java organizados por feature: `com.tcc.plataformaestudos.{usuario,deck,flashcard,revisao,ia,quiz,material,dashboard,compartilhamento,config}`
- Atributos Java em camelCase; colunas de banco em snake_case (mapeadas via `@Column(name = "...")`)
- DTOs como `record` sempre que possível
- Toda exceção de negócio estende uma exceção customizada tratada via `@RestControllerAdvice`
- Toda funcionalidade nova deve vir acompanhada de teste unitário (JUnit + Mockito)
- Commits pequenos, um por funcionalidade fechada (não um commit gigante no fim)

## Onde encontrar cada coisa

| Preciso de... | Arquivo |
|---|---|
| Regras de negócio (RN), requisitos funcionais (RF) e não funcionais (RNF) | `Docs/regras-de-negocio.md` |
| Especificação detalhada de cada caso de uso (fluxos, exceções) | `Docs/casos-de-uso.md` |
| Dicionário de dados, relacionamentos e DDL SQL | `Docs/modelo-de-dados.md` |
| Contrato de todos os endpoints REST (request/response/erros) | `Docs/contrato-api.md` |
| Como implementar a chamada à IA (Gemini) | `Docs/integracao-ia.md` |
| Padrões de código do backend (camadas, DTOs, exceções, testes, segurança) | `Docs/boas-praticas-backend.md` |
| Padrões de código do frontend (estrutura, API, estado, UX) | `Docs/boas-praticas-frontend.md` |

## Regra de ouro ao implementar

Antes de gerar qualquer código de uma funcionalidade, cite explicitamente:
1. O(s) caso(s) de uso envolvido(s) (ex.: UC04)
2. A(s) regra(s) de negócio envolvida(s) (ex.: RN08, RN09)
3. O endpoint correspondente no contrato de API, se houver

Todo código gerado — backend ou frontend — deve seguir por padrão,
sem precisar ser lembrado a cada prompt:
- Backend → `Docs/boas-praticas-backend.md`
- Frontend → `Docs/boas-praticas-frontend.md`

Se uma implementação pedida não tiver um UC/RN/endpoint correspondente nos
documentos de `Docs/`, pare e pergunte antes de inventar comportamento novo —
o objetivo deste projeto é seguir a especificação fechada (spec-driven
development), não improvisar.

## Ordem de implementação recomendada

1. Entidades JPA (uma de cada vez, seguindo `Docs/modelo-de-dados.md`)
2. Repositories (Spring Data JPA)
3. Services (um por vez, citando UC + RN no prompt)
4. Controllers (seguindo exatamente `Docs/contrato-api.md`)
5. Testes unitários de cada service
6. Frontend da funcionalidade correspondente