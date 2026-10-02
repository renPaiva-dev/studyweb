import { Check, Circle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { requisitosSenha } from '@/utils/senhaForte'

interface RequisitosSenhaProps {
  id?: string
  senha: string
  /** Depois de uma tentativa de envio, itens pendentes ficam vermelhos. */
  destacarPendentes?: boolean
}

// RN27 - checklist ao vivo dos requisitos de senha forte.
export function RequisitosSenha({ id, senha, destacarPendentes }: RequisitosSenhaProps) {
  const itens = requisitosSenha(senha)
  const atendidos = itens.filter((item) => item.atendido).length

  return (
    <div id={id} className="space-y-2.5 rounded-lg border border-ink-200 bg-ink-50 p-3">
      <div className="flex items-center gap-1" aria-hidden="true">
        {itens.map((item, indice) => (
          <span
            key={item.rotulo}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-base',
              indice < atendidos ? (atendidos === itens.length ? 'bg-success-600' : 'bg-brand-500') : 'bg-ink-200',
            )}
          />
        ))}
      </div>
      <ul className="grid gap-x-3 gap-y-1.5 sm:grid-cols-2" aria-label="Requisitos da senha">
        {itens.map((item) => (
          <li
            key={item.rotulo}
            className={cn(
              'flex items-center gap-1.5 text-sm transition-colors duration-fast',
              item.atendido ? 'text-success-700' : destacarPendentes ? 'text-danger-700' : 'text-ink-600',
            )}
          >
            {item.atendido ? (
              <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>
              <span className="sr-only">{item.atendido ? 'Atendido: ' : 'Pendente: '}</span>
              {item.rotulo}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
