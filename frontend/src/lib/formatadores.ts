import {
  FUSO_CLINICA,
  relogioNoFuso,
  type AcaoHistorico,
  type Papel,
  type SituacaoAtendimento,
  type Taxa,
} from "@sgc/backend/domain"

export function formatarDataHoraClinica(instante: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_CLINICA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(instante)
}

export function formatarDataCurtaClinica(instante: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_CLINICA,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(instante)
}

export function formatarHorarioClinica(instante: Date): string {
  const rel = relogioNoFuso(instante, FUSO_CLINICA)
  const h = String(rel.hora).padStart(2, "0")
  const m = String(rel.minuto).padStart(2, "0")
  return `${h}:${m}`
}

export function formatarIntervaloHorarioClinica(inicio: Date, fim: Date): string {
  return `${formatarHorarioClinica(inicio)} às ${formatarHorarioClinica(fim)}`
}

export type MetadadosSituacao = {
  rotulo: string
  descricao: string
  classeBadge: string
  simbolo: string
}

export const METADADOS_SITUACAO: Record<SituacaoAtendimento, MetadadosSituacao> = {
  agendado: {
    rotulo: "Agendado",
    descricao: "Horário reservado na agenda do profissional.",
    classeBadge: "bg-soft text-ink border-input",
    simbolo: "●",
  },
  chegou: {
    rotulo: "Na recepção",
    descricao: "Paciente presente na clínica aguardando chamada do dentista.",
    classeBadge: "bg-[#FFF3E5] text-[#7A3900] border-[#F5C896]",
    simbolo: "◆",
  },
  em_atendimento: {
    rotulo: "Em atendimento",
    descricao: "Atendimento em andamento no consultório.",
    classeBadge: "bg-soft text-ink border-[#9AD2D6]",
    simbolo: "▶",
  },
  concluido: {
    rotulo: "Concluído",
    descricao: "Atendimento finalizado pelo cirurgião-dentista.",
    classeBadge: "bg-[#E5F5EC] text-[#00522B] border-[#9ED9B8]",
    simbolo: "✓",
  },
  cancelado: {
    rotulo: "Cancelado",
    descricao: "Consulta cancelada com horário liberado na agenda.",
    classeBadge: "bg-canvas text-muted border-input",
    simbolo: "✕",
  },
  falta: {
    rotulo: "Falta",
    descricao: "Ausência registrada pela recepção.",
    classeBadge: "bg-[#FBE9ED] text-[#8A0D29] border-[#F1B2C0]",
    simbolo: "!",
  },
}

export const ROTULO_PAPEL: Record<Papel, string> = {
  paciente: "Paciente",
  recepcao: "Recepção",
  dentista: "Dentista",
  gestor: "Gestor",
}

export const ROTULO_ACAO_HISTORICO: Record<AcaoHistorico, string> = {
  agendar: "Reserva criada",
  remarcar: "Horário remarcado",
  alterar_situacao: "Situação alterada",
  confirmar_presenca: "Presença confirmada",
}

export function formatarTaxaIndicador(taxa: Taxa): {
  principal: string
  detalhe: string
  percentualNumero: number
} {
  if (taxa.tipo === "sem_dados") {
    return {
      principal: "—",
      detalhe: "Sem registros concluídos no período",
      percentualNumero: 0,
    }
  }
  const num = Math.min(100, Math.max(0, taxa.valor * 100))
  const percentual = num.toFixed(1).replace(".", ",")
  return {
    principal: `${percentual}%`,
    detalhe: `${taxa.numerador} de ${taxa.denominador}`,
    percentualNumero: num,
  }
}
