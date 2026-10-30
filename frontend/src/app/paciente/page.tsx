import {
  consultarHorariosDisponiveisNoDia,
  formatarDataISOClinica,
  listarAgendamentosVisiveis,
  obterCenarioSessao,
} from "@sgc/backend/data"
import type { Metadata } from "next"
import { AvisoPermissao } from "@/components/aviso-permissao"
import { PainelPaciente } from "@/components/painel-paciente"
import { lerSessaoId } from "@/lib/sessao"

export const metadata: Metadata = {
  title: "Paciente — Agendamento e Consultas",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PaginaPaciente() {
  const sessaoId = await lerSessaoId()
  const cenario = obterCenarioSessao(sessaoId)

  if (!cenario.atorAtual.papeis.includes("paciente")) {
    return (
      <AvisoPermissao
        papelNecessario="paciente"
        nomeAtorAtual={cenario.nomeAtorAtual}
        papeisAtuais={cenario.atorAtual.papeis}
        contaSugeridaId="11111111-1111-4111-8111-111111111101"
        contaSugeridaNome="Mariana Costa"
      />
    )
  }

  const cadastroPaciente = cenario.pacientes.find((p) => p.id === cenario.atorAtual.id) ?? {
    id: cenario.atorAtual.id,
    nome: cenario.nomeAtorAtual,
    email: cenario.emailAtorAtual,
    telefone: "(11) 90000-0101",
  }

  const servicosAuto = cenario.servicos
    .filter((s) => s.disponivelParaAutoagendamento)
    .map((s) => ({
      id: s.id,
      nome: s.nome,
      descricao: s.descricao,
      duracaoMinutos: s.duracaoMinutos,
      indicacaoPreco: s.indicacaoPreco,
      profissionaisHabilitados: [...s.profissionaisHabilitados],
    }))

  const profissionaisAtivos = cenario.profissionais
    .filter((p) => p.ativo)
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      especialidade: p.especialidade,
    }))

  const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000)
  if (amanha.getUTCDay() === 0) {
    amanha.setUTCDate(amanha.getUTCDate() + 1)
  }
  const dataPadraoISO = formatarDataISOClinica(amanha)

  const primeiroServico = servicosAuto[0]
  const primeiroProfissional = profissionaisAtivos.find((p) =>
    primeiroServico?.profissionaisHabilitados.includes(p.id),
  )

  let horariosIniciaisISO: string[] = []
  if (primeiroServico && primeiroProfissional) {
    const resHorarios = consultarHorariosDisponiveisNoDia(sessaoId, {
      servicoId: primeiroServico.id,
      profissionalId: primeiroProfissional.id,
      dataISO: dataPadraoISO,
    })
    if (resHorarios.ok) {
      horariosIniciaisISO = resHorarios.valor.map((d) => d.toISOString())
    }
  }

  const consultasDoPaciente = listarAgendamentosVisiveis(sessaoId).map((c) => ({
    id: c.id,
    servicoId: c.servicoId,
    servicoNome: c.servicoNome,
    duracaoMinutos: c.duracaoMinutos,
    profissionalId: c.profissionalId,
    profissionalNome: c.profissionalNome,
    profissionalEspecialidade: c.profissionalEspecialidade,
    inicioISO: c.inicio.toISOString(),
    fimISO: c.fim.toISOString(),
    situacao: c.situacao,
    presencaConfirmada: c.presencaConfirmada,
    motivoCancelamento: c.motivoCancelamento,
  }))

  return (
    <PainelPaciente
      paciente={{
        id: cadastroPaciente.id,
        nome: cadastroPaciente.nome,
        email: cadastroPaciente.email ?? "",
        telefone: cadastroPaciente.telefone,
      }}
      servicos={servicosAuto}
      profissionais={profissionaisAtivos}
      consultas={consultasDoPaciente}
      dataPadraoISO={dataPadraoISO}
      horariosIniciaisISO={horariosIniciaisISO}
    />
  )
}
