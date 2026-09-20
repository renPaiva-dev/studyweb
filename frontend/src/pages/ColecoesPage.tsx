import { Library, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { extrairMensagemErro } from '@/api/apiError'
import { listarColecoes, type Colecao } from '@/api/colecaoApi'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ColecaoCard } from '@/components/ColecaoCard'
import { ColecaoFormDialog } from '@/components/ColecaoFormDialog'
import { ExcluirColecaoDialog } from '@/components/ExcluirColecaoDialog'

// UC33 - Coleções de decks. GET /api/colecoes (docs/contrato-api.md).
export function ColecoesPage() {
  const navigate = useNavigate()

  const [colecoes, setColecoes] = useState<Colecao[] | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const [dialogAberto, setDialogAberto] = useState(false)
  const [colecaoEditando, setColecaoEditando] = useState<Colecao | null>(null)
  const [colecaoExcluindo, setColecaoExcluindo] = useState<Colecao | null>(null)

  const carregarColecoes = useCallback(async () => {
    setErroCarregamento(null)

    try {
      setColecoes(await listarColecoes())
    } catch (erro) {
      setErroCarregamento(extrairMensagemErro(erro, 'Não foi possível carregar suas coleções.'))
    }
  }, [])

  useEffect(() => {
    void carregarColecoes()
  }, [carregarColecoes])

  function abrirNovaColecao() {
    setColecaoEditando(null)
    setDialogAberto(true)
  }

  function abrirEdicaoColecao(colecao: Colecao) {
    setColecaoEditando(colecao)
    setDialogAberto(true)
  }

  async function aoSalvarColecao() {
    await carregarColecoes()
  }

  async function aoExcluirColecao() {
    await carregarColecoes()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Coleções</h1>
          <p className="text-muted-foreground">Agrupe decks relacionados sob um mesmo rótulo</p>
        </div>
        <Button onClick={abrirNovaColecao}>
          <Plus className="mr-2 h-4 w-4" />
          Nova coleção
        </Button>
      </div>

      {colecoes === null && erroCarregamento === null && <ListaColecoesSkeleton />}

      {erroCarregamento !== null && (
        <div className="flex flex-col items-center gap-4 rounded-none border py-16 text-center">
          <p className="text-muted-foreground">{erroCarregamento}</p>
          <Button variant="outline" onClick={() => void carregarColecoes()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {colecoes !== null && colecoes.length === 0 && <EstadoVazio onCriarColecao={abrirNovaColecao} />}

      {colecoes !== null && colecoes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colecoes.map((colecao) => (
            <ColecaoCard
              key={colecao.id}
              colecao={colecao}
              onAbrir={() => navigate(`/colecoes/${colecao.id}`)}
              onEditar={() => abrirEdicaoColecao(colecao)}
              onExcluir={() => setColecaoExcluindo(colecao)}
            />
          ))}
        </div>
      )}

      <ColecaoFormDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        colecaoParaEditar={colecaoEditando}
        onSalvo={() => void aoSalvarColecao()}
      />

      <ExcluirColecaoDialog
        colecao={colecaoExcluindo}
        onOpenChange={(open) => {
          if (!open) setColecaoExcluindo(null)
        }}
        onExcluida={() => void aoExcluirColecao()}
      />
    </div>
  )
}

function ListaColecoesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, indice) => (
        <div key={indice} className="space-y-3 rounded-none border p-6">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  )
}

function EstadoVazio({ onCriarColecao }: { onCriarColecao: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-none border border-dashed py-20 text-center">
      <div className="rounded-full bg-primary/10 p-4">
        <Library className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">Você ainda não tem nenhuma coleção</p>
        <p className="text-sm text-muted-foreground">
          Crie uma coleção para agrupar decks relacionados (ex.: "Medicina")
        </p>
      </div>
      <Button onClick={onCriarColecao}>
        <Plus className="mr-2 h-4 w-4" />
        Criar sua primeira coleção
      </Button>
    </div>
  )
}
