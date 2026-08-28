# Extensão de Escopo — Explicação Ancorada no Material (RAG-lite)

Extensão da especificação já fechada. Reaproveita 100% da infraestrutura
de IA já existente (`GeminiClient`) — sem vector store, sem embeddings,
sem dependência nova. A ancoragem no material real vem de injetar o
`texto_extraido` (já salvo desde UC03) diretamente no prompt, já que os
PDFs deste domínio cabem na janela de contexto do modelo.

## 1. Nova Regra de Negócio

| Cód. | Descrição |
|---|---|
| RN19 | Quando o estudante solicita explicação de um flashcard, o sistema deve gerar a explicação via IA ancorada no texto extraído do material de origem daquele flashcard (RN07), não em conhecimento genérico do modelo. Se o flashcard for de origem MANUAL e não tiver material de origem associado, o sistema gera a explicação sem ancoragem, sinalizando isso na resposta (`ancoradaNoMaterial: false`). |

## 2. Novo Caso de Uso

### UC14 — Solicitar explicação de um flashcard

- **Ator:** Estudante
- **Objetivo:** Obter uma explicação alternativa/mais detalhada de um flashcard, ancorada no material original quando disponível, tipicamente após errar ou ter dúvida durante o estudo.
- **Pré-condições:** Flashcard existente, pertencente a um deck do usuário autenticado.
- **Pós-condições:** Explicação retornada (não persistida — gerada sob demanda a cada chamada).
- **Fluxo principal:**
  1. Estudante solicita explicação de um flashcard (ex.: botão "Não entendi, explique melhor" durante o estudo, UC08).
  2. Sistema aplica RN01.
  3. Sistema verifica se o flashcard tem um material de origem associado (via o Deck ao qual pertence — flashcards de origem IA vêm de um MaterialOrigem específico; para flashcards manuais, não há material associado diretamente, mas o deck pode ter materiais).
  4. Se houver texto extraído disponível, monta um prompt com a pergunta, a resposta e o texto do material como contexto, pedindo à IA uma explicação alternativa ancorada nesse texto.
  5. Se não houver material disponível, gera a explicação sem ancoragem (RN19), sinalizando isso.
  6. Sistema retorna a explicação.
- **Fluxos de exceção:** E1 — falha na API de IA → mensagem de erro amigável (502).
- **Regras relacionadas:** RN19

## 3. Modelo de dados

Nenhuma tabela ou coluna nova é necessária — a associação de qual
material deu origem a um flashcard específico não é rastreada
individualmente hoje (o fluxo de UC04/UC05 gera N flashcards a partir
de 1 material, mas não salva o `material_origem_id` no flashcard).

**Decisão para este escopo:** usar o material mais recente do deck ao
qual o flashcard pertence (ordenado por `criado_em desc`), não uma
referência exata flashcard→material. Isso é uma simplificação
deliberada — documentar como tal. Se um deck tiver múltiplos materiais
de tópicos diferentes, a ancoragem pode não ser perfeitamente precisa;
trabalho futuro seria adicionar `material_origem_id` em `Flashcard`
para rastreabilidade exata.

## 4. Extensão do Contrato de API

### Explicação de Flashcard (UC14)

| Método | Endpoint | Request Body | Resposta de sucesso | Erros possíveis |
|---|---|---|---|---|
| POST | `/api/flashcards/{id}/explicacao` | — | `200` — `{ explicacao: string, ancoradaNoMaterial: boolean }` | `401` · `403` (RN01) · `404` · `502` (falha na IA) |

## 5. Prompt de Implementação

```
Leia docs/regras-de-negocio.md (RN19), docs/casos-de-uso.md (UC14) e
docs/integracao-ia.md antes de continuar. Reaproveite o GeminiClient
já existente — não crie infraestrutura nova (sem vector store, sem
embeddings). Não altere nenhum comportamento existente.

1. No pacote com.tcc.plataformaestudos.ia (ao lado de
   FlashcardGenerationService), crie um ExplicacaoService com o método
   gerarExplicacao(flashcardId):
   - Aplica RN01 via FlashcardService.buscarFlashcardDoUsuarioAutenticado
     (já existente)
   - Busca o material de origem mais recente do deck ao qual o
     flashcard pertence (MaterialOrigemRepository, ordenado por
     criado_em desc, filtrando status=PROCESSADO e texto_extraido não
     nulo) — se não encontrar nenhum, segue sem ancoragem (RN19)
   - Monta o prompt:
     - Com material: inclui pergunta, resposta e o texto_extraido como
       contexto, pedindo à IA uma explicação alternativa/mais didática
       baseada SOMENTE naquele texto, sem inventar informação que não
       esteja lá
     - Sem material: pede uma explicação genérica da pergunta/resposta,
       sem prometer ancoragem
   - Chama o GeminiClient (reaproveitar, não duplicar)
   - Retorna { explicacao, ancoradaNoMaterial }
   - Trate falha da IA com a mesma exceção já usada em
     FlashcardGenerationService (502)

2. Endpoint POST /api/flashcards/{id}/explicacao (pode ficar no
   FlashcardItemController existente, ou um ExplicacaoController novo
   — decida seguindo o padrão já usado no projeto para organização por
   raiz de path).

3. Log (RN16, mesmo padrão já usado) da chamada, incluindo se foi
   ancorada ou não, sem logar o texto completo do material.

4. Testes unitários cobrindo: explicação com material disponível
   (ancoradaNoMaterial=true, prompt contém o texto extraído); sem
   material disponível (ancoradaNoMaterial=false); RN01 (flashcard de
   outro usuário); falha da IA (502). Mock do GeminiClient e dos
   repositories, sem chamar a API real.

Siga docs/boas-praticas-backend.md em tudo.
```

## 6. Teste manual

1. Usa um flashcard que veio de geração via IA (tem material associado
   no mesmo deck) → `POST /api/flashcards/{id}/explicacao` → confirma
   `ancoradaNoMaterial: true` e que a explicação faz referência a
   conteúdo real do PDF (não genérico).
2. Cria um flashcard manual num deck sem nenhum material enviado →
   mesma chamada → confirma `ancoradaNoMaterial: false`, resposta ainda
   assim coerente (só sem citar o material).
3. RN01: usuário B tenta chamar em flashcard do usuário A → 403.

## 7. Como isso reforça a narrativa do TCC

Argumento de defesa pronto: "diferente de um chatbot genérico, a
explicação é sempre ancorada no material que o próprio aluno enviou —
quando disponível, a IA é instruída a responder apenas com base
naquele texto, reduzindo o risco de alucinação e mantendo a resposta
fiel ao conteúdo real da disciplina." Isso é RAG na essência conceitual
(retrieval + generation grounded em uma fonte), implementado de forma
proporcional ao escopo do domínio (documentos que cabem no contexto),
com a extensão para RAG vetorial completo (pgvector, chunking,
embeddings) registrada como trabalho futuro para materiais mais
extensos.
