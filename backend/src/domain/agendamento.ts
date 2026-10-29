import type { SituacaoAtendimento } from "./situacao"

export type Agendamento = {
  id: string
  pacienteId: string
  profissionalId: string
  servicoId: string
  inicio: Date
  fim: Date
  situacao: SituacaoAtendimento
  presencaConfirmada: boolean
  motivoCancelamento: string | null
}

export type AcaoHistorico = "agendar" | "remarcar" | "alterar_situacao" | "confirmar_presenca"

export type AlteracaoHorario = {
  inicioAnterior: Date
  fimAnterior: Date
  inicioNovo: Date
  fimNovo: Date
}

export type RegistroHistorico = {
  agendamentoId: string
  autorId: string
  momento: Date
  acao: AcaoHistorico
  situacaoAnterior: SituacaoAtendimento | null
  situacaoNova: SituacaoAtendimento
  motivo: string | null
  horario: AlteracaoHorario | null
}
