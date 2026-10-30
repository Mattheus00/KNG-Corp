import { useId, type SVGProps } from "react"

const caminhos = {
  inicio: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  agenda: "M8 3v4m8-4v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm3 9h2m4 0h2m-8 4h2",
  pessoas: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.87M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 .13a4 4 0 0 1 0 7.75",
  cuidado: "M6 3v5a4 4 0 0 0 8 0V3M4 3h4m4 0h4m-6 9v3a5 5 0 0 0 10 0v-3m0-4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  grafico: "M4 3v18h17M8 16v-5m5 5V7m5 9v-8",
  conta: "M20 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  seta: "M5 12h14m-6-6 6 6-6 6",
  voltar: "M19 12H5m6-6-6 6 6 6",
  relogio: "M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  local: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  telefone: "m5 3 4 5-3 3a16 16 0 0 0 7 7l3-3 5 4c-1 5-5 4-9 2A23 23 0 0 1 3 12C1 8 0 4 5 3Z",
  email: "M3 7l9 6 9-6M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  check: "m5 12 4 4L19 6",
  restaurar: "M3 10a9 9 0 1 1 1 7M3 4v6h6",
  menu: "M4 6h16M4 12h16M4 18h16",
  fechar: "m6 6 12 12M6 18 18 6",
  escudo: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Zm-4 9 3 3 5-6",
  brilho: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z",
} as const

export type NomeIcone = keyof typeof caminhos

export function Icone({ nome, ...props }: SVGProps<SVGSVGElement> & { nome: NomeIcone }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d={caminhos[nome]} />
    </svg>
  )
}

export function Marca() {
  const sufixo = useId().replaceAll(":", "")
  const profundo = `sgc-profundo-${sufixo}`
  const menta = `sgc-menta-${sufixo}`

  return (
    <span className="marca">
      <svg className="marca-logo" viewBox="52 30 236 80" role="img" aria-label="SGC">
        <defs>
          <linearGradient id={profundo} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0b2a21" />
            <stop offset="1" stopColor="#1f5a45" />
          </linearGradient>
          <linearGradient id={menta} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2fbf84" />
            <stop offset="1" stopColor="#8fe3b8" />
          </linearGradient>
        </defs>
        <g transform="translate(60 37)">
          <rect width="30" height="30" rx="9" fill={`url(#${profundo})`} />
          <circle cx="51" cy="15" r="15" fill="#a9c1b2" />
          <path d="M0,51 A15,15 0 0 1 15,36 H26 A4,4 0 0 1 30,40 V51 A15,15 0 0 1 15,66 H4 A4,4 0 0 1 0,62 Z" fill="#6f8c7c" />
          <rect x="36" y="36" width="30" height="30" rx="9" fill={`url(#${menta})`} />
        </g>
        <text x="150" y="93" fill="#0b2a21" fontFamily="var(--font-interface), Arial, sans-serif" fontSize="60" fontWeight="600" letterSpacing="-2.5">
          sgc<tspan fill="#2fbf84">.</tspan>
        </text>
      </svg>
    </span>
  )
}
