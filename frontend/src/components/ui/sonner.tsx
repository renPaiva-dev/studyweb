import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Toasts para confirmacoes de acoes que nao tem um formulario onde mostrar o
// resultado (ex.: "Deck excluido"). Erros de formulario NUNCA vao so para
// toast - aparecem inline, junto do campo/botao (ver Alerta e Campo).
// Cada tipo tem cor semantica + icone, sempre com botao de fechar e 6s na
// tela (erros ficam visiveis tempo suficiente para serem lidos).
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      closeButton
      duration={6000}
      gap={10}
      offset={16}
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-success-600" />,
        error: <AlertCircle className="h-5 w-5 text-danger-600" />,
        warning: <AlertTriangle className="h-5 w-5 text-warning-600" />,
        info: <Info className="h-5 w-5 text-info-600" />,
        loading: <Loader2 className="h-5 w-5 animate-spin text-ink-500" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast !items-start !gap-3 !rounded-xl !border !px-4 !py-3.5 !shadow-lg !font-sans group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-ink-200",
          title: "!text-sm !font-semibold !leading-5",
          description: "!text-sm !leading-5 group-[.toast]:!text-current group-[.toast]:opacity-85",
          icon: "!mt-0 !h-5 !w-5",
          success: "group-[.toaster]:!bg-success-50 group-[.toaster]:!border-success-200 group-[.toaster]:!text-success-800",
          error: "group-[.toaster]:!bg-danger-50 group-[.toaster]:!border-danger-200 group-[.toaster]:!text-danger-800",
          warning: "group-[.toaster]:!bg-warning-50 group-[.toaster]:!border-warning-200 group-[.toaster]:!text-warning-800",
          info: "group-[.toaster]:!bg-info-50 group-[.toaster]:!border-info-200 group-[.toaster]:!text-info-800",
          closeButton:
            "!left-auto !right-1 !top-1 !h-7 !w-7 !translate-x-0 !translate-y-0 !border-0 !bg-transparent !text-current opacity-70 hover:opacity-100 hover:!bg-black/5",
          actionButton:
            "group-[.toast]:!bg-ink-900 group-[.toast]:!text-white group-[.toast]:!font-semibold",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
