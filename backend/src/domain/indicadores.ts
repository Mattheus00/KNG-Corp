import { intersecao, minutosDoIntervalo, subtrairIntervalos, type Intervalo } from "./intervalo"
import { SITUACOES_ATENDIMENTO, type SituacaoAtendimento } from "./situacao"

export type ConsultaParaIndicador = {
  servicoId: string
  profissionalId: string
  inicio: Date
  fim: Date
  situacao: SituacaoAtendimento
  motivoCancelamento: string | null
}

export type ExpedienteProfissional = {
  profissionalId: string
  expediente: readonly Intervalo[]
  bloqueios: readonly Intervalo[]
}

export type Taxa =
  | { tipo: "valor"; numerador: number; denominador: number; valor: number }
  | { tipo: "sem_dados"; numerador: number; denominador: number }

export type Indicadores = {
  criterioData: "data_prevista_da_consulta"
  consultasPrevistas: Record<SituacaoAtendimento, number>
  atendimentosConcluidos: number
  taxaFaltas: Taxa
  ocupacaoPlanejada: Taxa
  cancelamentos: {
    total: number
    porMotivo: Array<{ motivo: string; quantidade: number }>
  }
  distribuicaoPorServico: Array<{
    servicoId: string
    situacao: SituacaoAtendimento
    quantidade: number
  }>
}

export function calcularIndicadores(entrada: {
  consultas: readonly ConsultaParaIndicador[]
  expedientes: readonly ExpedienteProfissional[]
  periodo: Intervalo
  agora: Date
}): Indicadores {
  const noPeriodo = entrada.consultas.filter((consulta) =>
    instanteNoPeriodo(consulta.inicio, entrada.periodo),
  )
  const consultasPrevistas = contarPorSituacao(noPeriodo)

  return {
    criterioData: "data_prevista_da_consulta",
    consultasPrevistas,
    atendimentosConcluidos: consultasPrevistas.concluido,
    taxaFaltas: calcularTaxaFaltas(noPeriodo, entrada.agora),
    ocupacaoPlanejada: calcularOcupacao(noPeriodo, entrada.expedientes, entrada.periodo),
    cancelamentos: contarCancelamentos(noPeriodo),
    distribuicaoPorServico: distribuirPorServico(noPeriodo),
  }
}

function calcularTaxaFaltas(consultas: readonly ConsultaParaIndicador[], agora: Date): Taxa {
  const consideradas = consultas.filter(
    (consulta) =>
      consulta.inicio < agora &&
      (consulta.situacao === "falta" || consulta.situacao === "concluido"),
  )
  const faltas = consideradas.filter((consulta) => consulta.situacao === "falta").length
  const denominador = consideradas.length
  if (denominador === 0) {
    return { tipo: "sem_dados", numerador: faltas, denominador }
  }
  return { tipo: "valor", numerador: faltas, denominador, valor: faltas / denominador }
}

function calcularOcupacao(
  consultas: readonly ConsultaParaIndicador[],
  expedientes: readonly ExpedienteProfissional[],
  periodo: Intervalo,
): Taxa {
  let disponiveis = 0
  for (const expediente of expedientes) {
    const livres = subtrairIntervalos(expediente.expediente, expediente.bloqueios)
    for (const livre of livres) {
      const dentro = intersecao(livre, periodo)
      if (dentro) disponiveis += minutosDoIntervalo(dentro)
    }
  }

  const profissionais = new Set(expedientes.map((expediente) => expediente.profissionalId))
  let reservados = 0
  for (const consulta of consultas) {
    if (consulta.situacao === "cancelado" || !profissionais.has(consulta.profissionalId)) continue
    const dentro = intersecao(consulta, periodo)
    if (dentro) reservados += minutosDoIntervalo(dentro)
  }

  if (disponiveis === 0) {
    return { tipo: "sem_dados", numerador: reservados, denominador: disponiveis }
  }
  return {
    tipo: "valor",
    numerador: reservados,
    denominador: disponiveis,
    valor: reservados / disponiveis,
  }
}

function contarCancelamentos(consultas: readonly ConsultaParaIndicador[]): Indicadores["cancelamentos"] {
  const porMotivo = new Map<string, number>()
  for (const consulta of consultas) {
    if (consulta.situacao !== "cancelado") continue
    const motivo = consulta.motivoCancelamento?.trim() || "não informado"
    porMotivo.set(motivo, (porMotivo.get(motivo) ?? 0) + 1)
  }

  const motivos = [...porMotivo.entries()]
    .map(([motivo, quantidade]) => ({ motivo, quantidade }))
    .sort(
      (esquerda, direita) =>
        direita.quantidade - esquerda.quantidade ||
        esquerda.motivo.localeCompare(direita.motivo, "pt-BR"),
    )

  return {
    total: motivos.reduce((soma, item) => soma + item.quantidade, 0),
    porMotivo: motivos,
  }
}

function distribuirPorServico(
  consultas: readonly ConsultaParaIndicador[],
): Indicadores["distribuicaoPorServico"] {
  const grupos = new Map<string, Map<SituacaoAtendimento, number>>()
  for (const consulta of consultas) {
    const porSituacao = grupos.get(consulta.servicoId) ?? new Map<SituacaoAtendimento, number>()
    porSituacao.set(consulta.situacao, (porSituacao.get(consulta.situacao) ?? 0) + 1)
    grupos.set(consulta.servicoId, porSituacao)
  }

  const itens: Indicadores["distribuicaoPorServico"] = []
  for (const [servicoId, porSituacao] of grupos) {
    for (const [situacao, quantidade] of porSituacao) {
      itens.push({ servicoId, situacao, quantidade })
    }
  }

  return itens.sort(
    (esquerda, direita) =>
      esquerda.servicoId.localeCompare(direita.servicoId, "pt-BR") ||
      esquerda.situacao.localeCompare(direita.situacao, "pt-BR"),
  )
}

function contarPorSituacao(
  consultas: readonly ConsultaParaIndicador[],
): Record<SituacaoAtendimento, number> {
  const totais = Object.fromEntries(SITUACOES_ATENDIMENTO.map((situacao) => [situacao, 0])) as Record<
    SituacaoAtendimento,
    number
  >
  for (const consulta of consultas) {
    totais[consulta.situacao] += 1
  }
  return totais
}

function instanteNoPeriodo(instante: Date, periodo: Intervalo): boolean {
  return instante >= periodo.inicio && instante < periodo.fim
}
