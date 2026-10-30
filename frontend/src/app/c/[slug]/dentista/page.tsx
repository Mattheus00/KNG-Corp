import { listarAgendamentosVisiveis, obterCenarioSessao } from "@sgc/backend/data"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
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

export default async function PaginaDentista({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ dias?: string; profissional?: string }> }) {
  const { slug } = await params
  const sessaoId = await lerSessaoId()
  const cenario = obterCenarioSessao({ sessaoId, clinicaSlug: slug })
  if (!cenario) notFound()

  if (!cenario.atorAtual.papeis.includes("dentista") || !cenario.atorAtual.profissionalId) {
    return (
      <AvisoPermissao
        papelNecessario="dentista"
        nomeAtorAtual={cenario.nomeAtorAtual}
        papeisAtuais={cenario.atorAtual.papeis}
        contaSugeridaId={slug === "aurora" ? "22222222-2222-4222-8222-222222222202" : ""}
        contaSugeridaNome={slug === "aurora" ? "Dra. Helena Martins" : ""}
      />
    )
  }

  const profissional = cenario.profissionais.find(
    (p) => p.id === cenario.atorAtual.profissionalId,
  )

  const consultasDoDentista = listarAgendamentosVisiveis({ sessaoId, clinicaSlug: slug })
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
      motivoCancelamento: c.motivoCancelamento,
    }))

  const expedienteTexto = profissional
    ? `${String(profissional.aberturaHora).padStart(2, "0")}:00 às ${String(
        profissional.fechamentoHora,
      ).padStart(2, "0")}:00`
    : "08:00 às 18:00"

  const idsNaAgenda = new Set(consultasDoDentista.map((consulta) => consulta.pacienteId))
  const pacientesDoDentista = cenario.pacientes
    .filter((paciente) => idsNaAgenda.has(paciente.id))
    .map((paciente) => ({
      id: paciente.id,
      nome: paciente.nome,
      telefone: paciente.telefone,
      email: paciente.email,
      anamnese: paciente.anamnese,
    }))

  return (
    <PainelDentista
      nomeDentista={profissional?.nome ?? cenario.nomeAtorAtual}
      especialidadeDentista={profissional?.especialidade ?? "Odontologia"}
      expedienteTexto={expedienteTexto}
      consultas={consultasDoDentista}
      pacientes={pacientesDoDentista}
      agoraISO={new Date().toISOString()}
    />
  )
}
