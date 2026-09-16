import { useEffect } from 'react'

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => unknown }
  }
}

const VLIBRAS_SCRIPT_SRC = 'https://vlibras.gov.br/app/vlibras-plugin.js'
const VLIBRAS_MARKUP =
  '<div vw class="enabled"><div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div></div>'

// Widget de acessibilidade em Libras (VLibras, suite oficial do governo
// federal) - traduz o texto visivel da pagina para Lingua Brasileira de
// Sinais via avatar animado. Montado uma unica vez em App.tsx, fora das
// rotas, para funcionar tanto nas paginas publicas quanto nas autenticadas.
export function VLibrasWidget() {
  useEffect(() => {
    function iniciarWidget() {
      if (window.VLibras) {
        new window.VLibras.Widget('https://vlibras.gov.br/app')
      }
    }

    if (window.VLibras) {
      iniciarWidget()
      return
    }

    const script = document.createElement('script')
    script.src = VLIBRAS_SCRIPT_SRC
    script.async = true
    script.onload = iniciarWidget
    document.body.appendChild(script)

    return () => {
      script.onload = null
      document.body.removeChild(script)
    }
  }, [])

  return <div dangerouslySetInnerHTML={{ __html: VLIBRAS_MARKUP }} />
}
