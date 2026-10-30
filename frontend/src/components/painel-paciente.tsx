"use client"

import type { SituacaoAtendimento } from "@sgc/backend/domain"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useTransition } from "react"
import {
  acaoAgendarConsulta,
  acaoAtualizarDadosPaciente,
  acaoCancelarConsulta,
  acaoConsultarHorariosDisponiveis,
  acaoRemarcarConsulta,
} from "@/app/acoes"
import { BadgePresenca, BadgeSituacao } from "@/components/badge-situacao"
import {
  formatarDataCurtaClinica,
  formatarDataHoraClinica,
  formatarHorarioClinica,
  formatarIntervaloHorarioClinica,
} from "@/lib/formatadores"

export type ConsultaPacienteDTO = {
  id: string
  servicoId: string
  servicoNome: string
  duracaoMinutos: number
  profissionalId: string
  profissionalNome: string
  profissionalEspecialidade: string
  inicioISO: string
  fimISO: string
  situacao: SituacaoAtendimento
  presencaConfirmada: boolean
  motivoCancelamento: string | null
}

export type ServicoPacienteDTO = {
  id: string
  nome: string
  descricao: string
  duracaoMinutos: number
  indicacaoPreco: string
  profissionaisHabilitados: string[]
}

export type ProfissionalPacienteDTO = {
  id: string
  nome: string
  especialidade: string
}

function gerarProximosDiasUteis(dataBaseISO: string, quantidade = 6): { iso: string; rotulo: string }[] {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataBaseISO)
  const baseMs = partes
    ? Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]), 12, 0, 0)
    : Date.now() + 86_400_000
  const lista: { iso: string; rotulo: string }[] = []
  let offset = 0
  while (lista.length < quantidade && offset < 20) {
    const d = new Date(baseMs + offset * 86_400_000)
    offset += 1
    if (d.getUTCDay() === 0) continue
    const ano = d.getUTCFullYear()
    const mes = String(d.getUTCMonth() + 1).padStart(2, "0")
    const dia = String(d.getUTCDate()).padStart(2, "0")
    const iso = `${ano}-${mes}-${dia}`
    const rotulo = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "UTC",
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }).format(d)
    lista.push({ iso, rotulo })
  }
  return lista
}

export function PainelPaciente({
  paciente,
  servicos,
  profissionais,
  consultas,
  dataPadraoISO,
  horariosIniciaisISO,
}: {
  paciente: {
    id: string
    nome: string
    email: string
    telefone: string
  }
  servicos: readonly ServicoPacienteDTO[]
  profissionais: readonly ProfissionalPacienteDTO[]
  consultas: readonly ConsultaPacienteDTO[]
  dataPadraoISO: string
  horariosIniciaisISO: readonly string[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [abaAtiva, setAbaAtiva] = useState<"agendar" | "consultas" | "dados">("consultas")

  const [erroGlobal, setErroGlobal] = useState<string | null>(null)
  const [sucessoGlobal, setSucessoGlobal] = useState<string | null>(null)

  const [servicoId, setServicoId] = useState(servicos[0]?.id ?? "")
  const servicoSelecionado = servicos.find((s) => s.id === servicoId) ?? servicos[0]
  const profissionaisDoServico = profissionais.filter((p) =>
    servicoSelecionado?.profissionaisHabilitados.includes(p.id),
  )
  const [profissionalId, setProfissionalId] = useState(profissionaisDoServico[0]?.id ?? "")
  const [dataISO, setDataISO] = useState(dataPadraoISO)
  const [horariosISO, setHorariosISO] = useState<readonly string[]>(horariosIniciaisISO)
  const [carregandoHorarios, setCarregandoHorarios] = useState(false)
  const [horarioEscolhidoISO, setHorarioEscolhidoISO] = useState<string>(
    horariosIniciaisISO[0] ?? "",
  )

  const diasSugeridos = useMemo(() => gerarProximosDiasUteis(dataPadraoISO, 6), [dataPadraoISO])

  const [comprovante, setComprovante] = useState<{
    id: string
    servicoNome: string
    profissionalNome: string
    inicioISO: string
    fimISO: string
    duracaoMinutos: number
  } | null>(null)

  const [remarcandoId, setRemarcandoId] = useState<string | null>(null)
  const [dataRemarcacaoISO, setDataRemarcacaoISO] = useState(dataPadraoISO)
  const [horariosRemarcacaoISO, setHorariosRemarcacaoISO] = useState<string[]>([])
  const [horarioNovoRemarcacaoISO, setHorarioNovoRemarcacaoISO] = useState("")
  const [carregandoRemarcacao, setCarregandoRemarcacao] = useState(false)

  const [cancelandoId, setCancelandoId] = useState<string | null>(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState("")

  const [nomeDados, setNomeDados] = useState(paciente.nome)
  const [emailDados, setEmailDados] = useState(paciente.email)
  const [telefoneDados, setTelefoneDados] = useState(paciente.telefone)

  useEffect(() => {
    if (!servicoId || !profissionalId || !dataISO) return
    let ativo = true
    setCarregandoHorarios(true)
    acaoConsultarHorariosDisponiveis({
      servicoId,
      profissionalId,
      dataISO,
    }).then((res) => {
      if (!ativo) return
      setCarregandoHorarios(false)
      if (res.ok && res.dados) {
        setHorariosISO(res.dados)
        setHorarioEscolhidoISO(res.dados[0] ?? "")
      } else {
        setHorariosISO([])
        setHorarioEscolhidoISO("")
      }
    })
    return () => {
      ativo = false
    }
  }, [servicoId, profissionalId, dataISO])

  function trocarServico(novoServicoId: string) {
    setServicoId(novoServicoId)
    const serv = servicos.find((s) => s.id === novoServicoId)
    if (serv && !serv.profissionaisHabilitados.includes(profissionalId)) {
      const primeiroHabilitado = profissionais.find((p) =>
        serv.profissionaisHabilitados.includes(p.id),
      )
      setProfissionalId(primeiroHabilitado?.id ?? "")
    }
  }

  function confirmarReserva(e: React.FormEvent) {
    e.preventDefault()
    setErroGlobal(null)
    setSucessoGlobal(null)
    if (!horarioEscolhidoISO) {
      setErroGlobal("Selecione um horário disponível antes de confirmar.")
      return
    }
    startTransition(async () => {
      const res = await acaoAgendarConsulta({
        pacienteId: paciente.id,
        profissionalId,
        servicoId,
        inicio: horarioEscolhidoISO,
      })
      if (!res.ok || !res.dados) {
        setErroGlobal(res.mensagem)
        return
      }
      const prof = profissionais.find((p) => p.id === res.dados?.profissionalId)
      const serv = servicos.find((s) => s.id === res.dados?.servicoId)
      setComprovante({
        id: res.dados.id,
        servicoNome: serv?.nome ?? "Avaliação Odontológica",
        profissionalNome: prof?.nome ?? "Profissional",
        inicioISO: res.dados.inicioISO,
        fimISO: res.dados.fimISO,
        duracaoMinutos: serv?.duracaoMinutos ?? 60,
      })
      setSucessoGlobal(res.mensagem)
      router.refresh()
    })
  }

  function abrirPainelRemarcacao(consulta: ConsultaPacienteDTO) {
    setCancelandoId(null)
    setRemarcandoId(consulta.id)
    setErroGlobal(null)
    setSucessoGlobal(null)
    setCarregandoRemarcacao(true)
    acaoConsultarHorariosDisponiveis({
      profissionalId: consulta.profissionalId,
      servicoId: consulta.servicoId,
      dataISO: dataRemarcacaoISO,
      ignorarAgendamentoId: consulta.id,
    }).then((res) => {
      setCarregandoRemarcacao(false)
      if (res.ok && res.dados) {
        setHorariosRemarcacaoISO(res.dados)
        setHorarioNovoRemarcacaoISO(res.dados[0] ?? "")
      } else {
        setHorariosRemarcacaoISO([])
        setHorarioNovoRemarcacaoISO("")
      }
    })
  }

  function alterarDataRemarcacao(consulta: ConsultaPacienteDTO, novaDataISO: string) {
    setDataRemarcacaoISO(novaDataISO)
    setCarregandoRemarcacao(true)
    acaoConsultarHorariosDisponiveis({
      profissionalId: consulta.profissionalId,
      servicoId: consulta.servicoId,
      dataISO: novaDataISO,
      ignorarAgendamentoId: consulta.id,
    }).then((res) => {
      setCarregandoRemarcacao(false)
      if (res.ok && res.dados) {
        setHorariosRemarcacaoISO(res.dados)
        setHorarioNovoRemarcacaoISO(res.dados[0] ?? "")
      } else {
        setHorariosRemarcacaoISO([])
        setHorarioNovoRemarcacaoISO("")
      }
    })
  }

  function submeterRemarcacao(agendamentoId: string) {
    setErroGlobal(null)
    setSucessoGlobal(null)
    if (!horarioNovoRemarcacaoISO) {
      setErroGlobal("Escolha um novo horário disponível para remarcar.")
      return
    }
    startTransition(async () => {
      const res = await acaoRemarcarConsulta({
        agendamentoId,
        inicio: horarioNovoRemarcacaoISO,
      })
      if (!res.ok) {
        setErroGlobal(res.mensagem)
        return
      }
      setRemarcandoId(null)
      setSucessoGlobal(res.mensagem)
      router.refresh()
    })
  }

  function submeterCancelamento(agendamentoId: string) {
    setErroGlobal(null)
    setSucessoGlobal(null)
    startTransition(async () => {
      const res = await acaoCancelarConsulta({
        agendamentoId,
        motivo: motivoCancelamento,
      })
      if (!res.ok) {
        setErroGlobal(res.mensagem)
        return
      }
      setCancelandoId(null)
      setMotivoCancelamento("")
      setSucessoGlobal(res.mensagem)
      router.refresh()
    })
  }

  function submeterDadosBasicos(e: React.FormEvent) {
    e.preventDefault()
    setErroGlobal(null)
    setSucessoGlobal(null)
    startTransition(async () => {
      const res = await acaoAtualizarDadosPaciente({
        pacienteId: paciente.id,
        nome: nomeDados,
        email: emailDados,
        telefone: telefoneDados,
      })
      if (!res.ok) {
        setErroGlobal(res.mensagem)
        return
      }
      setSucessoGlobal(res.mensagem)
      router.refresh()
    })
  }

  const agoraMs = Date.now()
  const consultasFuturas = consultas.filter(
    (c) =>
      new Date(c.inicioISO).getTime() >= agoraMs &&
      c.situacao !== "cancelado" &&
      c.situacao !== "concluido" &&
      c.situacao !== "falta",
  )
  const consultasHistorico = consultas.filter((c) => !consultasFuturas.includes(c))
  const profissionalSelecionado = profissionais.find((p) => p.id === profissionalId)

  return (
    <div className="space-y-6">
      <div className="module-heading">
        <div>
          <p className="eyebrow">Seu espaço de cuidado</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Olá, {paciente.nome}
          </h1>
          <p className="text-xs text-muted">
            Acompanhe suas consultas ou marque uma nova.
          </p>
        </div>

        <div
          role="group"
          aria-label="Seções do Paciente"
          className="module-tabs"
        >
          <button
            type="button"
            aria-pressed={abaAtiva === "consultas"}
            onClick={() => setAbaAtiva("consultas")}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold sm:text-sm"
          >
            <span>Minhas Consultas</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] tabular-nums ${
                abaAtiva === "consultas"
                  ? "bg-white/20 text-white"
                  : "bg-soft text-ink"
              }`}
            >
              {consultasFuturas.length}
            </span>
          </button>

          <button
            type="button"
            aria-pressed={abaAtiva === "dados"}
            onClick={() => setAbaAtiva("dados")}
            className="min-h-10 rounded-lg px-4 py-1.5 text-xs font-semibold sm:text-sm"
          >
            Meus Dados
          </button>

          <button
            type="button"
            aria-pressed={abaAtiva === "agendar"}
            onClick={() => setAbaAtiva("agendar")}
            className="nova-consulta"
          >
            Nova consulta
          </button>
        </div>
      </div>

      {erroGlobal && (
        <div
          role="alert"
          className="rounded-xl border border-[#F1B2C0] bg-[#FBE9ED] px-4 py-3 text-sm font-semibold text-[#8A0D29]"
        >
          {erroGlobal}
        </div>
      )}

      {sucessoGlobal && (
        <div
          role="status"
          className="rounded-xl border border-[#9ED9B8] bg-[#E5F5EC] px-4 py-3 text-sm font-semibold text-[#00522B]"
        >
          {sucessoGlobal}
        </div>
      )}

      {/* Comprovante de reserva */}
      {comprovante && (
        <section
          aria-labelledby="titulo-comprovante-reserva"
          className="rounded-xl border border-[#9ED9B8] bg-white p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F5EC] px-3 py-1 text-xs font-semibold text-[#00522B]">
              ✓ Reserva Confirmada
            </span>
            <span className="font-sans text-xs text-muted">ID: {comprovante.id.slice(0, 8)}</span>
          </div>

          <h2 id="titulo-comprovante-reserva" className="mt-2 text-lg font-semibold text-ink">
            {comprovante.servicoNome} com {comprovante.profissionalNome}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#00522B] tabular-nums">
            {formatarDataCurtaClinica(new Date(comprovante.inicioISO))} •{" "}
            {formatarIntervaloHorarioClinica(
              new Date(comprovante.inicioISO),
              new Date(comprovante.fimISO),
            )}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAbaAtiva("consultas")}
              className="min-h-10 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-brand"
            >
              Ver em Minhas Consultas
            </button>
            <button
              type="button"
              onClick={() => setComprovante(null)}
              className="min-h-10 rounded-xl border border-input bg-white px-4 py-2 text-xs font-semibold text-muted hover:bg-canvas"
            >
              Fechar
            </button>
          </div>
        </section>
      )}

      {abaAtiva === "agendar" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Unified 3-Step Booking Card */}
          <form
            onSubmit={confirmarReserva}
            className="booking-form space-y-6 rounded-xl border border-line bg-white p-5 sm:p-6 lg:col-span-8"
          >
            {/* 1. Procedimento */}
            <div>
              <h2 className="text-sm font-semibold text-ink">
                <span className="step-number" aria-hidden="true">1</span> Escolha o procedimento
              </h2>
              <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                {servicos.map((s) => {
                  const ativo = s.id === servicoId
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => trocarServico(s.id)}
                      className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-colors ${
                        ativo
                          ? "border-2 border-brand bg-soft/60"
                          : "border-line bg-white hover:border-ink"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-ink">{s.nome}</span>
                        <span className="shrink-0 rounded-md bg-ink px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums">
                          {s.duracaoMinutos} min
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted">{s.descricao}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Especialista e Data */}
            <div className="border-t border-line pt-5">
              <h2 className="text-sm font-semibold text-ink">
                <span className="step-number" aria-hidden="true">2</span> Especialista e data
              </h2>

              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
                {profissionaisDoServico.map((p) => {
                  const ativo = p.id === profissionalId
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => setProfissionalId(p.id)}
                      className={`rounded-xl border p-3.5 text-left transition-colors ${
                        ativo
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-white text-ink hover:border-brand"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{p.nome}</span>
                      <span
                        className={`mt-0.5 block text-[11px] ${
                          ativo ? "text-tint" : "text-muted"
                        }`}
                      >
                        {p.especialidade}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Quick Date Pills + Date Input */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {diasSugeridos.map((d) => {
                    const ativo = d.iso === dataISO
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => setDataISO(d.iso)}
                        className={`min-h-10 rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                          ativo
                            ? "border-brand bg-brand text-white"
                            : "border-line bg-canvas text-ink hover:border-ink"
                        }`}
                      >
                        {d.rotulo}
                      </button>
                    )
                  })}
                </div>

                <div>
                  <label htmlFor="agendar-data" className="sr-only">
                    Escolher outra data no calendário
                  </label>
                  <input
                    id="agendar-data"
                    type="date"
                    required
                    value={dataISO}
                    onChange={(e) => setDataISO(e.target.value)}
                    className="min-h-10 rounded-lg border border-input bg-white px-3 py-1.5 text-xs font-semibold text-ink"
                  />
                </div>
              </div>
            </div>

            {/* 3. Horários Livres */}
            <div className="border-t border-line pt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">
                  <span className="step-number" aria-hidden="true">3</span> Horários disponíveis
                </h2>
                <span className="text-[11px] font-medium text-muted">
                  Horário de Brasília
                </span>
              </div>

              {carregandoHorarios ? (
                <div className="mt-3 rounded-xl bg-canvas p-4 text-xs font-medium text-muted">
                  Consultando agenda...
                </div>
              ) : horariosISO.length === 0 ? (
                <div className="mt-3 rounded-xl border border-[#F5C896] bg-[#FFF3E5] p-4 text-xs font-semibold text-[#7A3900]">
                  Sem horários livres nesta data (domingo, horário encerrado ou agenda cheia).
                  Selecione outro dia acima.
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {horariosISO.map((iso) => {
                    const selecionado = horarioEscolhidoISO === iso
                    const rotuloHora = formatarHorarioClinica(new Date(iso))
                    return (
                      <button
                        key={iso}
                        type="button"
                        aria-pressed={selecionado}
                        onClick={() => setHorarioEscolhidoISO(iso)}
                        className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold tabular-nums transition-colors ${
                          selecionado
                            ? "border-ink bg-ink text-white "
                            : "border-line bg-canvas text-ink hover:border-brand hover:bg-soft/50"
                        }`}
                      >
                        {rotuloHora}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </form>

          {/* Sticky Summary Card */}
          <aside className="booking-summary space-y-4 lg:col-span-4">
            <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
              <h2 className="text-base font-semibold text-ink">Resumo da Reserva</h2>

              <dl className="mt-4 space-y-3 border-y border-line py-4 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Paciente</dt>
                  <dd className="font-semibold text-ink">{paciente.nome}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Procedimento</dt>
                  <dd className="text-right font-semibold text-ink">
                    {servicoSelecionado?.nome ?? "—"} ({servicoSelecionado?.duracaoMinutos ?? 60}m)
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Especialista</dt>
                  <dd className="text-right font-semibold text-ink">
                    {profissionalSelecionado?.nome ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Data e hora</dt>
                  <dd className="text-right font-semibold text-brand tabular-nums">
                    {horarioEscolhidoISO
                      ? formatarDataHoraClinica(new Date(horarioEscolhidoISO))
                      : "Escolha um horário"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Taxa online</dt>
                  <dd className="font-semibold text-[#00522B]">Gratuito</dd>
                </div>
              </dl>

              <button
                type="button"
                disabled={isPending || !horarioEscolhidoISO}
                onClick={confirmarReserva}
                className="mt-5 min-h-12 w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Confirmando..." : "Confirmar Agendamento"}
              </button>

              <p className="mt-3 text-center text-[11px] text-muted">
                Remarcação ou cancelamento livres pelo app.
              </p>
            </div>

            {consultasFuturas.length > 0 && (
              <div className="rounded-xl border border-line bg-white p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                    Próxima Consulta ({consultasFuturas.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setAbaAtiva("consultas")}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Gerenciar
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {consultasFuturas.slice(0, 2).map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl bg-canvas p-3 text-xs"
                    >
                      <p className="font-semibold text-ink">{c.servicoNome}</p>
                      <p className="text-muted">{c.profissionalNome}</p>
                      <p className="mt-1 font-semibold text-ink tabular-nums">
                        {formatarDataHoraClinica(new Date(c.inicioISO))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {abaAtiva === "consultas" && (
        <div className="space-y-6">
          <section aria-labelledby="titulo-consultas-futuras" className="space-y-3">
            <h2 id="titulo-consultas-futuras" className="text-base font-semibold text-ink">
              Próximas Consultas ({consultasFuturas.length})
            </h2>

            {consultasFuturas.length === 0 ? (
              <div className="rounded-xl border border-line bg-white p-6 text-sm text-muted">
                Nenhuma consulta futura agendada.{" "}
                <button
                  type="button"
                  onClick={() => setAbaAtiva("agendar")}
                  className="font-semibold text-brand underline"
                >
                  Nova consulta
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {consultasFuturas.map((consulta) => {
                  const podeModificar = consulta.situacao === "agendado"
                  const inicioDate = new Date(consulta.inicioISO)
                  const fimDate = new Date(consulta.fimISO)

                  return (
                    <article
                      key={consulta.id}
                      className="rounded-xl border border-line bg-white p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-ink px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
                              {formatarDataCurtaClinica(inicioDate)} •{" "}
                              {formatarIntervaloHorarioClinica(inicioDate, fimDate)}
                            </span>
                            <BadgeSituacao situacao={consulta.situacao} />
                            <BadgePresenca confirmada={consulta.presencaConfirmada} />
                          </div>
                          <h3 className="pt-1 text-base font-semibold text-ink">
                            {consulta.servicoNome} ({consulta.duracaoMinutos} min)
                          </h3>
                          <p className="text-xs text-muted">
                            {consulta.profissionalNome} • {consulta.profissionalEspecialidade}
                          </p>
                        </div>

                        {podeModificar && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => abrirPainelRemarcacao(consulta)}
                              className="min-h-10 rounded-xl border border-ink bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-soft"
                            >
                              Remarcar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRemarcandoId(null)
                                setCancelandoId(consulta.id)
                                setMotivoCancelamento("")
                              }}
                              className="min-h-10 rounded-xl border border-[#F1B2C0] bg-white px-4 py-2 text-xs font-semibold text-[#8A0D29] hover:bg-[#FBE9ED]"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>

                      {remarcandoId === consulta.id && (
                        <div className="mt-4 rounded-xl border border-input bg-soft/50 p-4">
                          <h4 className="text-xs font-semibold text-ink">
                            Escolher novo horário com {consulta.profissionalNome}
                          </h4>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div>
                              <label
                                htmlFor={`remarcar-data-${consulta.id}`}
                                className="block text-xs font-semibold text-ink"
                              >
                                Nova data
                              </label>
                              <input
                                id={`remarcar-data-${consulta.id}`}
                                type="date"
                                value={dataRemarcacaoISO}
                                onChange={(e) => alterarDataRemarcacao(consulta, e.target.value)}
                                className="mt-1 min-h-10 w-full rounded-lg border border-input bg-white px-3 py-1.5 text-xs font-semibold text-ink"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor={`remarcar-hora-${consulta.id}`}
                                className="block text-xs font-semibold text-ink"
                              >
                                Novo horário livre
                              </label>
                              {carregandoRemarcacao ? (
                                <p className="mt-2 text-xs text-muted">Consultando...</p>
                              ) : horariosRemarcacaoISO.length === 0 ? (
                                <p className="mt-2 text-xs font-semibold text-[#8A0D29]">
                                  Sem horários nesta data.
                                </p>
                              ) : (
                                <select
                                  id={`remarcar-hora-${consulta.id}`}
                                  value={horarioNovoRemarcacaoISO}
                                  onChange={(e) => setHorarioNovoRemarcacaoISO(e.target.value)}
                                  className="mt-1 min-h-10 w-full rounded-lg border border-input bg-white px-3 py-1.5 text-xs font-semibold text-ink"
                                >
                                  {horariosRemarcacaoISO.map((iso) => (
                                    <option key={iso} value={iso}>
                                      {formatarDataHoraClinica(new Date(iso))}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isPending || !horarioNovoRemarcacaoISO}
                              onClick={() => submeterRemarcacao(consulta.id)}
                              className="min-h-10 rounded-lg bg-ink px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand disabled:opacity-50"
                            >
                              Salvar novo horário
                            </button>
                            <button
                              type="button"
                              onClick={() => setRemarcandoId(null)}
                              className="min-h-10 rounded-lg border border-input bg-white px-3 py-1.5 text-xs font-semibold text-muted"
                            >
                              Fechar
                            </button>
                          </div>
                        </div>
                      )}

                      {cancelandoId === consulta.id && (
                        <div className="mt-4 rounded-xl border border-[#F1B2C0] bg-[#FBE9ED]/60 p-4">
                          <label
                            htmlFor={`motivo-cancelamento-${consulta.id}`}
                            className="block text-xs font-semibold text-[#8A0D29]"
                          >
                            Motivo do cancelamento (obrigatório)
                          </label>
                          <input
                            id={`motivo-cancelamento-${consulta.id}`}
                            type="text"
                            maxLength={200}
                            value={motivoCancelamento}
                            onChange={(e) => setMotivoCancelamento(e.target.value)}
                            placeholder="Ex.: Imprevisto no trabalho"
                            className="mt-1 min-h-10 w-full rounded-lg border border-[#F1B2C0] bg-white px-3 py-1.5 text-xs text-ink"
                          />

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isPending || motivoCancelamento.trim().length === 0}
                              onClick={() => submeterCancelamento(consulta.id)}
                              className="min-h-10 rounded-lg bg-[#D7153A] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              Confirmar cancelamento
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancelandoId(null)}
                              className="min-h-10 rounded-lg border border-input bg-white px-3 py-1.5 text-xs font-semibold text-muted"
                            >
                              Voltar
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          {consultasHistorico.length > 0 && (
            <section aria-labelledby="titulo-historico-paciente" className="space-y-3">
              <h2 id="titulo-historico-paciente" className="text-sm font-semibold text-muted">
                Histórico Anterior ({consultasHistorico.length})
              </h2>

              <div className="divide-y divide-line rounded-xl border border-line bg-white">
                {consultasHistorico.map((consulta) => (
                  <div
                    key={consulta.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {consulta.servicoNome} • {consulta.profissionalNome}
                      </p>
                      <p className="text-xs text-muted tabular-nums">
                        {formatarDataHoraClinica(new Date(consulta.inicioISO))}
                      </p>
                    </div>
                    <BadgeSituacao situacao={consulta.situacao} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {abaAtiva === "dados" && (
        <section
          aria-labelledby="titulo-dados-cadastrais"
          className="max-w-lg rounded-xl border border-line bg-white p-6"
        >
          <h2 id="titulo-dados-cadastrais" className="text-base font-semibold text-ink">
            Meus Dados de Contato
          </h2>
          <p className="mt-1 text-xs text-muted">
            Usados apenas para identificação e confirmação de presença (LGPD).
          </p>

          <form onSubmit={submeterDadosBasicos} className="mt-4 space-y-4">
            <div>
              <label htmlFor="paciente-nome" className="block text-xs font-semibold text-ink">
                Nome completo
              </label>
              <input
                id="paciente-nome"
                type="text"
                required
                maxLength={120}
                value={nomeDados}
                onChange={(e) => setNomeDados(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-ink"
              />
            </div>

            <div>
              <label htmlFor="paciente-email" className="block text-xs font-semibold text-ink">
                E-mail
              </label>
              <input
                id="paciente-email"
                type="email"
                required
                maxLength={160}
                value={emailDados}
                onChange={(e) => setEmailDados(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-ink"
              />
            </div>

            <div>
              <label htmlFor="paciente-telefone" className="block text-xs font-semibold text-ink">
                Telefone / WhatsApp
              </label>
              <input
                id="paciente-telefone"
                type="tel"
                required
                maxLength={40}
                value={telefoneDados}
                onChange={(e) => setTelefoneDados(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-ink"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="min-h-11 w-full rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand"
            >
              {isPending ? "Salvando..." : "Salvar Alterações"}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
