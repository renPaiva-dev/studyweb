import { useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { definirElaboracaoVisivel, elaboracaoVisivel } from '@/utils/preferenciasEstudo'

// RN44 - reativar (ou ocultar) as opções de aprofundamento do UC34 na aba
// Estudar. Preferência local deste navegador (utils/preferenciasEstudo.ts).
export function PreferenciasEstudoCard() {
  const [visivel, setVisivel] = useState(elaboracaoVisivel)

  function alterar(valor: boolean) {
    setVisivel(valor)
    definirElaboracaoVisivel(valor)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Preferências de estudo</CardTitle>
        <CardDescription>Ajustes da aba Estudar, guardados neste navegador</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3">
          <Checkbox
            id="preferencia-elaboracao"
            className="mt-0.5"
            checked={visivel}
            onCheckedChange={(valor) => alterar(valor === true)}
          />
          <div className="space-y-1">
            <Label htmlFor="preferencia-elaboracao">Mostrar opções de aprofundamento durante o estudo</Label>
            <p className="text-sm text-muted-foreground">
              Explicar o card com suas palavras ou pedir uma analogia. Aparecem só depois de virar o card, e você
              pode ignorá-las sempre que quiser.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
