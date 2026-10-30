import { CONTAS_DEMONSTRATIVAS, DADOS_CLINICA_FICTICIA, obterCenarioSessao } from "@sgc/backend/data"
import type { Metadata } from "next"
import "./globals.css"
import { BarraDemonstracao } from "@/components/barra-demonstracao"
import { Rodape } from "@/components/rodape"
import { lerSessaoId } from "@/lib/sessao"

const URL_BASE_PUBLICA = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(URL_BASE_PUBLICA),
  title: {
    default: `${DADOS_CLINICA_FICTICIA.nome} — SGC WebApp`,
    template: `%s | ${DADOS_CLINICA_FICTICIA.nome}`,
  },
  description:
    "WebApp demonstrativo de gestão odontológica (SGC) com fluxos completos para paciente, recepção, cirurgião-dentista e gestor.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: `${DADOS_CLINICA_FICTICIA.nome} (Demonstração SGC)`,
    title: `${DADOS_CLINICA_FICTICIA.nome} — SGC WebApp`,
    description:
      "Agendamento odontológico, operação de recepção, atendimento clínico e indicadores gerenciais.",
  },
}

export const dynamic = "force-dynamic"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const sessaoId = await lerSessaoId()
  const cenario = obterCenarioSessao(sessaoId)

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col bg-[#F4F6F9] text-[#22272B] antialiased">
        <a
          href="#conteudo-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-[#002664] focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white"
        >
          Pular para o conteúdo principal
        </a>

        <BarraDemonstracao
          atorId={cenario.atorAtual.id}
          nomeAtor={cenario.nomeAtorAtual}
          papeisAtor={cenario.atorAtual.papeis}
          contasDemo={CONTAS_DEMONSTRATIVAS}
        />

        <main id="conteudo-principal" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>

        <Rodape />
      </body>
    </html>
  )
}
