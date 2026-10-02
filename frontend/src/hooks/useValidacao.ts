import { useCallback, useState } from 'react'

type Regras<C extends string> = Record<C, () => string | undefined>

// Validacao de formulario com feedback em tempo real (docs/boas-praticas-
// frontend.md, secao 7). As mensagens sao DERIVADAS das regras a cada render
// (as regras leem o estado atual do formulario), entao nao ha estado de erro
// para sincronizar: o erro aparece quando o campo perde o foco ou quando o
// usuario tenta enviar, e some sozinho assim que o valor fica valido.
//
// Convencao: a chave de cada regra e o `id` do controle no DOM - e assim que
// validarTudo() coloca o foco no primeiro campo invalido.
export function useValidacao<C extends string>(regras: Regras<C>) {
  const [tocados, setTocados] = useState<Partial<Record<C, boolean>>>({})
  const [errosServidor, setErrosServidor] = useState<Partial<Record<C, string>>>({})

  const campos = Object.keys(regras) as C[]

  function erro(campo: C): string | undefined {
    if (errosServidor[campo]) {
      return errosServidor[campo]
    }
    return tocados[campo] ? regras[campo]() : undefined
  }

  const marcarTocado = useCallback((campo: C) => {
    setTocados((atual) => (atual[campo] ? atual : { ...atual, [campo]: true }))
  }, [])

  // Chamar no onChange do campo: limpa um erro vindo do backend (ex.: 409
  // "nome de usuario em uso") assim que o usuario comeca a corrigir.
  const aoEditar = useCallback((campo: C) => {
    setErrosServidor((atual) => {
      if (!atual[campo]) return atual
      const proximo = { ...atual }
      delete proximo[campo]
      return proximo
    })
  }, [])

  function validarTudo(): boolean {
    setTocados(Object.fromEntries(campos.map((campo) => [campo, true])) as Record<C, boolean>)
    const primeiroInvalido = campos.find((campo) => regras[campo]() !== undefined)

    if (primeiroInvalido) {
      // Proximo frame: o campo pode estar sendo re-renderizado com aria-invalid.
      requestAnimationFrame(() => document.getElementById(primeiroInvalido)?.focus())
      return false
    }
    return true
  }

  function definirErroServidor(campo: C, mensagem: string) {
    setErrosServidor((atual) => ({ ...atual, [campo]: mensagem }))
    requestAnimationFrame(() => document.getElementById(campo)?.focus())
  }

  const resetar = useCallback(() => {
    setTocados({})
    setErrosServidor({})
  }, [])

  // Props prontas para espalhar no controle: onBlur marca o campo como
  // tocado - mas so se ele ja tiver conteudo. Campo vazio so e cobrado no
  // envio: senao, sair de um campo vazio clicando em "Enviar" faz a
  // mensagem aparecer, empurra o botao para baixo e o clique se perde.
  function propsCampo(campo: C) {
    return {
      onBlur: (evento: { target: { value?: string } }) => {
        if (evento.target.value) marcarTocado(campo)
      },
    }
  }

  return { erro, marcarTocado, aoEditar, validarTudo, definirErroServidor, resetar, propsCampo }
}
