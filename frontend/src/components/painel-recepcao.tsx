"use client"

import type { AcaoHistorico, SituacaoAtendimento } from "@sgc/backend/domain"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import {
  acaoAgendarConsulta,
  acaoAlterarSituacaoAtendimento,
  acaoCadastrarPacienteRecepcao,
  acaoCancelarConsulta,
  acaoConfirmarPresenca,
  acaoConsultarHorariosDisponiveis,
  acaoRemarcarConsulta,
} from "@/app/acoes"
import { BadgePresenca, BadgeSituacao } from "@/components/badge-situacao"
import { CalendarioAgenda, diasDaGrade } from "@/components/calendario-agenda"
import {
  formatarDataCurtaClinica,
  formatarDataHoraClinica,
  formatarHorarioClinica,
  formatarIntervaloHorarioClinica,
  METADADOS_SITUACAO,
  ROTULO_ACAO_HISTORICO,
} from "@/lib/formatadores"

export type HistoricoDTO = {
  acao: AcaoHistorico
  autorId: string
  momentoISO: string
  situacaoAnterior: SituacaoAtendimento | null
  situacaoNova: SituacaoAtendimento
  motivo: string | null
  horario: {
    inicioAnteriorISO: string
    fimAnteriorISO: string
    inicioNovoISO: string
    fimNovoISO: string
  } | null
}

export type AgendamentoRecepcaoDTO = {
  id: string
  pacienteId: string
  pacienteNome: string
  pacienteTelefone: string
  profissionalId: string
  profissionalNome: string
  profissionalEspecialidade: string
  servicoId: string
  servicoNome: string
  duracaoMinutos: number
  inicioISO: string
  fimISO: string
  dataCivilISO: string
  situacao: SituacaoAtendimento
  presencaConfirmada: boolean
  motivoCancelamento: string | null
  historico: readonly HistoricoDTO[]
}

export type PacienteRecepcaoDTO = {
  id: string
  nome: string
  email: string | null
  telefone: string
  possuiConta: boolean
}

export type ProfissionalRecepcaoDTO = {
  id: string
  nome: string
  especialidade: string
  ativo: boolean
}

export type ServicoRecepcaoDTO = {
  id: string
  nome: string
  duracaoMinutos: number
  disponivelParaAutoagendamento: boolean
  profissionaisHabilitados: string[]
}

export function PainelRecepcao({
  agendamentos,
  pacientes,
  profissionais,
  servicos,
  dataHojeISO,
  dataPadraoReservaISO,
}: {
  agendamentos: readonly AgendamentoRecepcaoDTO[]
  pacientes: readonly PacienteRecepcaoDTO[]
  profissionais: readonly ProfissionalRecepcaoDTO[]
  servicos: readonly ServicoRecepcaoDTO[]
  dataHojeISO: string
  dataPadraoReservaISO: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [abaAtiva, setAbaAtiva] = useState<"agenda" | "novo_agendamento" | "pacientes">("agenda")

  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const [modoVisao, setModoVisao] = useState<"semanal" | "diaria">("semanal")
  const [filtroDataISO, setFiltroDataISO] = useState(dataHojeISO)
  const [ancoraSemanaISO, setAncoraSemanaISO] = useState(dataHojeISO)
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [filtroProfissionalId, setFiltroProfissionalId] = useState<string>("todos")
  const [filtroSituacao, setFiltroSituacao] = useState<string>("todas")

  const [historicoAbertoId, setHistoricoAbertoId] = useState<string | null>(null)
  const [cancelandoId, setCancelandoId] = useState<string | null>(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState("")
  const [remarcandoId, setRemarcandoId] = useState<string | null>(null)
  const [dataRemarcacaoISO, setDataRemarcacaoISO] = useState(dataPadraoReservaISO)
  const [horariosRemarcacaoISO, setHorariosRemarcacaoISO] = useState<string[]>([])
  const [horarioNovoRemarcacaoISO, setHorarioNovoRemarcacaoISO] = useState("")

  const [pacienteReservaId, setPacienteReservaId] = useState(pacientes[0]?.id ?? "")
  const [servicoReservaId, setServicoReservaId] = useState(servicos[0]?.id ?? "")
  const servicoAtual = servicos.find((s) => s.id === servicoReservaId) ?? servicos[0]
  const profissionaisHabilitados = profissionais.filter(
    (p) => p.ativo && servicoAtual?.profissionaisHabilitados.includes(p.id),
  )
  const [profissionalReservaId, setProfissionalReservaId] = useState(
    profissionaisHabilitados[0]?.id ?? "",
  )
  const [dataReservaISO, setDataReservaISO] = useState(dataPadraoReservaISO)
  const [horariosReservaISO, setHorariosReservaISO] = useState<string[]>([])
  const [horarioReservaEscolhidoISO, setHorarioReservaEscolhidoISO] = useState("")
  const [carregandoHorariosReserva, setCarregandoHorariosReserva] = useState(false)

  const [termoBuscaPaciente, setTermoBuscaPaciente] = useState("")
  const [novoPacienteNome, setNovoPacienteNome] = useState("")
  const [novoPacienteTelefone, setNovoPacienteTelefone] = useState("")
  const [novoPacienteEmail, setNovoPacienteEmail] = useState("")

  useEffect(() => {
    if (abaAtiva !== "novo_agendamento") return
    if (!servicoReservaId || !profissionalReservaId || !dataReservaISO) return
    let ativo = true
    setCarregandoHorariosReserva(true)
    acaoConsultarHorariosDisponiveis({
      servicoId: servicoReservaId,
      profissionalId: profissionalReservaId,
      dataISO: dataReservaISO,
    }).then((res) => {
      if (!ativo) return
      setCarregandoHorariosReserva(false)
      if (res.ok && res.dados) {
        setHorariosReservaISO(res.dados)
        setHorarioReservaEscolhidoISO(res.dados[0] ?? "")
      } else {
        setHorariosReservaISO([])
        setHorarioReservaEscolhidoISO("")
      }
    })
    return () => {
      ativo = false
    }
  }, [abaAtiva, servicoReservaId, profissionalReservaId, dataReservaISO])

  function confirmarPresenca(agendamentoId: string) {
    setErro(null)
    setSucesso(null)
    startTransition(async () => {
      const res = await acaoConfirmarPresenca(agendamentoId)
      if (!res.ok) {
        setErro(res.mensagem)
        return
      }
      setSucesso(res.mensagem)
      router.refresh()
    })
  }

  function mudarSituacao(agendamentoId: string, situacao: SituacaoAtendimento) {
    setErro(null)
    setSucesso(null)
    startTransition(async () => {
      const res = await acaoAlterarSituacaoAtendimento({ agendamentoId, situacao })
      if (!res.ok) {
        setErro(res.mensagem)
        return
      }
      setSucesso(res.mensagem)
      router.refresh()
    })
  }

  function submeterCancelamento(agendamentoId: string) {
    setErro(null)
    setSucesso(null)
    startTransition(async () => {
      const res = await acaoCancelarConsulta({
        agendamentoId,
        motivo: motivoCancelamento,
      })
      if (!res.ok) {
        setErro(res.mensagem)
        return
      }
      setCancelandoId(null)
      setMotivoCancelamento("")
      setSucesso(res.mensagem)
      router.refresh()
    })
  }

  function abrirRemarcacao(consulta: AgendamentoRecepcaoDTO) {
    setCancelandoId(null)
    setRemarcandoId(consulta.id)
    setErro(null)
    setSucesso(null)
    acaoConsultarHorariosDisponiveis({
      profissionalId: consulta.profissionalId,
      servicoId: consulta.servicoId,
      dataISO: dataRemarcacaoISO,
      ignorarAgendamentoId: consulta.id,
    }).then((res) => {
      if (res.ok && res.dados) {
        setHorariosRemarcacaoISO(res.dados)
        setHorarioNovoRemarcacaoISO(res.dados[0] ?? "")
      } else {
        setHorariosRemarcacaoISO([])
        setHorarioNovoRemarcacaoISO("")
      }
    })
  }

  function alterarDataRemarcacao(consulta: AgendamentoRecepcaoDTO, novaDataISO: string) {
    setDataRemarcacaoISO(novaDataISO)
    acaoConsultarHorariosDisponiveis({
      profissionalId: consulta.profissionalId,
      servicoId: consulta.servicoId,
      dataISO: novaDataISO,
      ignorarAgendamentoId: consulta.id,
    }).then((res) => {
      if (res.ok && res.dados) {
        setHorariosRemarcacaoISO(res.dados)
        setHorarioNovoRemarcacaoISO(res.dados[0] ?? "")
      } else {
        setHorariosRemarcacaoISO([])
        setHorarioNovoRemarcacaoISO("")
      }
    })
  }

  function moverPeloCalendario(agendamentoId: string, inicioISO: string) {
    setErro(null)
    setSucesso(null)
    return new Promise<{ ok: boolean }>((resolver) => {
      startTransition(async () => {
        const res = await acaoRemarcarConsulta({ agendamentoId, inicio: inicioISO })
        if (!res.ok) {
          setErro(res.mensagem)
          resolver({ ok: false })
          return
        }
        setSucesso(res.mensagem)
        setSelecionadoId(agendamentoId)
        router.refresh()
        resolver({ ok: true })
      })
    })
  }

  function submeterRemarcacao(agendamentoId: string) {
    setErro(null)
    setSucesso(null)
    if (!horarioNovoRemarcacaoISO) {
      setErro("Selecione um novo horário disponível.")
      return
    }
    startTransition(async () => {
      const res = await acaoRemarcarConsulta({
        agendamentoId,
        inicio: horarioNovoRemarcacaoISO,
      })
      if (!res.ok) {
        setErro(res.mensagem)
        return
      }
      setRemarcandoId(null)
      setSucesso(res.mensagem)
      router.refresh()
    })
  }

  function submeterAgendamentoManual(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setSucesso(null)
    if (!horarioReservaEscolhidoISO) {
      setErro("Selecione um horário livre para realizar o agendamento manual.")
      return
    }
    startTransition(async () => {
      const res = await acaoAgendarConsulta({
        pacienteId: pacienteReservaId,
        profissionalId: profissionalReservaId,
        servicoId: servicoReservaId,
        inicio: horarioReservaEscolhidoISO,
      })
      if (!res.ok) {
        setErro(res.mensagem)
        return
      }
      setSucesso(res.mensagem)
      setAbaAtiva("agenda")
      router.refresh()
    })
  }

  function submeterNovoPaciente(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setSucesso(null)
    startTransition(async () => {
      const res = await acaoCadastrarPacienteRecepcao({
        nome: novoPacienteNome,
        telefone: novoPacienteTelefone,
        email: novoPacienteEmail,
      })
      if (!res.ok) {
        setErro(res.mensagem)
        return
      }
      setNovoPacienteNome("")
      setNovoPacienteTelefone("")
      setNovoPacienteEmail("")
      if (res.dados?.pacienteId) {
        setPacienteReservaId(res.dados.pacienteId)
      }
      setSucesso(res.mensagem)
      router.refresh()
    })
  }

  const qtdAgendados = agendamentos.filter((a) => a.situacao === "agendado").length
  const qtdChegou = agendamentos.filter((a) => a.situacao === "chegou").length
  const qtdSemConfirmacao = agendamentos.filter(
    (a) => a.situacao === "agendado" && !a.presencaConfirmada,
  ).length

  const ancoraGrade = modoVisao === "diaria" ? filtroDataISO : ancoraSemanaISO
  const diasVisiveis = new Set(diasDaGrade(modoVisao, ancoraGrade))
  const agendamentosFiltrados = agendamentos.filter((a) => {
    if (!diasVisiveis.has(a.dataCivilISO)) return false
    if (filtroProfissionalId !== "todos" && a.profissionalId !== filtroProfissionalId) return false
    if (filtroSituacao === "pendente_confirmacao") {
      return a.situacao === "agendado" && !a.presencaConfirmada
    }
    if (filtroSituacao !== "todas" && a.situacao !== filtroSituacao) return false
    return true
  })

  const pacientesFiltrados = pacientes.filter((p) => {
    const q = termoBuscaPaciente.trim().toLowerCase()
    if (!q) return true
    return (
      p.nome.toLowerCase().includes(q) ||
      p.telefone.toLowerCase().includes(q) ||
      (p.email?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div className="space-y-6">
      <div className="module-heading">
        <div>
          <p className="eyebrow">Rotina da clínica</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Recepção
          </h1>
          <p className="text-xs text-muted">
            Confirme presenças, registre chegadas e gerencie encaixes.
          </p>
        </div>

        <div
          role="group"
          aria-label="Módulos da Recepção"
          className="module-tabs"
        >
          <button
            type="button"

            aria-pressed={abaAtiva === "agenda"}
            onClick={() => setAbaAtiva("agenda")}
            className={`min-h-10 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
              abaAtiva === "agenda"
                ? "bg-ink text-white"
                : "text-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            Agenda ({agendamentos.length})
          </button>

          <button
            type="button"

            aria-pressed={abaAtiva === "novo_agendamento"}
            onClick={() => setAbaAtiva("novo_agendamento")}
            className={`min-h-10 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
              abaAtiva === "novo_agendamento"
                ? "bg-ink text-white"
                : "text-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            + Novo Agendamento
          </button>

          <button
            type="button"

            aria-pressed={abaAtiva === "pacientes"}
            onClick={() => setAbaAtiva("pacientes")}
            className={`min-h-10 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
              abaAtiva === "pacientes"
                ? "bg-ink text-white"
                : "text-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            Pacientes ({pacientes.length})
          </button>
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          className="rounded-xl border border-[#F1B2C0] bg-[#FBE9ED] px-4 py-3 text-sm font-semibold text-[#8A0D29]"
        >
          {erro}
        </div>
      )}

      {sucesso && (
        <div
          role="status"
          className="rounded-xl border border-[#9ED9B8] bg-[#E5F5EC] px-4 py-3 text-sm font-semibold text-[#00522B]"
        >
          {sucesso}
        </div>
      )}

      {abaAtiva === "agenda" && (
        <section aria-label="Agenda operacional" className="space-y-4">
          {/* 4 Quick Status Filter Cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => {
                setModoVisao("semanal")
                setFiltroSituacao("todas")
              }}
              className={`rounded-xl border p-4 text-left transition-colors ${
                filtroSituacao === "todas"
                  ? "border-2 border-ink bg-white "
                  : "border-line bg-white hover:border-ink"
              }`}
            >
              <span className="block text-xs font-semibold text-muted">Todas</span>
              <span className="mt-1 block text-2xl font-semibold text-ink tabular-nums">
                {agendamentos.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModoVisao("semanal")
                setFiltroSituacao("chegou")
              }}
              className={`rounded-xl border p-4 text-left transition-colors ${
                filtroSituacao === "chegou"
                  ? "border-2 border-[#7A3900] bg-[#FFF3E5]/50 "
                  : "border-line bg-white hover:border-[#7A3900]"
              }`}
            >
              <span className="block text-xs font-semibold text-[#7A3900]">Na recepção</span>
              <span className="mt-1 block text-2xl font-semibold text-[#7A3900] tabular-nums">
                {qtdChegou}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModoVisao("semanal")
                setFiltroSituacao("pendente_confirmacao")
              }}
              className={`rounded-xl border p-4 text-left transition-colors ${
                filtroSituacao === "pendente_confirmacao"
                  ? "border-2 border-brand bg-soft/50 "
                  : "border-line bg-white hover:border-brand"
              }`}
            >
              <span className="block text-xs font-semibold text-brand">Sem confirmação</span>
              <span className="mt-1 block text-2xl font-semibold text-ink tabular-nums">
                {qtdSemConfirmacao}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModoVisao("semanal")
                setFiltroSituacao("agendado")
              }}
              className={`rounded-xl border p-4 text-left transition-colors ${
                filtroSituacao === "agendado"
                  ? "border-2 border-ink bg-soft/50 "
                  : "border-line bg-white hover:border-ink"
              }`}
            >
              <span className="block text-xs font-semibold text-ink">Aguardando chegada</span>
              <span className="mt-1 block text-2xl font-semibold text-ink tabular-nums">
                {qtdAgendados}
              </span>
            </button>
          </div>

          {/* Slim Single-Row Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-canvas p-1">
                <button
                  type="button"
                  aria-pressed={modoVisao === "semanal"}
                  onClick={() => setModoVisao("semanal")}
                  className={`min-h-8 rounded-lg px-3 py-1 text-xs font-semibold ${
                    modoVisao === "semanal"
                      ? "bg-ink text-white"
                      : "text-muted"
                  }`}
                >
                  Semana
                </button>
                <button
                  type="button"
                  aria-pressed={modoVisao === "diaria"}
                  onClick={() => setModoVisao("diaria")}
                  className={`min-h-8 rounded-lg px-3 py-1 text-xs font-semibold ${
                    modoVisao === "diaria"
                      ? "bg-ink text-white"
                      : "text-muted"
                  }`}
                >
                  Dia
                </button>
              </div>

              {modoVisao === "diaria" && (
                <input
                  id="filtro-data-recepcao"
                  aria-label="Data da agenda"
                  type="date"
                  value={filtroDataISO}
                  onChange={(e) => setFiltroDataISO(e.target.value)}
                  className="min-h-9 rounded-xl border border-input bg-white px-3 py-1 text-xs font-semibold text-ink"
                />
              )}

              <select
                id="filtro-profissional-recepcao"
                aria-label="Filtrar por especialista"
                value={filtroProfissionalId}
                onChange={(e) => setFiltroProfissionalId(e.target.value)}
                className="min-h-9 rounded-xl border border-input bg-white px-3 py-1 text-xs font-semibold text-ink"
              >
                <option value="todos">Todos os especialistas</option>
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} {!p.ativo ? "(Inativo)" : ""}
                  </option>
                ))}
              </select>

              <select
                id="filtro-situacao-recepcao"
                aria-label="Filtrar por situação"
                value={filtroSituacao}
                onChange={(e) => setFiltroSituacao(e.target.value)}
                className="min-h-9 rounded-xl border border-input bg-white px-3 py-1 text-xs font-semibold text-ink"
              >
                <option value="todas">Todas as situações</option>
                <option value="pendente_confirmacao">Sem confirmação</option>
                <option value="agendado">Agendado</option>
                <option value="chegou">Na recepção</option>
                <option value="em_atendimento">Em atendimento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
                <option value="falta">Falta</option>
              </select>
            </div>

            <span className="text-xs font-semibold text-muted tabular-nums">
              {agendamentosFiltrados.length} consulta(s)
            </span>
          </div>

          <CalendarioAgenda
            modo={modoVisao}
            ancoraISO={ancoraGrade}
            dataHojeISO={dataHojeISO}
            movendo={isPending}
            selecionadoId={selecionadoId}
            eventos={agendamentosFiltrados.map((consulta) => ({
              id: consulta.id,
              titulo: consulta.pacienteNome,
              detalhe: consulta.profissionalNome,
              profissionalId: consulta.profissionalId,
              inicioISO: consulta.inicioISO,
              fimISO: consulta.fimISO,
              situacao: consulta.situacao,
              podeArrastar: consulta.situacao === "agendado",
            }))}
            onMudarAncora={(iso) => {
              if (modoVisao === "diaria") setFiltroDataISO(iso)
              else setAncoraSemanaISO(iso)
            }}
            onSelecionar={(id) => {
              setSelecionadoId(id)
              document.getElementById(`consulta-${id}`)?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
              })
            }}
            onMover={moverPeloCalendario}
          />

          {/* Appointment Cards */}
          {agendamentosFiltrados.length === 0 ? (
            <div className="rounded-xl border border-line bg-white p-6 text-sm text-muted">
              Nenhuma consulta encontrada para este filtro.{" "}
              <button
                type="button"
                onClick={() => {
                  setModoVisao("semanal")
                  setFiltroProfissionalId("todos")
                  setFiltroSituacao("todas")
                }}
                className="font-semibold text-brand underline"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {agendamentosFiltrados.map((consulta) => {
                const inicio = new Date(consulta.inicioISO)
                const fim = new Date(consulta.fimISO)
                const podeConfirmar =
                  !consulta.presencaConfirmada &&
                  (consulta.situacao === "agendado" || consulta.situacao === "chegou")
                const podeRegistrarChegada = consulta.situacao === "agendado"
                const podeRegistrarFalta =
                  consulta.situacao === "agendado" || consulta.situacao === "chegou"
                const podeRemarcar = consulta.situacao === "agendado"
                const podeCancelar =
                  consulta.situacao === "agendado" || consulta.situacao === "chegou"
                const historicoAberto = historicoAbertoId === consulta.id

                return (
                  <article
                    key={consulta.id}
                    id={`consulta-${consulta.id}`}
                    className={`rounded-xl border bg-white p-4 sm:p-5 ${
                      selecionadoId === consulta.id
                        ? "border-brand ring-2 ring-brand"
                        : "border-line"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-ink px-2.5 py-0.5 text-xs font-semibold text-white tabular-nums">
                            {formatarDataCurtaClinica(inicio)} •{" "}
                            {formatarIntervaloHorarioClinica(inicio, fim)}
                          </span>
                          <BadgeSituacao situacao={consulta.situacao} />
                          <BadgePresenca confirmada={consulta.presencaConfirmada} />
                        </div>

                        <h3 className="pt-1 text-base font-semibold text-ink">
                          {consulta.pacienteNome}{" "}
                          <span className="text-xs font-medium text-muted">
                            • {consulta.pacienteTelefone}
                          </span>
                        </h3>

                        <p className="text-xs text-muted">
                          <strong>{consulta.servicoNome}</strong> ({consulta.duracaoMinutos}m) com{" "}
                          <strong className="text-ink">{consulta.profissionalNome}</strong>
                        </p>

                        {consulta.motivoCancelamento && (
                          <p className="text-xs font-semibold text-[#8A0D29]">
                            Cancelamento: {consulta.motivoCancelamento}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {podeConfirmar && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => confirmarPresenca(consulta.id)}
                            className="min-h-10 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white hover:bg-ink"
                          >
                            ✓ Confirmar
                          </button>
                        )}

                        {podeRegistrarChegada && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => mudarSituacao(consulta.id, "chegou")}
                            className="min-h-10 rounded-xl bg-[#006938] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#00522B]"
                          >
                            Chegou
                          </button>
                        )}

                        {podeRemarcar && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => abrirRemarcacao(consulta)}
                            className="min-h-10 rounded-xl border border-input bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-canvas"
                          >
                            Remarcar
                          </button>
                        )}

                        {podeRegistrarFalta && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => mudarSituacao(consulta.id, "falta")}
                            className="min-h-10 rounded-xl border border-[#F5C896] bg-[#FFF3E5] px-3 py-2 text-xs font-semibold text-[#7A3900] hover:bg-[#FFE4C4]"
                          >
                            Falta
                          </button>
                        )}

                        {podeCancelar && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              setRemarcandoId(null)
                              setCancelandoId(consulta.id)
                              setMotivoCancelamento("")
                            }}
                            className="min-h-10 rounded-xl border border-[#F1B2C0] bg-white px-3 py-2 text-xs font-semibold text-[#8A0D29] hover:bg-[#FBE9ED]"
                          >
                            Cancelar
                          </button>
                        )}

                        <button
                          type="button"
                          aria-expanded={historicoAberto}
                          onClick={() =>
                            setHistoricoAbertoId(historicoAberto ? null : consulta.id)
                          }
                          className="min-h-10 rounded-xl bg-canvas px-3 py-2 text-xs font-semibold text-muted hover:bg-line"
                        >
                          Histórico ({consulta.historico.length})
                        </button>
                      </div>
                    </div>

                    {remarcandoId === consulta.id && (
                      <div className="mt-3 rounded-xl border border-input bg-soft/50 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor={`rec-remarcar-data-${consulta.id}`}
                              className="block text-xs font-semibold text-ink"
                            >
                              Nova data
                            </label>
                            <input
                              id={`rec-remarcar-data-${consulta.id}`}
                              type="date"
                              value={dataRemarcacaoISO}
                              onChange={(e) => alterarDataRemarcacao(consulta, e.target.value)}
                              className="mt-1 min-h-10 w-full rounded-lg border border-input bg-white px-3 py-1.5 text-xs font-semibold text-ink"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`rec-remarcar-hora-${consulta.id}`}
                              className="block text-xs font-semibold text-ink"
                            >
                              Novo horário
                            </label>
                            {horariosRemarcacaoISO.length === 0 ? (
                              <p className="mt-2 text-xs font-semibold text-[#8A0D29]">
                                Sem horários livres nesta data.
                              </p>
                            ) : (
                              <select
                                id={`rec-remarcar-hora-${consulta.id}`}
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
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={isPending || !horarioNovoRemarcacaoISO}
                            onClick={() => submeterRemarcacao(consulta.id)}
                            className="min-h-9 rounded-lg bg-ink px-4 py-1.5 text-xs font-semibold text-white"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemarcandoId(null)}
                            className="min-h-9 rounded-lg border border-input bg-white px-3 py-1.5 text-xs font-semibold text-muted"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    )}

                    {cancelandoId === consulta.id && (
                      <div className="mt-3 rounded-xl border border-[#F1B2C0] bg-[#FBE9ED]/60 p-4">
                        <label
                          htmlFor={`rec-cancelar-motivo-${consulta.id}`}
                          className="block text-xs font-semibold text-[#8A0D29]"
                        >
                          Motivo do cancelamento
                        </label>
                        <input
                          id={`rec-cancelar-motivo-${consulta.id}`}
                          type="text"
                          maxLength={200}
                          value={motivoCancelamento}
                          onChange={(e) => setMotivoCancelamento(e.target.value)}
                          placeholder="Ex.: Solicitação do paciente por telefone"
                          className="mt-1 min-h-10 w-full rounded-lg border border-[#F1B2C0] bg-white px-3 py-1.5 text-xs text-ink"
                        />
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={isPending || motivoCancelamento.trim().length === 0}
                            onClick={() => submeterCancelamento(consulta.id)}
                            className="min-h-9 rounded-lg bg-[#D7153A] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancelandoId(null)}
                            className="min-h-9 rounded-lg border border-input bg-white px-3 py-1.5 text-xs font-semibold text-muted"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    )}

                    {historicoAberto && (
                      <div className="mt-3 rounded-xl bg-canvas p-3.5">
                        <ol className="space-y-1.5 text-xs text-ink">
                          {consulta.historico.map((h, i) => (
                            <li
                              key={`${h.momentoISO}-${i}`}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2"
                            >
                              <span>
                                <strong>{ROTULO_ACAO_HISTORICO[h.acao]}</strong>:{" "}
                                {h.situacaoAnterior
                                  ? `${METADADOS_SITUACAO[h.situacaoAnterior].rotulo} → `
                                  : ""}
                                {METADADOS_SITUACAO[h.situacaoNova].rotulo}
                                {h.motivo ? ` (${h.motivo})` : ""}
                              </span>
                              <span className="text-[11px] text-muted tabular-nums">
                                {formatarDataHoraClinica(new Date(h.momentoISO))}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {abaAtiva === "novo_agendamento" && (
        <section
          aria-labelledby="titulo-agendamento-manual"
          className="max-w-xl rounded-xl border border-line bg-white p-6"
        >
          <h2 id="titulo-agendamento-manual" className="text-base font-semibold text-ink">
            Novo Agendamento Manual
          </h2>
          <p className="mt-1 text-xs text-muted">
            Inclui avaliações e procedimentos exclusivos da recepção (restaurações e retornos).
          </p>

          <form onSubmit={submeterAgendamentoManual} className="mt-4 space-y-4">
            <div>
              <label htmlFor="manual-paciente" className="block text-xs font-semibold text-ink">
                Paciente
              </label>
              <select
                id="manual-paciente"
                value={pacienteReservaId}
                onChange={(e) => setPacienteReservaId(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-ink"
              >
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.telefone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="manual-servico" className="block text-xs font-semibold text-ink">
                Procedimento
              </label>
              <select
                id="manual-servico"
                value={servicoReservaId}
                onChange={(e) => {
                  const id = e.target.value
                  setServicoReservaId(id)
                  const serv = servicos.find((s) => s.id === id)
                  if (serv && !serv.profissionaisHabilitados.includes(profissionalReservaId)) {
                    const hab = profissionais.find(
                      (p) => p.ativo && serv.profissionaisHabilitados.includes(p.id),
                    )
                    setProfissionalReservaId(hab?.id ?? "")
                  }
                }}
                className="mt-1 min-h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-ink"
              >
                {servicos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} ({s.duracaoMinutos} min)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="manual-profissional"
                  className="block text-xs font-semibold text-ink"
                >
                  Especialista
                </label>
                <select
                  id="manual-profissional"
                  value={profissionalReservaId}
                  onChange={(e) => setProfissionalReservaId(e.target.value)}
                  className="mt-1 min-h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-ink"
                >
                  {profissionaisHabilitados.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="manual-data" className="block text-xs font-semibold text-ink">
                  Data
                </label>
                <input
                  id="manual-data"
                  type="date"
                  value={dataReservaISO}
                  onChange={(e) => setDataReservaISO(e.target.value)}
                  className="mt-1 min-h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-ink"
                />
              </div>
            </div>

            <div>
              <label htmlFor="manual-horario" className="block text-xs font-semibold text-ink">
                Horário livre
              </label>
              {carregandoHorariosReserva ? (
                <p className="mt-2 text-xs text-muted">Consultando...</p>
              ) : horariosReservaISO.length === 0 ? (
                <p className="mt-2 rounded-xl bg-[#FFF3E5] p-3 text-xs font-semibold text-[#7A3900]">
                  Sem horários livres nesta data.
                </p>
              ) : (
                <select
                  id="manual-horario"
                  value={horarioReservaEscolhidoISO}
                  onChange={(e) => setHorarioReservaEscolhidoISO(e.target.value)}
                  className="mt-1 min-h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-ink"
                >
                  {horariosReservaISO.map((iso) => (
                    <option key={iso} value={iso}>
                      {formatarHorarioClinica(new Date(iso))} (
                      {formatarDataCurtaClinica(new Date(iso))})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending || !horarioReservaEscolhidoISO}
              className="min-h-11 w-full rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand disabled:opacity-50"
            >
              {isPending ? "Reservando..." : "Confirmar Agendamento"}
            </button>
          </form>
        </section>
      )}

      {abaAtiva === "pacientes" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <section
            aria-labelledby="titulo-lista-pacientes"
            className="space-y-4 rounded-xl border border-line bg-white p-6 lg:col-span-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="titulo-lista-pacientes" className="text-base font-semibold text-ink">
                Pacientes Cadastrados ({pacientes.length})
              </h2>
              <input
                id="busca-paciente-recepcao"
                aria-label="Buscar paciente"
                type="search"
                value={termoBuscaPaciente}
                onChange={(e) => setTermoBuscaPaciente(e.target.value)}
                placeholder="Buscar nome ou telefone..."
                className="min-h-9 rounded-xl border border-input bg-canvas px-3 py-1.5 text-xs text-ink"
              />
            </div>

            <ul className="divide-y divide-line">
              {pacientesFiltrados.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{p.nome}</p>
                    <p className="text-xs text-muted">
                      {p.telefone} {p.email ? `• ${p.email}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPacienteReservaId(p.id)
                      setAbaAtiva("novo_agendamento")
                    }}
                    className="min-h-9 rounded-xl bg-soft px-3 py-1.5 text-xs font-semibold text-ink hover:bg-brand hover:text-white"
                  >
                    Agendar →
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="titulo-novo-paciente-recepcao"
            className="rounded-xl border border-line bg-white p-6 lg:col-span-5"
          >
            <h2 id="titulo-novo-paciente-recepcao" className="text-base font-semibold text-ink">
              Novo Paciente (Balcão/Telefone)
            </h2>

            <form onSubmit={submeterNovoPaciente} className="mt-4 space-y-3.5">
              <div>
                <label htmlFor="rec-novo-nome" className="block text-xs font-semibold text-ink">
                  Nome completo
                </label>
                <input
                  id="rec-novo-nome"
                  type="text"
                  required
                  maxLength={120}
                  value={novoPacienteNome}
                  onChange={(e) => setNovoPacienteNome(e.target.value)}
                  placeholder="Ex.: Roberto Nascimento"
                  className="mt-1 min-h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-ink"
                />
              </div>

              <div>
                <label
                  htmlFor="rec-novo-telefone"
                  className="block text-xs font-semibold text-ink"
                >
                  Telefone
                </label>
                <input
                  id="rec-novo-telefone"
                  type="tel"
                  required
                  maxLength={40}
                  value={novoPacienteTelefone}
                  onChange={(e) => setNovoPacienteTelefone(e.target.value)}
                  placeholder="Ex.: (11) 90000-5566"
                  className="mt-1 min-h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-ink"
                />
              </div>

              <div>
                <label htmlFor="rec-novo-email" className="block text-xs font-semibold text-ink">
                  E-mail (opcional)
                </label>
                <input
                  id="rec-novo-email"
                  type="email"
                  maxLength={160}
                  value={novoPacienteEmail}
                  onChange={(e) => setNovoPacienteEmail(e.target.value)}
                  placeholder="Ex.: roberto@exemplo.invalid"
                  className="mt-1 min-h-10 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-ink"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="min-h-11 w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand"
              >
                {isPending ? "Cadastrando..." : "Salvar Paciente"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
