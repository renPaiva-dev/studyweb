interface LogoProps {
  className?: string
  /** 'light' para uso sobre fundo escuro (ex.: foto na AuthSplitLayout). */
  tone?: 'ink' | 'light'
}

// Simbolo Sinapse: dois discos solidos que se sobrepoem - o ambar (a ideia
// que se fixa) rompendo a borda do disco maior (o material ainda bruto).
// Silhueta solida de proposito, sem traco fino: le bem em qualquer tamanho,
// de favicon a selo grande, sem sumir contra um fundo com textura (ex.: a
// foto na AuthSplitLayout). Ver o artifact de identidade de marca.
export function Logo({ className, tone = 'ink' }: LogoProps) {
  const corBase = tone === 'light' ? '#F4F5FA' : '#15172B'

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="20" cy="27" r="18" fill={corBase} />
      <circle cx="35" cy="14" r="11" fill="#F2A63B" />
    </svg>
  )
}
