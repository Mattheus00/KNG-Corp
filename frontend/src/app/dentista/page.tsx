import { listarAgendamentosVisiveis, obterCenarioSessao } from "@sgc/backend/data"
import type { Metadata } from "next"
import { AvisoPermissao } from "@/components/aviso-permissao"
import { PainelDentista } from "@/components/painel-dentista"
import { lerSessaoId } from "@/lib/sessao"

export const metadata: Metadata = {
  title: "Consultório do Dentista — Fila Clínica e Agenda",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PaginaDentista() {
  const sessaoId = await lerSessaoId()
  const cenario = obterCenarioSessao(sessaoId)

  if (!cenario.atorAtual.papeis.includes("dentista") || !cenario.atorAtual.profissionalId) {
    return (
      <AvisoPermissao
        papelNecessario="dentista"
        nomeAtorAtual={cenario.nomeAtorAtual}
        papeisAtuais={cenario.atorAtual.papeis}
        contaSugeridaId="22222222-2222-4222-8222-222222222202"
        contaSugeridaNome="Dra. Helena Martins"
      />
    )
  }

  const profissional = cenario.profissionais.find(
    (p) => p.id === cenario.atorAtual.profissionalId,
  )

  const consultasDoDentista = listarAgendamentosVisiveis(sessaoId)
    .filter((c) => c.profissionalId === cenario.atorAtual.profissionalId)
    .map((c) => ({
      id: c.id,
      pacienteId: c.pacienteId,
      pacienteNome: c.pacienteNome,
      pacienteTelefone: c.pacienteTelefone,
      servicoNome: c.servicoNome,
      duracaoMinutos: c.duracaoMinutos,
      inicioISO: c.inicio.toISOString(),
      fimISO: c.fim.toISOString(),
      situacao: c.situacao,
      presencaConfirmada: c.presencaConfirmada,
    }))

  const expedienteTexto = profissional
    ? `${String(profissional.aberturaHora).padStart(2, "0")}:00 às ${String(
        profissional.fechamentoHora,
      ).padStart(2, "0")}:00`
    : "08:00 às 18:00"

  return (
    <PainelDentista
      nomeDentista={profissional?.nome ?? cenario.nomeAtorAtual}
      especialidadeDentista={profissional?.especialidade ?? "Odontologia"}
      expedienteTexto={expedienteTexto}
      consultas={consultasDoDentista}
    />
  )
}
