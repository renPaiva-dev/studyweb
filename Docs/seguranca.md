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
