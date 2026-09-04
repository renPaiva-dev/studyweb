import { Loader2, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface UploadMaterialAreaProps {
  enviando: boolean
  onArquivoSelecionado: (arquivo: File) => void
}

// UC03 - area de upload de PDF (RN06: apenas .pdf, max. 15MB). Aceita
// clique (input file) ou arrastar-e-soltar o arquivo.
export function UploadMaterialArea({ enviando, onArquivoSelecionado }: UploadMaterialAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [arrastando, setArrastando] = useState(false)

  function selecionarArquivo(arquivo: File | undefined) {
    if (arquivo) {
      onArquivoSelecionado(arquivo)
    }
  }

  return (
    <div
      role="button"
      tabIndex={enviando ? -1 : 0}
      aria-disabled={enviando}
      onClick={() => !enviando && inputRef.current?.click()}
      onKeyDown={(evento) => {
        if (!enviando && (evento.key === 'Enter' || evento.key === ' ')) {
          inputRef.current?.click()
        }
      }}
      onDragOver={(evento) => {
        evento.preventDefault()
        if (!enviando) setArrastando(true)
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(evento) => {
        evento.preventDefault()
        setArrastando(false)
        if (!enviando) selecionarArquivo(evento.dataTransfer.files[0])
      }}
      className={cn(
        'flex flex-col items-center gap-2 rounded-none border-2 border-dashed p-8 text-center transition-colors',
        enviando ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5',
        arrastando && 'border-primary bg-primary/5',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        disabled={enviando}
        onChange={(evento) => {
          selecionarArquivo(evento.target.files?.[0])
          evento.target.value = ''
        }}
      />

      {enviando ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-medium">Enviando e extraindo o texto do PDF...</p>
          <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos.</p>
        </>
      ) : (
        <>
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Arraste um PDF aqui ou clique para selecionar</p>
          <p className="text-sm text-muted-foreground">Apenas arquivos .pdf, máximo de 15MB</p>
        </>
      )}
    </div>
  )
}
