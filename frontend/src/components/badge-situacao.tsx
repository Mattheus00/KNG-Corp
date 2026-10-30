import type { SituacaoAtendimento } from "@sgc/backend/domain"
import { METADADOS_SITUACAO } from "@/lib/formatadores"

export function BadgeSituacao({ situacao }: { situacao: SituacaoAtendimento }) {
  const meta = METADADOS_SITUACAO[situacao]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.classeBadge}`}
      title={meta.descricao}
    >
      <span aria-hidden="true" className="text-[10px] leading-none">
        {meta.simbolo}
      </span>
      <span>{meta.rotulo}</span>
    </span>
  )
}

export function BadgePresenca({ confirmada }: { confirmada: boolean }) {
  if (confirmada) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#9ED9B8] bg-[#E5F5EC] px-2.5 py-0.5 text-xs font-semibold text-[#00522B]">
        <span aria-hidden="true">✓</span>
        <span>Confirmado</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-input bg-canvas px-2.5 py-0.5 text-xs font-medium text-muted">
      <span aria-hidden="true">○</span>
      <span>Não confirmado</span>
    </span>
  )
}
