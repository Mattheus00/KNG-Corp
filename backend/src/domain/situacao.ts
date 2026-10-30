import type { Papel } from "./papeis"

export const SITUACOES_ATENDIMENTO = [
  "agendado",
  "chegou",
  "em_atendimento",
  "concluido",
  "cancelado",
  "falta",
] as const

export type SituacaoAtendimento = (typeof SITUACOES_ATENDIMENTO)[number]

// Cancelamento libera o horário. Falta e concluído continuam ocupando o intervalo:
// a regra só devolve a disponibilidade no cancelamento, e agendar no passado já é recusado.
export function ocupaAgenda(situacao: SituacaoAtendimento): boolean {
  return situacao !== "cancelado"
}

// Paciente cancela ou remarca só enquanto a consulta segue agendada.
// Depois da chegada, cancelamento e falta ficam com a recepção.
// Não há saída de em_atendimento além de concluído: cancelar no meio do atendimento não está definido.
const TRANSICOES: Record<
  SituacaoAtendimento,
  Partial<Record<SituacaoAtendimento, readonly Papel[]>>
> = {
  agendado: {
    chegou: ["recepcao"],
    cancelado: ["paciente", "recepcao"],
    falta: ["recepcao"],
  },
  chegou: {
    em_atendimento: ["dentista"],
    cancelado: ["recepcao"],
    falta: ["recepcao"],
  },
  em_atendimento: {
    concluido: ["dentista"],
  },
  concluido: {},
  cancelado: {},
  falta: {},
}

export function transicaoPermitida(
  atual: SituacaoAtendimento,
  nova: SituacaoAtendimento,
  papeis: readonly Papel[],
): boolean {
  if (!Object.hasOwn(TRANSICOES, atual)) return false
  const mapaAtual = TRANSICOES[atual]
  if (!Object.hasOwn(mapaAtual, nova)) return false
  const permitidos = mapaAtual[nova]
  if (!permitidos) return false
  return papeis.some((papel) => permitidos.includes(papel))
}

export function podeRemarcarSituacao(
  situacao: SituacaoAtendimento,
  papeis: readonly Papel[],
): boolean {
  return situacao === "agendado" && papeis.some((papel) => papel === "paciente" || papel === "recepcao")
}

export function motivoObrigatorio(situacao: SituacaoAtendimento): boolean {
  return situacao === "cancelado"
}

// Teto técnico do motivo operacional. Não é prazo, multa nem regra comercial.
export const LIMITE_MOTIVO_CANCELAMENTO = 200
