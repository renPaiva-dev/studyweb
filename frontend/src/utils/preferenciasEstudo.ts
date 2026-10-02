// RN44 - preferência "mostrar opções de aprofundamento (UC34) durante o
// estudo". É só uma conveniência de interface, guardada por navegador; o
// localStorage pode estar indisponível (aba anônima, bloqueio de site), por
// isso toda leitura/escrita é protegida e o padrão é visível.
const CHAVE_ELABORACAO_VISIVEL = 'sinapse.elaboracao.visivel'

export function elaboracaoVisivel(): boolean {
  try {
    return localStorage.getItem(CHAVE_ELABORACAO_VISIVEL) !== 'false'
  } catch {
    return true
  }
}

export function definirElaboracaoVisivel(visivel: boolean): void {
  try {
    localStorage.setItem(CHAVE_ELABORACAO_VISIVEL, String(visivel))
  } catch {
    // Sem armazenamento disponível: a preferência vale só até recarregar a página.
  }
}
