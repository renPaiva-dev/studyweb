# Boas Práticas de Frontend (React)

Este documento define os padrões que o código do frontend deve seguir. Ao
implementar qualquer tela ou componente, aplique estas regras por padrão.

## 1. Estrutura de pastas

Organize por responsabilidade, não tudo solto em `src/`:

```
src/
├── api/            # funções que chamam o backend (uma por recurso: deckApi.js, flashcardApi.js...)
├── components/     # componentes reutilizáveis (Button, FlashcardCard, Modal...)
├── pages/          # telas completas (DecksPage, EstudarDeckPage, DashboardPage...)
├── hooks/          # hooks customizados (useAuth, useFilaEstudo...)
├── context/        # contexto de autenticação, etc.
└── utils/          # funções auxiliares puras (formatação de data, etc.)
```

## 2. Camada de API centralizada — nunca `fetch` espalhado pelos componentes

- Toda chamada HTTP ao backend fica em `src/api/`, uma função por endpoint, seguindo exatamente `docs/contrato-api.md` (mesmo método, mesmo path, mesmo formato de body).
- Um único cliente HTTP configurado uma vez (ex.: instância do `axios` com `baseURL` e interceptor que injeta o token JWT automaticamente em todas as requisições).
- Componentes e páginas **chamam essas funções**, nunca fazem `fetch`/`axios` diretamente inline. Isso evita duplicar lógica de headers/erro em 10 lugares diferentes.

Exemplo de organização (`api/flashcardApi.js`):
```javascript
export async function listarFlashcards(deckId) { /* GET /api/decks/{id}/flashcards */ }
export async function criarFlashcard(deckId, dados) { /* POST /api/decks/{id}/flashcards */ }
export async function avaliarRevisao(flashcardId, qualidade) { /* POST /api/flashcards/{id}/revisoes */ }
```

## 3. Tratamento de erros da API

- Toda chamada à API deve tratar o erro no formato padrão definido em `docs/contrato-api.md` (`{ timestamp, status, error, message, path }`) e exibir `message` de forma amigável ao usuário — nunca mostrar stack trace ou JSON cru na tela.
- Erros `401` devem redirecionar para a tela de login (token expirado/inválido).
- Erros `403`/`404` devem mostrar mensagem clara ("Você não tem acesso a este deck" / "Deck não encontrado"), nunca uma tela em branco.

## 4. Estado de carregamento e feedback visual

- Toda ação que depende de chamada à API (login, gerar flashcards via IA, salvar revisão) precisa de um estado de loading visível — especialmente a geração via IA, que pode levar alguns segundos (RNF01: até 15s).
- Nunca deixar o usuário sem feedback depois de clicar em um botão — desabilite o botão e mostre um indicador enquanto a requisição está em andamento.
- Ações destrutivas (excluir deck, excluir flashcard) sempre pedem confirmação antes de chamar a API (refletindo RN13 na interface).

## 5. Componentização

- Componentes pequenos e com uma responsabilidade clara. Se um componente passa de ~150 linhas ou faz mais de uma coisa (ex.: busca dados **e** renderiza **e** controla um modal), considere quebrar em subcomponentes ou extrair um hook.
- Nomenclatura: componentes em `PascalCase` (`FlashcardCard.jsx`), hooks customizados sempre começando com `use` (`useFilaEstudo.js`).
- Extraia lógica repetida em hooks customizados em vez de copiar `useEffect`/`useState` entre componentes parecidos.

## 6. Autenticação e rotas protegidas

- Token JWT armazenado (ex.: `localStorage` ou cookie, conforme decisão do projeto) e anexado automaticamente pelo interceptor da camada de API (seção 2).
- Rotas que exigem login (tudo exceto cadastro/login) devem ser protegidas por um componente de rota (`<RotaProtegida>` ou equivalente) que redireciona para login se não houver token válido.
- Nunca guardar dados sensíveis (senha) em estado do React ou em `localStorage`.

## 7. Formulários

- Validação client-side básica (campos obrigatórios, formato de e-mail) para dar feedback rápido, mas **nunca confiar só nisso** — o backend é sempre a fonte de verdade das regras de negócio (RN02, RN06, etc.). Trate também os erros de validação que vierem do backend.
- Desabilite o botão de submit durante o envio, para evitar duplo clique gerando requisições duplicadas (relevante principalmente em "Enviar PDF" e "Criar deck").

## 8. Consistência visual

- Definir um conjunto mínimo de tokens de design (cores, espaçamentos, tipografia) usado em todos os componentes, em vez de estilos inline soltos e inconsistentes.
- Reaproveitar os mesmos componentes de UI (botão, card, modal) em todas as telas — não recriar variações ligeiramente diferentes do mesmo elemento.

## 9. Variáveis de ambiente

- URL base da API (`http://localhost:8080` em dev, URL de produção no deploy) via variável de ambiente (`.env`, ex. `VITE_API_URL` ou `REACT_APP_API_URL`), nunca hardcoded no código.
- Nunca commitar `.env` com valores reais — commitar um `.env.example` com as chaves vazias.

## 10. Fluxo específico da geração via IA (UC04/UC05) na interface

Esse fluxo tem uma particularidade importante de UX, reflexo direto da RN05:
1. Ao clicar "Gerar flashcards", mostrar loading (pode demorar alguns segundos).
2. As sugestões retornadas **não são flashcards salvos ainda** — a tela deve deixar isso visualmente claro (ex.: badge "sugestão pendente" em cada card).
3. O usuário precisa poder aceitar, editar ou descartar **cada sugestão individualmente**, não só "aceitar tudo ou nada".
4. Só depois da confirmação explícita é que a lista vira flashcards de verdade no deck.

## 11. Antes de considerar uma tela "pronta"

Checklist rápido:
- [ ] Todas as chamadas à API passam pela camada centralizada (`src/api/`)?
- [ ] Todo estado de loading e erro tem feedback visual?
- [ ] Ações destrutivas pedem confirmação?
- [ ] A tela funciona em mobile (RNF04 — responsividade)?
- [ ] Nenhuma regra de negócio crítica (RN) está sendo reimplementada no frontend em vez de confiar na resposta do backend?
