import {
  formatarDataISOClinica,
  listarAgendamentosVisiveis,
  obterCenarioSessao,
} from "@sgc/backend/data"
import type { Metadata } from "next"
import { AvisoPermissao } from "@/components/aviso-permissao"
import { PainelRecepcao } from "@/components/painel-recepcao"
import { lerSessaoId } from "@/lib/sessao"

export const metadata: Metadata = {
  title: "Recepção — Agenda e Pacientes",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PaginaRecepcao() {
  const sessaoId = await lerSessaoId()
  const cenario = obterCenarioSessao(sessaoId)

  if (!cenario.atorAtual.papeis.includes("recepcao")) {
    return (
      <AvisoPermissao
        papelNecessario="recepcao"
        nomeAtorAtual={cenario.nomeAtorAtual}
        papeisAtuais={cenario.atorAtual.papeis}
        contaSugeridaId="22222222-2222-4222-8222-222222222201"
        contaSugeridaNome="Lucas Ferreira"
      />
    )
  }

  const hojeISO = formatarDataISOClinica(new Date())
  const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000)
  if (amanha.getUTCDay() === 0) {
    amanha.setUTCDate(amanha.getUTCDate() + 1)
  }
  const dataPadraoReservaISO = formatarDataISOClinica(amanha)

  const agendamentos = listarAgendamentosVisiveis(sessaoId).map((a) => ({
    id: a.id,
    pacienteId: a.pacienteId,
    pacienteNome: a.pacienteNome,
    pacienteTelefone: a.pacienteTelefone,
    profissionalId: a.profissionalId,
    profissionalNome: a.profissionalNome,
    profissionalEspecialidade: a.profissionalEspecialidade,
    servicoId: a.servicoId,
    servicoNome: a.servicoNome,
    duracaoMinutos: a.duracaoMinutos,
    inicioISO: a.inicio.toISOString(),
    fimISO: a.fim.toISOString(),
    dataCivilISO: formatarDataISOClinica(a.inicio),
    situacao: a.situacao,
    presencaConfirmada: a.presencaConfirmada,
    motivoCancelamento: a.motivoCancelamento,
    historico: a.historico.map((h) => ({
      acao: h.acao,
      autorId: h.autorId,
      momentoISO: h.momento.toISOString(),
      situacaoAnterior: h.situacaoAnterior,
      situacaoNova: h.situacaoNova,
      motivo: h.motivo,
      horario: h.horario
        ? {
            inicioAnteriorISO: h.horario.inicioAnterior.toISOString(),
            fimAnteriorISO: h.horario.fimAnterior.toISOString(),
            inicioNovoISO: h.horario.inicioNovo.toISOString(),
            fimNovoISO: h.horario.fimNovo.toISOString(),
          }
        : null,
    })),
  }))

  const pacientes = cenario.pacientes.map((p) => ({
    id: p.id,
    nome: p.nome,
    email: p.email,
    telefone: p.telefone,
    possuiConta: p.possuiConta,
  }))

  const profissionais = cenario.profissionais.map((p) => ({
    id: p.id,
    nome: p.nome,
    especialidade: p.especialidade,
    ativo: p.ativo,
  }))

  const servicos = cenario.servicos.map((s) => ({
    id: s.id,
    nome: s.nome,
    duracaoMinutos: s.duracaoMinutos,
    disponivelParaAutoagendamento: s.disponivelParaAutoagendamento,
    profissionaisHabilitados: [...s.profissionaisHabilitados],
  }))

  return (
    <PainelRecepcao
      agendamentos={agendamentos}
      pacientes={pacientes}
      profissionais={profissionais}
      servicos={servicos}
      dataHojeISO={hojeISO}
      dataPadraoReservaISO={dataPadraoReservaISO}
    />
  )
}
