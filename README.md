# StudyWeb

Plataforma de estudos com flashcards, repetição espaçada (SM-2), geração de
conteúdo via IA (Gemini) e provas personalizadas. Stack: Spring Boot 4 (Java
17) + PostgreSQL no backend, React 19/TypeScript/Vite no frontend.

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
./mvnw test        # backend
cd frontend && npm run build   # typecheck + build do frontend
```
