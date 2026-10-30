import { CONTAS_DEMONSTRATIVAS, DADOS_CLINICA_FICTICIA, obterCenarioSessao } from "@sgc/backend/data"
import type { Metadata } from "next"
import { PainelAcesso } from "@/components/painel-acesso"
import { lerSessaoId } from "@/lib/sessao"

export const metadata: Metadata = {
  title: "Contas e Acesso — Alternância de Perfil e Cadastro",
  description:
    "Entre com uma conta demonstrativa por perfil (Paciente, Recepção, Dentista ou Gestor) ou cadastre um paciente de teste no ambiente isolado.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PaginaAcesso() {
  const sessaoId = await lerSessaoId()
  const cenario = obterCenarioSessao(sessaoId)

  return (
    <PainelAcesso
      contasDemo={CONTAS_DEMONSTRATIVAS}
      atorAtualId={cenario.atorAtual.id}
      versaoTermos={DADOS_CLINICA_FICTICIA.versaoTermos}
    />
  )
}
