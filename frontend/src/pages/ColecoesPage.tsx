import { Library, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { extrairMensagemErro } from '@/api/apiError'
import { listarColecoes, type Colecao } from '@/api/colecaoApi'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { ColecaoCard } from '@/components/ColecaoCard'
import { ColecaoFormDialog } from '@/components/ColecaoFormDialog'
import { ExcluirColecaoDialog } from '@/components/ExcluirColecaoDialog'
import { DeckCardSkeleton } from '@/components/SkeletonsLista'
import { Button } from '@/components/ui/button'
import { EstadoErro, EstadoVazio } from '@/components/ui/estados'
import { Carregando } from '@/components/ui/skeleton'

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
    <div className="space-y-8">
      <CabecalhoPagina
        titulo="Coleções"
        descricao="Agrupe decks relacionados sob um mesmo rótulo, como uma estante por matéria."
        acoes={
          <Button onClick={abrirNovaColecao}>
            <Plus />
            Nova coleção
          </Button>
        }
      />

      {colecoes === null && erroCarregamento === null && (
        <Carregando rotulo="Carregando suas coleções..." className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, indice) => (
            <DeckCardSkeleton key={indice} />
          ))}
        </Carregando>
      )}

      {erroCarregamento !== null && <EstadoErro mensagem={erroCarregamento} onTentarNovamente={() => void carregarColecoes()} />}

      {colecoes !== null && colecoes.length === 0 && (
        <EstadoVazio
          icone={Library}
          titulo="Nenhuma coleção ainda"
          descricao="Crie uma coleção para agrupar decks relacionados (ex.: “Medicina” reunindo Anatomia, Bioquímica e Fisiologia)."
          acao={
            <Button onClick={abrirNovaColecao}>
              <Plus />
              Criar minha primeira coleção
            </Button>
          }
        />
      )}

      {colecoes !== null && colecoes.length > 0 && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
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
