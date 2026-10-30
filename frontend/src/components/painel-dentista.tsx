"use client"

import type { SituacaoAtendimento } from "@sgc/backend/domain"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { acaoAlterarSituacaoAtendimento } from "@/app/acoes"
import { BadgePresenca, BadgeSituacao } from "@/components/badge-situacao"
import {
  formatarDataCurtaClinica,
  formatarIntervaloHorarioClinica,
} from "@/lib/formatadores"

export type ConsultaDentistaDTO = {
  id: string
  pacienteId: string
  pacienteNome: string
  pacienteTelefone: string
  servicoNome: string
  duracaoMinutos: number
  inicioISO: string
  fimISO: string
  situacao: SituacaoAtendimento
  presencaConfirmada: boolean
}

export function PainelDentista({
  nomeDentista,
  especialidadeDentista,
  expedienteTexto,
  consultas,
}: {
  nomeDentista: string
  especialidadeDentista: string
  expedienteTexto: string
  consultas: readonly ConsultaDentistaDTO[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filtroSituacao, setFiltroSituacao] = useState<string>("todas")
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  function atualizarAtendimento(agendamentoId: string, novaSituacao: SituacaoAtendimento) {
    setErro(null)
    setSucesso(null)
    startTransition(async () => {
      const res = await acaoAlterarSituacaoAtendimento({
        agendamentoId,
        situacao: novaSituacao,
      })
      if (!res.ok) {
        setErro(res.mensagem)
        return
      }
      setSucesso(res.mensagem)
      router.refresh()
    })
  }

  const filaPrioritaria = consultas.filter(
    (c) => c.situacao === "chegou" || c.situacao === "em_atendimento",
  )

  const filtradas = consultas.filter((c) => {
    if (filtroSituacao === "todas") return true
    return c.situacao === filtroSituacao
  })

  const pacientesSobResponsabilidade = Array.from(
    new Map(
      consultas.map((c) => [
        c.pacienteId,
        {
          id: c.pacienteId,
          nome: c.pacienteNome,
          telefone: c.pacienteTelefone,
          totalConsultas: consultas.filter((item) => item.pacienteId === c.pacienteId).length,
        },
      ]),
    ).values(),
  )

  return (
    <div className="space-y-6">
      {/* Compact App Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#002664]">
              {nomeDentista}
            </h1>
            <span className="rounded-full bg-[#E3F3F4] px-3 py-0.5 text-xs font-bold text-[#004047]">
              {especialidadeDentista}
            </span>
          </div>
          <p className="text-sm text-[#495054]">
            Expediente: {expedienteTexto} • Apenas sua agenda
          </p>
        </div>

        <div className="inline-flex flex-wrap rounded-2xl border border-[#E2E8F0] bg-white p-1.5 shadow-xs">
          {[
            { valor: "todas", rotulo: "Todas" },
            { valor: "chegou", rotulo: "Na recepção" },
            { valor: "em_atendimento", rotulo: "Em atendimento" },
            { valor: "agendado", rotulo: "Agendadas" },
            { valor: "concluido", rotulo: "Concluídas" },
          ].map((f) => {
            const ativo = filtroSituacao === f.valor
            return (
              <button
                key={f.valor}
                type="button"
                onClick={() => setFiltroSituacao(f.valor)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                  ativo
                    ? "bg-[#002664] text-white shadow-xs"
                    : "text-[#495054] hover:bg-[#F1F5F9] hover:text-[#002664]"
                }`}
              >
                {f.rotulo}
              </button>
            )
          })}
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          className="rounded-xl border border-[#F5B7C4] bg-[#FBE9ED] px-4 py-3 text-sm font-bold text-[#8A0D29]"
        >
          {erro}
        </div>
      )}

      {sucesso && (
        <div
          role="status"
          className="rounded-xl border border-[#A3DFC0] bg-[#E5F5EC] px-4 py-3 text-sm font-bold text-[#00522B]"
        >
          {sucesso}
        </div>
      )}

      {/* Priority Queue — Patients waiting in reception or currently in chair */}
      {filaPrioritaria.length > 0 && (
        <section
          aria-labelledby="titulo-fila-prioritaria"
          className="rounded-2xl border border-[#004047]/25 bg-[#004047] p-5 text-white shadow-xs sm:p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="titulo-fila-prioritaria" className="text-base font-extrabold text-white">
              Prontos para ação ({filaPrioritaria.length})
            </h2>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-[#CBEDFD]">
              Na recepção ou em cadeira
            </span>
          </div>

          <div className="grid gap-3.5 md:grid-cols-2">
            {filaPrioritaria.map((consulta) => {
              const inicio = new Date(consulta.inicioISO)
              const fim = new Date(consulta.fimISO)
              return (
                <article
                  key={consulta.id}
                  className="flex flex-col justify-between rounded-xl bg-white p-4 text-[#22272B] shadow-xs"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <BadgeSituacao situacao={consulta.situacao} />
                      <span className="font-mono text-xs font-bold text-[#495054] tabular-nums">
                        {formatarDataCurtaClinica(inicio)} •{" "}
                        {formatarIntervaloHorarioClinica(inicio, fim)}
                      </span>
                    </div>
                    <h3 className="mt-2.5 text-lg font-extrabold text-[#002664]">
                      {consulta.pacienteNome}
                    </h3>
                    <p className="text-xs font-medium text-[#495054]">
                      {consulta.servicoNome} ({consulta.duracaoMinutos} min)
                    </p>
                  </div>

                  <div className="mt-4">
                    {consulta.situacao === "chegou" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => atualizarAtendimento(consulta.id, "em_atendimento")}
                        className="w-full rounded-xl bg-[#002664] px-4 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-[#146CFD]"
                      >
                        ▶ Chamar paciente
                      </button>
                    )}
                    {consulta.situacao === "em_atendimento" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => atualizarAtendimento(consulta.id, "concluido")}
                        className="w-full rounded-xl bg-[#006938] px-4 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-[#00522B]"
                      >
                        ✓ Concluir atendimento
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="titulo-atendimentos-dentista"
          className="space-y-3 lg:col-span-8"
        >
          <h2 id="titulo-atendimentos-dentista" className="sr-only">
            Meus atendimentos
          </h2>

          {filtradas.length === 0 ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center text-sm text-[#495054]">
              Nenhuma consulta encontrada para este filtro.
            </div>
          ) : (
            <div className="space-y-3">
              {filtradas.map((consulta) => {
                const inicio = new Date(consulta.inicioISO)
                const fim = new Date(consulta.fimISO)

                return (
                  <article
                    key={consulta.id}
                    className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition-all hover:border-[#CBD5E1]"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-[#002664] px-2.5 py-1 font-mono text-xs font-bold text-white tabular-nums">
                            {formatarDataCurtaClinica(inicio)} •{" "}
                            {formatarIntervaloHorarioClinica(inicio, fim)}
                          </span>
                          <BadgeSituacao situacao={consulta.situacao} />
                          <BadgePresenca confirmada={consulta.presencaConfirmada} />
                        </div>
                        <h3 className="text-base font-extrabold text-[#002664]">
                          {consulta.pacienteNome}
                        </h3>
                        <p className="text-xs text-[#495054]">
                          <strong className="text-[#22272B]">{consulta.servicoNome}</strong> •{" "}
                          {consulta.duracaoMinutos} min
                        </p>
                      </div>

                      <div className="flex flex-col items-stretch gap-2 sm:items-end">
                        {consulta.situacao === "chegou" && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => atualizarAtendimento(consulta.id, "em_atendimento")}
                            className="rounded-xl bg-[#002664] px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-[#146CFD]"
                          >
                            ▶ Iniciar atendimento
                          </button>
                        )}

                        {consulta.situacao === "em_atendimento" && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => atualizarAtendimento(consulta.id, "concluido")}
                            className="rounded-xl bg-[#006938] px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-[#00522B]"
                          >
                            ✓ Concluir atendimento
                          </button>
                        )}

                        {consulta.situacao === "agendado" && (
                          <span className="rounded-xl bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#495054]">
                            Aguardando chegada
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* Pacientes sob responsabilidade deste dentista */}
        <aside className="lg:col-span-4">
          <div
            aria-labelledby="titulo-pacientes-dentista"
            className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="titulo-pacientes-dentista"
                className="text-base font-extrabold text-[#002664]"
              >
                Meus Pacientes
              </h2>
              <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-bold text-[#002664]">
                {pacientesSobResponsabilidade.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#495054]">
              Acesso restrito aos pacientes da sua agenda.
            </p>

            <ul className="mt-4 divide-y divide-[#F1F5F9] text-sm">
              {pacientesSobResponsabilidade.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-bold text-[#002664]">{p.nome}</p>
                    <p className="font-mono text-xs text-[#495054]">{p.telefone}</p>
                  </div>
                  <span className="rounded-full bg-[#E6F2FD] px-2.5 py-0.5 text-xs font-bold text-[#002664]">
                    {p.totalConsultas}x
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
