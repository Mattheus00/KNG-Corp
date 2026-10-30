"use client"

import { instanteNoFuso, relogioNoFuso, type SituacaoAtendimento } from "@sgc/backend/domain"
import { useEffect, useRef, useState } from "react"
import { METADADOS_SITUACAO } from "@/lib/formatadores"

const HORA_INICIO = 8
const HORA_FIM = 18
const SLOT_MINUTOS = 30
const PX_POR_SLOT = 48
const MINUTOS_GRADE = (HORA_FIM - HORA_INICIO) * 60
const ALTURA_GRADE = (MINUTOS_GRADE / SLOT_MINUTOS) * PX_POR_SLOT

const CORES_PROFISSIONAL = [
  { fundo: "#edf4ef", borda: "#216456", texto: "#183b36" },
  { fundo: "#E3F3F4", borda: "#004047", texto: "#004047" },
  { fundo: "#FFF3E5", borda: "#944600", texto: "#7A3900" },
  { fundo: "#E5F5EC", borda: "#006938", texto: "#00522B" },
] as const

export type EventoCalendario = {
  id: string
  titulo: string
  detalhe: string
  profissionalId: string
  inicioISO: string
  fimISO: string
  situacao: SituacaoAtendimento
  podeArrastar: boolean
}

type Preview = {
  id: string
  diaISO: string
  minutos: number
}

export function diasDaGrade(modo: "semanal" | "diaria", ancoraISO: string): string[] {
  if (modo === "diaria") return [ancoraISO]
  const segunda = inicioDaSemana(ancoraISO)
  return Array.from({ length: 7 }, (_, indice) => deslocarDias(segunda, indice))
}

export function CalendarioAgenda({
  modo,
  ancoraISO,
  dataHojeISO,
  eventos,
  movendo,
  onMudarAncora,
  onSelecionar,
  selecionadoId,
  onMover,
}: {
  modo: "semanal" | "diaria"
  ancoraISO: string
  dataHojeISO: string
  eventos: readonly EventoCalendario[]
  movendo: boolean
  selecionadoId: string | null
  onMudarAncora: (iso: string) => void
  onSelecionar: (id: string) => void
  onMover: (id: string, inicioISO: string) => Promise<{ ok: boolean }>
}) {
  const gradeRef = useRef<HTMLDivElement>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const dias = diasDaGrade(modo, ancoraISO)

  useEffect(() => {
    if (!preview) return
    const evento = eventos.find((item) => item.id === preview.id)
    if (!evento) {
      setPreview(null)
      return
    }
    const real = posicaoDoEvento(evento)
    if (real.diaISO === preview.diaISO && real.minutos === preview.minutos) setPreview(null)
  }, [eventos, preview])
  const corPorProfissional = new Map<string, (typeof CORES_PROFISSIONAL)[number]>()
  for (const evento of eventos) {
    if (!corPorProfissional.has(evento.profissionalId)) {
      corPorProfissional.set(
        evento.profissionalId,
        CORES_PROFISSIONAL[corPorProfissional.size % CORES_PROFISSIONAL.length]!,
      )
    }
  }

  const tituloPeriodo =
    modo === "diaria"
      ? rotuloDia(dias[0]!)
      : `${rotuloDia(dias[0]!)} – ${rotuloDia(dias[dias.length - 1]!)}`

  function avancar(direcao: -1 | 1) {
    const passo = modo === "diaria" ? 1 : 7
    onMudarAncora(deslocarDias(ancoraISO, direcao * passo))
  }

  async function soltar(evento: EventoCalendario, diaISO: string, minutos: number) {
    const original = posicaoDoEvento(evento)
    if (original.diaISO === diaISO && original.minutos === minutos) {
      setPreview(null)
      onSelecionar(evento.id)
      return
    }
    const hora = HORA_INICIO + Math.floor(minutos / 60)
    const minuto = minutos % 60
    const partes = lerISO(diaISO)
    if (!partes) {
      setPreview(null)
      return
    }
    const instante = instanteNoFuso({ ...partes, hora, minuto })
    if (!instante.ok) {
      setPreview(null)
      return
    }
    setPreview({ id: evento.id, diaISO, minutos })
    const resposta = await onMover(evento.id, instante.valor.toISOString())
    if (!resposta.ok) setPreview(null)
  }

  return (
    <section aria-label="Calendário da agenda" className="rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => avancar(-1)}
            className="inline-flex min-h-11 items-center rounded-xl border border-input px-3 text-sm font-semibold text-ink"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => onMudarAncora(dataHojeISO)}
            className="inline-flex min-h-11 items-center rounded-xl border border-input px-3 text-sm font-semibold text-ink"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => avancar(1)}
            className="inline-flex min-h-11 items-center rounded-xl border border-input px-3 text-sm font-semibold text-ink"
          >
            Próxima
          </button>
        </div>
        <p className="text-sm font-semibold text-ink">{tituloPeriodo}</p>
      </div>

      <p className="border-b border-line px-3 py-2 text-xs text-muted sm:px-4">
        Arraste uma consulta agendada para outro dia ou horário. O profissional permanece o mesmo. A
        remarcação pelo botão continua na lista.
      </p>

      <div className="calendar-scroll max-h-[70vh] overflow-auto" role="region" aria-label="Grade de horários com rolagem" tabIndex={0}>
        <div className={modo === "semanal" ? "min-w-[880px]" : "min-w-[260px]"}>
          <div
            className="sticky top-0 z-20 grid border-b border-line bg-white"
            style={{ gridTemplateColumns: `4.5rem repeat(${dias.length}, minmax(0, 1fr))` }}
          >
            <div />
            {dias.map((dia) => {
              const hoje = dia === dataHojeISO
              return (
                <div key={dia} className="px-2 py-2 text-center">
                  <span
                    className={`inline-flex min-h-11 flex-col items-center justify-center rounded-xl px-2 text-xs font-semibold ${
                      hoje ? "bg-brand text-white" : "text-muted"
                    }`}
                  >
                    {rotuloDia(dia)}
                  </span>
                </div>
              )
            })}
          </div>

          <div
            ref={gradeRef}
            className="relative grid"
            style={{
              gridTemplateColumns: `4.5rem repeat(${dias.length}, minmax(0, 1fr))`,
              height: ALTURA_GRADE,
            }}
          >
            <div className="relative border-r border-line">
              {Array.from({ length: HORA_FIM - HORA_INICIO }, (_, indice) => (
                <span
                  key={indice}
                  className="absolute right-2 -translate-y-1/2 text-[11px] font-semibold text-muted tabular-nums"
                  style={{ top: indice * 2 * PX_POR_SLOT }}
                >
                  {String(HORA_INICIO + indice).padStart(2, "0")}:00
                </span>
              ))}
            </div>

            {dias.map((dia) => {
              const doDia = eventos
                .map((evento) => ({ evento, posicao: posicaoVisivel(evento, preview) }))
                .filter((item) => item.posicao.diaISO === dia)
              const faixas = distribuirFaixas(doDia)

              return (
                <div
                  key={dia}
                  data-coluna={dia}
                  className="relative border-l border-line"
                >
                  {Array.from({ length: MINUTOS_GRADE / SLOT_MINUTOS }, (_, indice) => (
                    <div
                      key={indice}
                      className={`absolute inset-x-0 border-t ${
                        indice % 2 === 0 ? "border-line" : "border-canvas"
                      }`}
                      style={{ top: indice * PX_POR_SLOT, height: PX_POR_SLOT }}
                    />
                  ))}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bg-canvas/80"
                    style={{
                      top: ((12 - HORA_INICIO) * 60 * PX_POR_SLOT) / SLOT_MINUTOS,
                      height: (60 * PX_POR_SLOT) / SLOT_MINUTOS,
                    }}
                  />

                  {doDia.map(({ evento, posicao }) => {
                    const faixa = faixas.get(evento.id) ?? { lane: 0, lanes: 1 }
                    const cor =
                      corPorProfissional.get(evento.profissionalId) ?? CORES_PROFISSIONAL[0]
                    const meta = METADADOS_SITUACAO[evento.situacao]
                    const duracao = duracaoMinutos(evento)
                    const altura = Math.max((duracao / SLOT_MINUTOS) * PX_POR_SLOT - 4, 44)
                    return (
                      <button
                        key={evento.id}
                        type="button"
                        aria-pressed={selecionadoId === evento.id}
                        aria-grabbed={preview?.id === evento.id}
                        disabled={movendo}
                        onPointerDown={(ponteiro) => {
                          if (!evento.podeArrastar || ponteiro.button !== 0 || movendo) return
                          const alvo = ponteiro.currentTarget
                          const origemX = ponteiro.clientX
                          const origemY = ponteiro.clientY
                          let arrastou = false
                          let diaAtual = posicao.diaISO
                          let minutosAtuais = posicao.minutos
                          alvo.setPointerCapture(ponteiro.pointerId)

                          const atualizarPeloPonteiro = (ev: PointerEvent) => {
                            if (!gradeRef.current) return
                            const coluna = document
                              .elementsFromPoint(ev.clientX, ev.clientY)
                              .map((el) => el.closest("[data-coluna]")?.getAttribute("data-coluna"))
                              .find((valor): valor is string => Boolean(valor))
                            if (coluna) diaAtual = coluna
                            const retangulo = gradeRef.current.getBoundingClientRect()
                            minutosAtuais = minutosEncaixados(ev.clientY - retangulo.top, duracao)
                          }

                          const mover = (ev: PointerEvent) => {
                            if (Math.hypot(ev.clientX - origemX, ev.clientY - origemY) > 6) {
                              arrastou = true
                            }
                            if (!arrastou) return
                            atualizarPeloPonteiro(ev)
                            setPreview({ id: evento.id, diaISO: diaAtual, minutos: minutosAtuais })
                          }

                          const encerrar = (ev: PointerEvent) => {
                            alvo.removeEventListener("pointermove", mover)
                            alvo.removeEventListener("pointerup", encerrar)
                            alvo.removeEventListener("pointercancel", encerrar)
                            if (Math.hypot(ev.clientX - origemX, ev.clientY - origemY) > 6) {
                              arrastou = true
                              atualizarPeloPonteiro(ev)
                            }
                            if (!arrastou) {
                              onSelecionar(evento.id)
                              return
                            }
                            void soltar(evento, diaAtual, minutosAtuais)
                          }

                          alvo.addEventListener("pointermove", mover)
                          alvo.addEventListener("pointerup", encerrar)
                          alvo.addEventListener("pointercancel", encerrar)
                        }}
                        onClick={() => {
                          if (!evento.podeArrastar) onSelecionar(evento.id)
                        }}
                        onKeyDown={(tecla) => {
                          if (tecla.key === "Enter" || tecla.key === " ") {
                            tecla.preventDefault()
                            onSelecionar(evento.id)
                          }
                        }}
                        className={`absolute z-10 overflow-hidden rounded-xl border px-1.5 py-1 text-left ${
                          evento.podeArrastar ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                        } ${selecionadoId === evento.id ? "ring-2 ring-ink" : ""}`}
                        style={{
                          top: (posicao.minutos / SLOT_MINUTOS) * PX_POR_SLOT + 2,
                          height: altura,
                          left: `calc(${(faixa.lane / faixa.lanes) * 100}% + 2px)`,
                          width: `calc(${100 / faixa.lanes}% - 4px)`,
                          backgroundColor: cor.fundo,
                          borderColor: cor.borda,
                          color: cor.texto,
                          touchAction: evento.podeArrastar ? "none" : "auto",
                        }}
                      >
                        <span className="block truncate text-[11px] font-semibold tabular-nums">
                          {rotuloHorario(posicao.minutos, duracao)}
                        </span>
                        <span className="block truncate text-xs font-semibold">{evento.titulo}</span>
                        <span className="block truncate text-[11px]">
                          {meta.simbolo} {meta.rotulo}
                          {evento.detalhe ? ` · ${evento.detalhe}` : ""}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function posicaoVisivel(evento: EventoCalendario, preview: Preview | null) {
  if (preview?.id === evento.id) return { diaISO: preview.diaISO, minutos: preview.minutos }
  return posicaoDoEvento(evento)
}

function posicaoDoEvento(evento: EventoCalendario) {
  const rel = relogioNoFuso(new Date(evento.inicioISO))
  const diaISO = `${rel.ano}-${String(rel.mes).padStart(2, "0")}-${String(rel.dia).padStart(2, "0")}`
  const minutos = (rel.hora - HORA_INICIO) * 60 + rel.minuto
  return { diaISO, minutos: Math.max(0, minutos) }
}

function duracaoMinutos(evento: EventoCalendario) {
  return Math.max(SLOT_MINUTOS, (new Date(evento.fimISO).getTime() - new Date(evento.inicioISO).getTime()) / 60_000)
}

function minutosEncaixados(y: number, duracao: number) {
  const bruto = (y / PX_POR_SLOT) * SLOT_MINUTOS
  const encaixado = Math.round(bruto / SLOT_MINUTOS) * SLOT_MINUTOS
  const maximo = Math.max(0, MINUTOS_GRADE - duracao)
  return Math.min(maximo, Math.max(0, encaixado))
}

function rotuloHorario(minutos: number, duracao: number) {
  const inicio = HORA_INICIO * 60 + minutos
  const fim = inicio + duracao
  return `${formatarMinutos(inicio)}–${formatarMinutos(fim)}`
}

function formatarMinutos(total: number) {
  const hora = Math.floor(total / 60)
  const minuto = total % 60
  return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`
}

function distribuirFaixas(
  itens: { evento: EventoCalendario; posicao: { minutos: number } }[],
) {
  const ordenados = itens
    .map((item) => ({
      id: item.evento.id,
      inicio: item.posicao.minutos,
      fim: item.posicao.minutos + duracaoMinutos(item.evento),
    }))
    .sort((a, b) => a.inicio - b.inicio || b.fim - a.fim)
  const fimDaFaixa: number[] = []
  const faixa = new Map<string, { lane: number; lanes: number }>()
  for (const item of ordenados) {
    let lane = fimDaFaixa.findIndex((fim) => fim <= item.inicio)
    if (lane === -1) {
      lane = fimDaFaixa.length
      fimDaFaixa.push(item.fim)
    } else {
      fimDaFaixa[lane] = item.fim
    }
    faixa.set(item.id, { lane, lanes: 1 })
  }
  const total = Math.max(1, fimDaFaixa.length)
  for (const item of itens) {
    const atual = faixa.get(item.evento.id)
    if (atual) faixa.set(item.evento.id, { ...atual, lanes: total })
  }
  return faixa
}

function rotuloDia(iso: string) {
  const partes = lerISO(iso)
  if (!partes) return iso
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(Date.UTC(partes.ano, partes.mes - 1, partes.dia, 12)))
}

function lerISO(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  return { ano: Number(match[1]), mes: Number(match[2]), dia: Number(match[3]) }
}

function deslocarDias(iso: string, dias: number) {
  const partes = lerISO(iso)
  if (!partes) return iso
  const data = new Date(Date.UTC(partes.ano, partes.mes - 1, partes.dia + dias))
  const ano = data.getUTCFullYear()
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0")
  const dia = String(data.getUTCDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

function inicioDaSemana(iso: string) {
  const partes = lerISO(iso)
  if (!partes) return iso
  const diaSemana = new Date(Date.UTC(partes.ano, partes.mes - 1, partes.dia)).getUTCDay()
  const volta = diaSemana === 0 ? 6 : diaSemana - 1
  return deslocarDias(iso, -volta)
}
