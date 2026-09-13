# Spec: Auditoria de Segurança — Sistema de TCC

## Contexto do projeto
- Nome/tema do TCC: studyweb
- Stack (linguagens, frameworks, banco de dados, infra/hospedagem): Java, React, Springboot, PostgreSQL, docker, nginx, maven e flyway
- Tipo de sistema: sistema web
- Lida com dados sensíveis? (dados pessoais, senhas, pagamentos, dados de saúde/educação, etc.): Lida com login e cadastro com senhas, nome de usuario e segue regras da LGPD
- Já tem algo em produção/deploy público, ou é só ambiente local?: Ambiente local

## Objetivo
Fazer uma auditoria de segurança completa do código-fonte, identificando vulnerabilidades reais e sugerindo correções, priorizadas por gravidade. O objetivo é tanto proteger o sistema quanto fortalecer a monografia (seção de segurança) e a apresentação para a banca.

## Escopo da análise

### 1. Autenticação e Autorização
- Como senhas são armazenadas (hash + salt? algoritmo usado — bcrypt/argon2 vs md5/sha1 puro)
- Gerenciamento de sessão/token (JWT mal configurado, expiração, revogação, secret hardcoded)
- Controle de acesso: existe verificação de permissão em TODAS as rotas sensíveis, ou dá pra acessar recursos de outro usuário trocando um ID na URL (IDOR)?
- Rate limiting em login/rotas críticas (proteção contra brute force)

### 2. Validação e Injeção
- SQL Injection (uso de queries concatenadas vs prepared statements/ORM seguro)
- XSS (dados do usuário renderizados sem sanitização)
- Validação de entrada no backend (não confiar só no frontend)
- Upload de arquivos (extensão, tipo MIME, tamanho, path traversal)

### 3. Exposição de dados sensíveis
- Variáveis de ambiente / secrets no código-fonte ou no repositório Git (procurar .env commitado, API keys hardcoded)
- Mensagens de erro que vazam stack trace, versão de framework, estrutura do banco
- Dados sensíveis em logs
- HTTPS obrigatório / cookies com flags corretas (HttpOnly, Secure, SameSite)

### 4. CORS e configuração de infraestrutura
- CORS liberado demais (`*` em produção)
- Headers de segurança ausentes (CSP, X-Frame-Options, X-Content-Type-Options)
- Dependências desatualizadas com CVEs conhecidas (rodar audit da linguagem: `npm audit`, `pip-audit`, etc.)

### 5. Lógica de negócio
- Validações que existem só no frontend e podem ser burladas
- Falta de verificação de propriedade (usuário A editando/deletando recurso do usuário B)
- Exposição de endpoints administrativos sem proteção

## Formato de saída esperado

Para cada vulnerabilidade encontrada, apresentar:

| Campo | Descrição |
|---|---|
| **Severidade** | 🔴 Crítica / 🟠 Alta / 🟡 Média / 🟢 Baixa |
| **Onde** | arquivo + linha/trecho |
| **O que é o problema** | explicação clara |
| **Como pode ser explorado** | cenário de ataque simples (sem instruções de exploit completo) |
| **Como corrigir** | código ou abordagem sugerida |
| **Esforço** | curto / médio / longo |

No final, gerar um **resumo executivo** com:
- Quantidade de achados por severidade
- Top 3 correções que devem ser feitas antes da entrega
- Sugestão de 1 parágrafo pra incluir na monografia sobre as medidas de segurança adotadas

## Restrições
- Focar em vulnerabilidades reais identificadas no código, não em checklist genérico solto.

## Estado atual (atualizado após a auditoria de 2026-09, ver `Docs/auditoria-erros-2026-09.md`)

Itens do escopo acima já cobertos no código — não repetir como achado numa
próxima rodada, a menos que uma regressão seja encontrada:

- **Senhas**: hash com BCrypt (`SecurityConfig.java`, `PasswordEncoder`), nunca texto plano.
- **JWT**: secret e expiração via variável de ambiente (`jwt.secret`/`jwt.expiration-ms`), sem fallback real em produção (`SegredosStartupValidator` avisa alto no log se o fallback fraco estiver em uso).
- **Rate limiting**: implementado em `config/RateLimitingFilter.java` — login, cadastro, esqueci-senha, redefinir-senha, verificar-email, reenviar-verificação (por IP) e todos os endpoints de IA + lembrete de revisão manual (por usuário autenticado). Ver limites exatos em `Docs/contrato-api.md`.
- **CORS**: origem restrita via `app.cors.allowed-origins` (env `CORS_ALLOWED_ORIGINS`), não é `*`; `allowedHeaders` restrito a `Authorization`/`Content-Type` (os únicos que o frontend envia — antes era `List.of("*")`).
- **IDOR/controle de acesso**: RN01 aplicada nas rotas escopadas por usuário; unificação 403→404 em rotas de deck para evitar enumeração (achado B15).
- **Headers de segurança**: `SecurityConfig.securityFilterChain` configura `.headers(...)` explicitamente — CSP (`default-src 'none'; frame-ancestors 'none'`, adequado a uma API somente JSON sem HTML servido pelo backend), `frameOptions=DENY` e `contentTypeOptions` (os dois últimos já vinham por padrão do Spring Security, agora documentados em vez de implícitos).
- **Rate limiter e `X-Forwarded-For`** (achado B13): resolvido de forma opt-in — `resolverChaveCliente` só lê o header quando `app.rate-limit.confiar-x-forwarded-for=true` for configurado explicitamente (env `RATE_LIMIT_CONFIAR_X_FORWARDED_FOR`, default `false`). Confiar no header sem um proxy confiável na frente seria, em si, uma falha (qualquer cliente forjaria um IP novo a cada request); a config só deve ser ligada quando o deploy real estiver atrás de um proxy/CDN que sobrescreve esse header. Testado em `RateLimitingFilterTest` (`naoDeveConfiarEmXForwardedForPorPadrao`, `deveConfiarEmXForwardedForQuandoConfigurado`).

- **`janelasPorChave` com expurgo periódico** (achado B14, resolvido): `config/RateLimitingFilter.java` — varredura no máximo a cada 5min remove chaves de IP/usuário paradas há mais de 2min, evitando crescimento sem limite em processos de vida longa.

Nenhum gap confirmado em aberto no escopo desta auditoria (ver `Docs/auditoria-erros-2026-09.md` para o histórico completo, incluindo achados de baixo impacto tratados como melhoria opcional, não bug).
