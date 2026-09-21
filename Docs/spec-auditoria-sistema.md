# SPEC — Auditoria de Coerência e Vazamento de Informação (Frontend ↔ Backend ↔ Produto)

## Objetivo

Esta spec serve para instruir o Claude Code a rodar uma auditoria "fora do óbvio":
não é lint, não é bug de código, não é teste unitário. É sobre **coerência entre o que
o sistema faz de verdade e o que ele mostra/comunica** — tanto para o usuário final
quanto para quem lê o marketing/landing page.

Rode isso como um prompt/checklist dado ao Claude Code, apontando para o repo (frontend
+ backend). Peça para ele produzir um relatório com achados categorizados por severidade
(`crítico`, `importante`, `nice-to-have`), cada um com: arquivo/linha, o que está errado,
por que importa, e sugestão de correção.

---

## Categoria 1 — Vazamento de informação sensível na UI (enumeration / oracle leaks)

Procurar por mensagens de erro, texto de tela ou copy que revelam informação interna
que não deveria ser exposta ao usuário (ou a um atacante).

Exemplos clássicos a procurar:
- "Se esse e-mail existir, enviaremos um link de recuperação" → **deveria ser**
  "Verifique seu e-mail" (não confirmar existência de conta = evitar user enumeration).
- "Senha incorreta" vs "Usuário não encontrado" → mensagens diferentes revelam se o
  e-mail/usuário existe. Deveria ser uma mensagem genérica ("Credenciais inválidas").
- Erros de validação que expõem stack trace, nome de tabela, biblioteca, versão de
  framework, caminho de arquivo no servidor.
- Respostas de API com timing diferente para "usuário existe" vs "não existe" (isso é
  mais difícil de pegar só lendo código, mas vale mencionar no relatório se notar lógica
  de early-return assimétrica).
- Mensagens de "e-mail já cadastrado" no cadastro (mesmo problema de enumeration).
- Headers HTTP ou respostas de erro com detalhes de infraestrutura (versão de server,
  ORM, etc).

**Instrução pro Claude Code:** buscar por strings de erro/copy no frontend e comparar
com o que o endpoint correspondente realmente faz no backend. Perguntar: "essa mensagem
entrega mais informação do que o necessário?"

---

## Categoria 2 — Coerência Frontend ↔ Backend (funcionalidade "escondida")

O sistema faz algo relevante no backend, mas isso nunca aparece pro usuário — nem na
UI, nem na landing page, nem no onboarding.

Como procurar:
- Mapear endpoints/serviços/regras de negócio do backend (ex: cálculo automático,
  webhook, integração, validação inteligente, cache, retry, rate-limit generoso,
  criptografia extra, etc).
- Cruzar com o frontend/marketing: essa capacidade é comunicada em algum lugar?
- Se não for, listar como oportunidade perdida de copy/produto: "O sistema faz X, que
  é um diferencial, e isso não aparece em nenhuma tela nem na landing page."

Exemplos do tipo de achado esperado:
- Backend faz retry automático com backoff exponencial em pagamentos falhos → frontend
  só mostra "Pagamento falhou", sem indicar que vai tentar de novo.
- Backend anonimiza dados automaticamente antes de logs → nunca mencionado em página de
  privacidade/segurança, que poderia ser argumento de venda.
- Sistema suporta importação em lote via CSV (existe endpoint) mas não tem botão/menção
  na UI.

**Instrução pro Claude Code:** listar toda lógica de negócio "não trivial" no backend e
perguntar, endpoint por endpoint: "isso é visível/comunicado no frontend?"

---

## Categoria 3 — Inconsistência de terminologia e nomes

- O backend chama uma entidade de "workspace", o frontend chama de "projeto", o banco
  de dados chama de "org" → gera confusão em logs, suporte, e documentação.
- Nomes de campos em português no frontend e inglês no backend sem um dicionário
  consistente (ex: `status` pode significar coisas diferentes em cada lugar).
- Mensagens de erro/copy que usam um nome de feature diferente do nome usado no menu.

---

## Categoria 4 — Estados vazios, de erro e de borda esquecidos

- O que a UI mostra quando a lista está vazia? Existe um estado para isso, ou aparece
  quebrado/branco?
- O que acontece se uma chamada de API der timeout? A UI trata isso ou fica travada
  silenciosamente?
- Permissões: o backend bloqueia uma ação (403), mas o frontend ainda mostra o botão
  habilitado, gerando um erro confuso para o usuário.
- Rate limiting: o backend limita, mas a UI não avisa "você atingiu o limite", só falha
  genérico.

---

## Categoria 5 — Permissões e controle de acesso (autorização "fantasma")

- Frontend esconde um botão/menu baseado em uma role, mas o endpoint correspondente no
  backend não valida essa role (segurança por obscuridade, não por controle real).
- Endpoint existe e funciona, mas nenhuma tela usa; verificar se está protegido mesmo
  assim (endpoint "esquecido" exposto sem uso real, mas acessível).
- Mensagens de erro de permissão revelam a existência de um recurso que o usuário não
  deveria nem saber que existe (ex: "Você não tem permissão para acessar o pedido #4521"
  confirma que o pedido existe).

---

## Categoria 6 — Configuração, ambiente e segredos "quase" expostos

- Variáveis de ambiente, chaves de API, ou flags de debug que aparecem em respostas de
  API, comentários de código enviados ao bundle do frontend, ou console.log esquecido.
- Feature flags que estão "on" em produção mas deveriam estar só em staging (ou
  vice-versa) — texto de UI que menciona funcionalidade "beta" já lançada há meses.
- CORS ou headers de segurança configurados de forma mais permissiva do que o necessário.

---

## Categoria 7 — Documentação e comunicação desatualizada

- README, changelog, ou copy de e-mail transacional descrevendo comportamento antigo
  que já foi alterado no código.
- Landing page promete um SLA, um recurso de segurança (ex: "criptografia de ponta a
  ponta") ou uma integração que o backend atual não implementa (ou implementa
  parcialmente).
- Textos de "em breve" para funcionalidades que já foram implementadas (e o oposto:
  funcionalidades anunciadas como já existentes mas que não existem).

---

## Categoria 8 — Copy que assume conhecimento técnico do usuário

- Mensagens de erro/instrução que usam jargão interno ("token JWT expirou", "erro 422")
  em vez de linguagem humana ("sua sessão expirou, faça login novamente").
- Textos que expõem detalhes de implementação que são irrelevantes pro usuário e só
  geram ansiedade ou confusão (ex: "Processando via fila assíncrona, isso pode levar
  algumas horas" quando na prática leva segundos).

---

## Formato esperado do relatório final

Para cada achado, pedir ao Claude Code que estruture assim:

```
[SEVERIDADE] Categoria — Título curto
Local: caminho/do/arquivo.ts:linha (frontend) + caminho/do/arquivo.ts:linha (backend)
O que está acontecendo: ...
Por que importa: ...
Sugestão: ...
```

Severidades:
- **Crítico**: vaza informação de segurança (enumeration, dados sensíveis, controle de
  acesso quebrado).
- **Importante**: gera confusão real pro usuário ou perde oportunidade de comunicar
  valor do produto.
- **Nice-to-have**: inconsistência cosmética/terminológica sem grande impacto.

---

## Prompt sugerido para colar no Claude Code

> Aja como um auditor de produto e segurança. Analise este repositório (frontend +
> backend) seguindo as 8 categorias da spec abaixo. Para cada categoria, procure
> ativamente por exemplos concretos no código — não generalize sem apontar arquivo e
> linha. Priorize a Categoria 1 (vazamento de informação sensível) e a Categoria 5
> (controle de acesso), pois são as de maior risco. Produza o relatório final no
> formato especificado, ordenado por severidade.
>
> [colar as categorias 1–8 acima]