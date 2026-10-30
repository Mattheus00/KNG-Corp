import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"

const fonteInterface = localFont({
  src: "./fonts/nunito-sans-latin.woff2",
  variable: "--font-interface",
  weight: "400 800",
  style: "normal",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
  adjustFontFallback: "Arial",
})

const URL_BASE_PUBLICA = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(URL_BASE_PUBLICA),
  title: {
    default: "SGC — Gestão para clínicas odontológicas",
    template: "%s | SGC",
  },
  description:
    "SGC é um sistema demonstrativo de gestão para clínicas odontológicas: agenda, recepção, dentistas e indicadores. Gratuito durante a fase de demonstração.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "SGC",
    title: "SGC — Gestão para clínicas odontológicas",
    description:
      "Agenda, recepção, atendimento e indicadores para uma clínica odontológica. Demonstração sem cobrança.",
  },
}

export const dynamic = "force-dynamic"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={fonteInterface.variable}>
      <body className="flex min-h-screen flex-col bg-canvas text-ink antialiased">
        <a
          href="#conteudo-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:bg-ink focus:px-4 focus:py-2.5 focus:text-sm font-semibold focus:text-white"
        >
          Pular para o conteúdo principal
        </a>
        {children}
      </body>
    </html>
  )
}
