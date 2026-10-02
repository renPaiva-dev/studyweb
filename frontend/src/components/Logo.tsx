interface LogoProps {
  className?: string
  /** 'light' para uso sobre fundo escuro (ex.: foto na AuthSplitLayout). */
  tone?: 'ink' | 'light'
}

// Simbolo Sinapse: dois discos solidos que se sobrepoem - o ambar (a ideia
// que se fixa) rompendo a borda do disco maior (o material ainda bruto).
// Cores = ink-900 / brand-400 do sistema de design (tailwind.config.js).
export function Logo({ className, tone = 'ink' }: LogoProps) {
  const corBase = tone === 'light' ? '#F6F7FB' : '#1A1C30'

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="20" cy="27" r="18" fill={corBase} />
      <circle cx="35" cy="14" r="11" fill="#F7B23A" />
    </svg>
  )
}
