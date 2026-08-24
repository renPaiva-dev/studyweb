# Integração com IA (Geração de Flashcards)

Resumo de como a chamada à IA deve ser implementada. Ver os arquivos Java de
referência já prontos (pasta `ia-implementacao/` fora deste repo, ou pedir ao
Claude Code para recriá-los seguindo este padrão).

## Provedor

- API Gemini (`gemini-1.5-flash`), free tier — https://aistudio.google.com/app/apikey
- Chamada HTTP pura via `java.net.http.HttpClient` (sem SDK), para minimizar dependências.
- Chave configurada via variável de ambiente `GEMINI_API_KEY`, nunca hardcoded.

## Fluxo (ver docs/casos-de-uso.md — UC04)

1. `GeminiClient` monta o request com `responseMimeType: "application/json"` (força JSON puro, sem markdown/crases na resposta).
2. Envia o prompt com o texto extraído do PDF, pedindo no máximo 15 flashcards (RN08).
3. `FlashcardGenerationService` recebe o texto de resposta, faz parse para `List<FlashcardSugestaoDTO>`.
4. Se o JSON vier mal formatado, tenta novamente (até 2 tentativas) antes de lançar `GeracaoFlashcardsException`.
5. Valida que nenhuma sugestão tem pergunta/resposta vazia.
6. Limita o resultado a 15 itens (RN08), mesmo que a IA tenha retornado mais.
7. Controller devolve as sugestões (não persistidas) — ver `docs/contrato-api.md`, seção de geração via IA.
8. Persistência só ocorre no endpoint `/confirmar-sugestoes`, após o usuário revisar (RN05).

## Classes envolvidas

- `GeminiClient` — chamada HTTP crua, devolve texto.
- `FlashcardSugestaoDTO` — record `{ pergunta, resposta }`.
- `FlashcardGenerationService` — monta prompt, valida, aplica RN08.
- `GeracaoFlashcardsController` — expõe o endpoint REST.
- `TratamentoErrosGlobal` — converte exceções em respostas HTTP padronizadas (502 para falha de IA).

## Testes

- Testes unitários de `FlashcardGenerationService` devem mockar `GeminiClient` (não chamar a API real) para não gastar cota e rodar offline.
- Testar manualmente a chave/API com `curl` antes de qualquer integração no Spring (ver script de teste isolado).

## Pontos de atenção ao pedir ao Claude Code para implementar

- Nunca commitar a API key.
- Sempre aplicar RN08 (limite de flashcards) no service, não confiar apenas no prompt.
- Sempre tratar o caso de JSON malformado com retry, não deixar a exceção estourar sem tratamento amigável.
- Seguir exatamente os nomes de campos do contrato de API (`sugestoes`, `pergunta`, `resposta`) para não quebrar o contrato com o frontend.
