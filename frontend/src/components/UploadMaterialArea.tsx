import { FileUp, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface UploadMaterialAreaProps {
  enviando: boolean
  onArquivoSelecionado: (arquivo: File) => void
  /** Erro de validacao do ultimo arquivo (tipo/tamanho) - deixa a borda vermelha. */
  invalido?: boolean
}

// UC03 - area de upload de PDF (RN06: apenas .pdf, max. 15MB). Aceita
// clique (input file) ou arrastar-e-soltar o arquivo.
export function UploadMaterialArea({ enviando, onArquivoSelecionado, invalido }: UploadMaterialAreaProps) {
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
      aria-invalid={invalido || undefined}
      aria-describedby={invalido ? 'erro-upload' : undefined}
      aria-label="Enviar PDF: arraste um arquivo aqui ou pressione Enter para selecionar"
      onClick={() => !enviando && inputRef.current?.click()}
      onKeyDown={(evento) => {
        if (!enviando && (evento.key === 'Enter' || evento.key === ' ')) {
          evento.preventDefault()
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
        'group flex flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-card px-6 py-9 text-center transition-[border-color,background-color,box-shadow] duration-base ease-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        enviando
          ? 'cursor-progress border-brand-300 bg-brand-50/60'
          : invalido
            ? 'cursor-pointer border-danger-300 bg-danger-50/40 hover:border-danger-500'
            : 'cursor-pointer border-ink-300 hover:border-brand-500 hover:bg-brand-50/50',
        arrastando && 'border-brand-600 bg-brand-50 shadow-[0_0_0_4px_rgb(247_178_58/0.2)]',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        tabIndex={-1}
        disabled={enviando}
        onChange={(evento) => {
          selecionarArquivo(evento.target.files?.[0])
          evento.target.value = ''
        }}
      />

      {enviando ? (
        <>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <Loader2 className="h-6 w-6 animate-spin text-brand-700" />
          </span>
          <div role="status">
            <p className="font-semibold text-foreground">Enviando e extraindo o texto do PDF...</p>
            <p className="mt-1 text-sm text-muted-foreground">Isso pode levar alguns segundos. Não feche a página.</p>
          </div>
        </>
      ) : (
        <>
          <span
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full bg-ink-900 text-white shadow-md transition-transform duration-base group-hover:-translate-y-0.5',
              arrastando && '-translate-y-1 bg-brand-500 text-ink-950',
            )}
          >
            <FileUp className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">
              {arrastando ? 'Solte o PDF para enviar' : (
                <>
                  Arraste um PDF aqui ou <span className="text-brand-800 underline decoration-brand-300 underline-offset-2">clique para selecionar</span>
                </>
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Apenas arquivos .pdf, de até 15 MB</p>
          </div>
        </>
      )}
    </div>
  )
}
