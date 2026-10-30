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
  motivoCancelamento: string | null
}

export type AnamneseDentistaDTO = {
  queixaPrincipal: string
  historicoOdontologico: string
  alergias: string
  medicamentosEmUso: string
  observacoes: string
}

export type PacienteDentistaDTO = {
  id: string
  nome: string
  telefone: string
  email: string | null
  anamnese: AnamneseDentistaDTO | null
}

export function PainelDentista({
  nomeDentista,
  especialidadeDentista,
  expedienteTexto,
  consultas,
  pacientes,
  agoraISO,
}: {
  nomeDentista: string
  especialidadeDentista: string
  expedienteTexto: string
  consultas: readonly ConsultaDentistaDTO[]
  pacientes: readonly PacienteDentistaDTO[]
  agoraISO: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [aba, setAba] = useState<"agenda" | "paciente">("agenda")
  const [filtroSituacao, setFiltroSituacao] = useState<string>("todas")
  const [pacienteId, setPacienteId] = useState(pacientes[0]?.id ?? "")
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  function abrirFicha(id: string) {
    setPacienteId(id)
    setAba("paciente")
  }

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

  const agoraMs = new Date(agoraISO).getTime()
  const pacienteSelecionado = pacientes.find((paciente) => paciente.id === pacienteId) ?? pacientes[0]
  const consultasDoPaciente = pacienteSelecionado
    ? consultas.filter((consulta) => consulta.pacienteId === pacienteSelecionado.id)
    : []
  const consultasAnteriores = consultasDoPaciente
    .filter((consulta) => new Date(consulta.inicioISO).getTime() < agoraMs)
    .sort((a, b) => new Date(b.inicioISO).getTime() - new Date(a.inicioISO).getTime())
  const consultasProximas = consultasDoPaciente
    .filter((consulta) => new Date(consulta.inicioISO).getTime() >= agoraMs)
    .sort((a, b) => new Date(a.inicioISO).getTime() - new Date(b.inicioISO).getTime())

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
      <div className="module-heading">
        <div>
          <p className="eyebrow">Sua agenda de cuidados</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {nomeDentista}
            </h1>
            <span className="rounded-full bg-soft px-3 py-0.5 text-xs font-semibold text-ink">
              {especialidadeDentista}
            </span>
          </div>
          <p className="text-sm text-muted">
            Expediente: {expedienteTexto} • Apenas sua agenda
          </p>
        </div>

        <div className="module-tabs" role="group" aria-label="Seções do dentista">
          {[
            { valor: "todas", rotulo: "Todas" },
            { valor: "chegou", rotulo: "Na recepção" },
            { valor: "em_atendimento", rotulo: "Em atendimento" },
            { valor: "agendado", rotulo: "Agendadas" },
            { valor: "concluido", rotulo: "Concluídas" },
          ].map((f) => {
            const ativo = aba === "agenda" && filtroSituacao === f.valor
            return (
              <button
                key={f.valor}
                type="button"
                onClick={() => {
                  setFiltroSituacao(f.valor)
                  setAba("agenda")
                }}
                aria-pressed={ativo}
                className="rounded-xl px-3.5 py-2 text-xs font-semibold"
              >
                {f.rotulo}
              </button>
            )
          })}
          <button
            type="button"
            aria-pressed={aba === "paciente"}
            onClick={() => setAba("paciente")}
            className="rounded-xl px-3.5 py-2 text-xs font-semibold"
          >
            Paciente
          </button>
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          className="rounded-xl border border-[#F5B7C4] bg-[#FBE9ED] px-4 py-3 text-sm font-semibold text-[#8A0D29]"
        >
          {erro}
        </div>
      )}

      {sucesso && (
        <div
          role="status"
          className="rounded-xl border border-[#A3DFC0] bg-[#E5F5EC] px-4 py-3 text-sm font-semibold text-[#00522B]"
        >
          {sucesso}
        </div>
      )}

      {aba === "agenda" && filaPrioritaria.length > 0 && (
        <section
          aria-labelledby="titulo-fila-prioritaria"
          className="rounded-xl border border-ink/25 bg-ink p-5 text-white sm:p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="titulo-fila-prioritaria" className="text-base font-semibold text-white">
              Prontos para ação ({filaPrioritaria.length})
            </h2>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-tint">
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
                  className="flex flex-col justify-between rounded-xl bg-white p-4 text-ink"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <BadgeSituacao situacao={consulta.situacao} />
                      <span className="font-sans text-xs font-semibold text-muted tabular-nums">
                        {formatarDataCurtaClinica(inicio)} •{" "}
                        {formatarIntervaloHorarioClinica(inicio, fim)}
                      </span>
                    </div>
                    <h3 className="mt-2.5 text-lg font-semibold text-ink">
                      {consulta.pacienteNome}
                    </h3>
                    <p className="text-xs font-medium text-muted">
                      {consulta.servicoNome} ({consulta.duracaoMinutos} min)
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => abrirFicha(consulta.pacienteId)}
                      className="min-h-11 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold text-ink hover:bg-soft"
                    >
                      Ficha do paciente
                    </button>
                    {consulta.situacao === "chegou" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => atualizarAtendimento(consulta.id, "em_atendimento")}
                        className="w-full rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand"
                      >
                        ▶ Chamar paciente
                      </button>
                    )}
                    {consulta.situacao === "em_atendimento" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => atualizarAtendimento(consulta.id, "concluido")}
                        className="w-full rounded-xl bg-[#006938] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#00522B]"
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

      {aba === "agenda" && (
      <div className="grid gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="titulo-atendimentos-dentista"
          className="space-y-3 lg:col-span-8"
        >
          <h2 id="titulo-atendimentos-dentista" className="sr-only">
            Meus atendimentos
          </h2>

          {filtradas.length === 0 ? (
            <div className="rounded-xl border border-line bg-white p-8 text-center text-sm text-muted">
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
                    className="rounded-xl border border-line bg-white p-5 transition-colors hover:border-input"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-ink px-2.5 py-1 font-sans text-xs font-semibold text-white tabular-nums">
                            {formatarDataCurtaClinica(inicio)} •{" "}
                            {formatarIntervaloHorarioClinica(inicio, fim)}
                          </span>
                          <BadgeSituacao situacao={consulta.situacao} />
                          <BadgePresenca confirmada={consulta.presencaConfirmada} />
                        </div>
                        <h3 className="text-base font-semibold text-ink">
                          {consulta.pacienteNome}
                        </h3>
                        <p className="text-xs text-muted">
                          <strong className="text-ink">{consulta.servicoNome}</strong> •{" "}
                          {consulta.duracaoMinutos} min
                        </p>
                      </div>

                      <div className="flex flex-col items-stretch gap-2 sm:items-end">
                        <button
                          type="button"
                          onClick={() => abrirFicha(consulta.pacienteId)}
                          className="min-h-11 rounded-xl border border-line bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-soft"
                        >
                          Ficha do paciente
                        </button>
                        {consulta.situacao === "chegou" && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => atualizarAtendimento(consulta.id, "em_atendimento")}
                            className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand"
                          >
                            ▶ Iniciar atendimento
                          </button>
                        )}

                        {consulta.situacao === "em_atendimento" && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => atualizarAtendimento(consulta.id, "concluido")}
                            className="rounded-xl bg-[#006938] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#00522B]"
                          >
                            ✓ Concluir atendimento
                          </button>
                        )}

                        {consulta.situacao === "agendado" && (
                          <span className="rounded-xl bg-canvas px-3 py-1.5 text-xs font-semibold text-muted">
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
            className="rounded-xl border border-line bg-white p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="titulo-pacientes-dentista"
                className="text-base font-semibold text-ink"
              >
                Meus Pacientes
              </h2>
              <span className="rounded-full bg-soft px-2.5 py-0.5 text-xs font-semibold text-ink">
                {pacientesSobResponsabilidade.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Acesso restrito aos pacientes da sua agenda.
            </p>

            <ul className="mt-4 divide-y divide-soft text-sm">
              {pacientesSobResponsabilidade.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => abrirFicha(p.id)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 py-2.5 text-left"
                  >
                    <span>
                      <span className="block font-semibold text-ink">{p.nome}</span>
                      <span className="block font-sans text-xs text-muted">{p.telefone}</span>
                    </span>
                    <span className="rounded-full bg-soft px-2.5 py-0.5 text-xs font-semibold text-ink">
                      {p.totalConsultas}x
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
      )}

      {aba === "paciente" && (
        <FichaPaciente
          pacientes={pacientes}
          paciente={pacienteSelecionado}
          consultasAnteriores={consultasAnteriores}
          consultasProximas={consultasProximas}
          onSelecionar={setPacienteId}
        />
      )}
    </div>
  )
}

function FichaPaciente({
  pacientes,
  paciente,
  consultasAnteriores,
  consultasProximas,
  onSelecionar,
}: {
  pacientes: readonly PacienteDentistaDTO[]
  paciente: PacienteDentistaDTO | undefined
  consultasAnteriores: readonly ConsultaDentistaDTO[]
  consultasProximas: readonly ConsultaDentistaDTO[]
  onSelecionar: (pacienteId: string) => void
}) {
  if (!paciente) {
    return (
      <div className="rounded-xl border border-line bg-white p-6 text-sm text-muted">
        Nenhum paciente na sua agenda.
      </div>
    )
  }

  const camposAnamnese = paciente.anamnese
    ? [
        ["Queixa principal", paciente.anamnese.queixaPrincipal],
        ["Histórico odontológico", paciente.anamnese.historicoOdontologico],
        ["Alergias", paciente.anamnese.alergias],
        ["Medicamentos em uso", paciente.anamnese.medicamentosEmUso],
        ["Observações", paciente.anamnese.observacoes],
      ]
    : []

  return (
    <div className="space-y-6">
      <section aria-labelledby="titulo-ficha-paciente" className="rounded-xl border border-line bg-white p-5 sm:p-6">
        <h2 id="titulo-ficha-paciente" className="text-base font-semibold text-ink">
          Ficha do paciente
        </h2>
        <p className="mt-1 text-xs text-muted">
          Consultas da sua agenda, anamnese e contato. Dados fictícios de demonstração.
        </p>

        <div className="mt-4 max-w-xl">
          <label htmlFor="dentista-paciente" className="block text-xs font-semibold text-ink">
            Paciente
          </label>
          <select
            id="dentista-paciente"
            value={paciente.id}
            onChange={(evento) => onSelecionar(evento.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink"
          >
            {pacientes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-muted">Telefone</dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{paciente.telefone}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted">E-mail</dt>
            <dd className="mt-1 break-all text-sm font-semibold text-ink">
              {paciente.email ?? "Não informado"}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="titulo-anamnese" className="rounded-xl border border-line bg-white p-5 sm:p-6">
        <h2 id="titulo-anamnese" className="text-base font-semibold text-ink">
          Anamnese
        </h2>
        {camposAnamnese.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Sem anamnese registrada.</p>
        ) : (
          <dl className="mt-4 space-y-4">
            {camposAnamnese.map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt className="text-xs font-semibold text-muted">{rotulo}</dt>
                <dd className="mt-1 text-sm text-ink">{valor}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <ListaConsultas titulo="Consultas anteriores" idTitulo="titulo-consultas-anteriores" consultas={consultasAnteriores} vazio="Nenhuma consulta anterior nesta agenda." />
      <ListaConsultas titulo="Próximas consultas" idTitulo="titulo-consultas-proximas" consultas={consultasProximas} vazio="Nenhuma consulta futura nesta agenda." />
    </div>
  )
}

function ListaConsultas({
  titulo,
  idTitulo,
  consultas,
  vazio,
}: {
  titulo: string
  idTitulo: string
  consultas: readonly ConsultaDentistaDTO[]
  vazio: string
}) {
  return (
    <section aria-labelledby={idTitulo} className="space-y-3">
      <h2 id={idTitulo} className="text-base font-semibold text-ink">
        {titulo} ({consultas.length})
      </h2>
      {consultas.length === 0 ? (
        <p className="rounded-xl border border-line bg-white p-5 text-sm text-muted">{vazio}</p>
      ) : (
        <ul className="space-y-3">
          {consultas.map((consulta) => {
            const inicio = new Date(consulta.inicioISO)
            const fim = new Date(consulta.fimISO)
            return (
              <li key={consulta.id} className="rounded-xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-ink px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
                    {formatarDataCurtaClinica(inicio)} • {formatarIntervaloHorarioClinica(inicio, fim)}
                  </span>
                  <BadgeSituacao situacao={consulta.situacao} />
                  <BadgePresenca confirmada={consulta.presencaConfirmada} />
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {consulta.servicoNome} ({consulta.duracaoMinutos} min)
                </p>
                {consulta.motivoCancelamento && (
                  <p className="mt-1 text-xs text-muted">Motivo: {consulta.motivoCancelamento}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
