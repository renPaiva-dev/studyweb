# Sinapse

Plataforma de estudos (nome de projeto: `studyweb`) com flashcards, repetição
espaçada (SM-2), geração de conteúdo via IA (Gemini) e provas personalizadas.
Stack: Spring Boot 4 (Java 17) + PostgreSQL no backend, React 19/TypeScript/
Vite no frontend.

Documentação completa de regras de negócio, casos de uso, modelo de dados e
contrato de API em [`Docs/`](Docs/).

## Rodando com Docker (recomendado)

Pré-requisitos: Docker e Docker Compose.

```bash
cp .env.example .env
# edite .env: defina JWT_SECRET (ex.: openssl rand -base64 32) e GEMINI_API_KEY
# (sem a chave do Gemini, a geração de flashcards/provas via IA não funciona)

docker compose up --build
```

- Frontend: http://localhost:5173
- Backend (API): http://localhost:8080
- Health check: http://localhost:8080/api/health

Os dados do Postgres e os PDFs enviados persistem em volumes Docker
(`db-data`, `uploads-data`) entre reinicializações.

## Rodando localmente sem Docker

Backend:

```bash
# crie src/main/resources/application.properties com as chaves usadas em
# src/main/resources/application-docker.properties (JWT_SECRET, GEMINI_API_KEY,
# credenciais do seu Postgres local) — esse arquivo é local e nunca commitado.
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Testes

```bash
./mvnw test         # backend (JUnit + Mockito)
cd frontend && npm run test    # frontend (Vitest + Testing Library)
cd frontend && npm run build   # typecheck + build do frontend
```

CI (GitHub Actions, `.github/workflows/ci.yml`) roda backend e frontend
(lint + testes + build) a cada push/PR em `main`.

## Deploy público (demonstração/defesa)

Guia passo a passo para publicar no Railway (backup contra depender de
`docker compose up` rodando ao vivo no dia da apresentação):
[`Docs/deploy-railway.md`](Docs/deploy-railway.md).

## Dados de demonstração (apresentação/defesa)

Para popular uma conta com dados realistas (decks, flashcards com histórico
de revisão maduro, data-alvo de prova e tentativas de quiz já registradas —
útil para o Dashboard, Evolução e Previsão de Prontidão não aparecerem
vazios ao vivo), defina `SEED_DEMO_ENABLED=true` no `.env` antes de subir a
aplicação (ver `SeedDemoDataRunner`). Cria a conta `banca@studyweb.local` /
`Banca@2026`, idempotente (não duplica se a conta já existir).

As datas de revisão (streak, gráfico de evolução) são relativas ao momento
em que o seed roda — para ficarem "frescas" na apresentação, rode-o com o
banco limpo (ou após excluir essa conta pela própria aplicação) pouco antes
de apresentar. Mantenha `SEED_DEMO_ENABLED=false` fora desse momento.
