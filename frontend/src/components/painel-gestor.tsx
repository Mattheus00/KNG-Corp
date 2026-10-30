"use client"

import type { Indicadores, Papel, SituacaoAtendimento } from "@sgc/backend/domain"
import { usePathname, useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  acaoAdicionarBloqueio,
  acaoAlterarStatusFuncionario,
  acaoAtualizarExpediente,
  acaoConvidarFuncionario,
  acaoRemoverBloqueio,
  acaoSalvarServico,
} from "@/app/acoes"
import { BadgePresenca, BadgeSituacao } from "@/components/badge-situacao"
import {
  formatarDataCurtaClinica,
  formatarDataHoraClinica,
  formatarIntervaloHorarioClinica,
  formatarTaxaIndicador,
  METADADOS_SITUACAO,
  ROTULO_PAPEL,
} from "@/lib/formatadores"

export type ConsultaGestorDTO = {
  id: string
  pacienteNome: string
  pacienteTelefone: string
  profissionalId: string
  profissionalNome: string
  servicoNome: string
  inicioISO: string
  fimISO: string
  situacao: SituacaoAtendimento
  presencaConfirmada: boolean
}

export type FuncionarioGestorDTO = {
  id: string
  nome: string
  email: string
  papeis: readonly Papel[]
  profissionalId: string | null
  ativo: boolean
  convitePendente: boolean
}

export type ProfissionalGestorDTO = {
  id: string
  nome: string
  especialidade: string
  ativo: boolean
  aberturaHora: number
  fechamentoHora: number
}

export type ServicoGestorDTO = {
  id: string
  nome: string
  descricao: string
  duracaoMinutos: number
  indicacaoPreco: string
  disponivelParaAutoagendamento: boolean
  profissionaisHabilitados: readonly string[]
}

export type BloqueioGestorDTO = {
  id: string
  profissionalId: string
  profissionalNome: string
  motivo: string
  inicioISO: string
  fimISO: string
}

export function PainelGestor({
  indicadores,
  periodoInicioISO,
  periodoFimISO,
  diasFiltroAtual,
  profissionalFiltroAtual,
  proximasConsultas,
  consultasProfissionaisInativos,
  consultasSemConfirmacao,
  funcionarios,
  profissionais,
  servicos,
  bloqueios,
  dataPadraoBloqueioISO,
  mostrarPrimeirosPassos = false,
}: {
  indicadores: Indicadores
  periodoInicioISO: string
  periodoFimISO: string
  diasFiltroAtual: number
  profissionalFiltroAtual: string
  proximasConsultas: readonly ConsultaGestorDTO[]
  consultasProfissionaisInativos: readonly ConsultaGestorDTO[]
  consultasSemConfirmacao: readonly ConsultaGestorDTO[]
  funcionarios: readonly FuncionarioGestorDTO[]
  profissionais: readonly ProfissionalGestorDTO[]
  servicos: readonly ServicoGestorDTO[]
  bloqueios: readonly BloqueioGestorDTO[]
  dataPadraoBloqueioISO: string
  mostrarPrimeirosPassos?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [abaAtiva, setAbaAtiva] = useState<
    "dashboard" | "equipe" | "servicos" | "expediente"
  >("dashboard")

  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [afetadasRecentes, setAfetadasRecentes] = useState<
    Array<{ id: string; pacienteNome: string; servicoNome: string; inicioISO: string }>
  >([])

  const [conviteNome, setConviteNome] = useState("")
  const [conviteEmail, setConviteEmail] = useState("")
  const [convitePapeis, setConvitePapeis] = useState<Papel[]>(["recepcao"])
  const [conviteEspecialidade, setConviteEspecialidade] = useState("")

  const [servicoNome, setServicoNome] = useState("")
  const [servicoDescricao, setServicoDescricao] = useState("")
  const [servicoDuracao, setServicoDuracao] = useState(60)
  const [servicoIndicacaoPreco, setServicoIndicacaoPreco] = useState(
    "Definido presencialmente após avaliação clínica. Sem cobrança online.",
  )
  const [servicoAutoagendamento, setServicoAutoagendamento] = useState(false)
  const [servicoProfissionais, setServicoProfissionais] = useState<string[]>(
    profissionais.map((p) => p.id),
  )

  const [bloqProfissionalId, setBloqProfissionalId] = useState(profissionais[0]?.id ?? "")
  const [bloqDataISO, setBloqDataISO] = useState(dataPadraoBloqueioISO)
  const [bloqHoraInicio, setBloqHoraInicio] = useState(14)
  const [bloqHoraFim, setBloqHoraFim] = useState(16)
  const [bloqMotivo, setBloqMotivo] = useState("")

  function aplicarFiltroDashboard(novosDias: number, novoProfissionalId: string) {
    const params = new URLSearchParams()
    params.set("dias", String(novosDias))
    if (novoProfissionalId && novoProfissionalId !== "todos") {
      params.set("profissional", novoProfissionalId)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function alternarPapelConvite(papel: Papel) {
    setConvitePapeis((atual) =>
      atual.includes(papel) ? atual.filter((p) => p !== papel) : [...atual, papel],
    )
  }

  function submeterConvite(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setSucesso(null)
    startTransition(async () => {
      const res = await acaoConvidarFuncionario({
        nome: conviteNome,
        email: conviteEmail,
        papeis: convitePapeis,
        especialidade: conviteEspecialidade,
      })
      if (!res.ok) {
        setErro(res.mensagem)
        return
      }
      setConviteNome("")
      setConviteEmail("")
      setConviteEspecialidade("")
      setSucesso(res.mensagem)
      router.refresh()
    })
  }

  function alternarAtivacaoFuncionario(funcionarioId: string, novoAtivo: boolean) {
    setErro(null)
    setSucesso(null)
    startTransition(async () => {
      const res = await acaoAlterarStatusFuncionario({
        funcionarioId,
        ativo: novoAtivo,
      })
      if (!res.ok) {
        setErro(res.mensagem)
        return
      }
      setSucesso(res.mensagem)
      setAfetadasRecentes(res.dados?.afetadas ?? [])
      router.refresh()
    })
  }

  function submeterNovoServico(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setSucesso(null)
    startTransition(async () => {
      const res = await acaoSalvarServico({
        nome: servicoNome,
        descricao: servicoDescricao,
        duracaoMinutos: Number(servicoDuracao),
        indicacaoPreco: servicoIndicacaoPreco,
        disponivelParaAutoagendamento: servicoAutoagendamento,
        profissionaisHabilitados: servicoProfissionais,
      })
      if (!res.ok) {
        setErro(res.mensagem)
        return
      }
      setServicoNome("")
      setServicoDescricao("")
      setSucesso(res.mensagem)
      router.refresh()
    })
  }

  function salvarExpedienteProfissional(
    profissionalId: string,
    aberturaHora: number,
    fechamentoHora: number,
  ) {
    setErro(null)
    setSucesso(null)
    startTransition(async () => {
      const res = await acaoAtualizarExpediente({
        profissionalId,
        aberturaHora,
        fechamentoHora,
      })
      if (!res.ok) {
        setErro(res.mensagem)
        return
      }
      setSucesso(res.mensagem)
      router.refresh()
    })
  }

  function submeterBloqueio(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setSucesso(null)
    startTransition(async () => {
      const res = await acaoAdicionarBloqueio({
        profissionalId: bloqProfissionalId,
        dataISO: bloqDataISO,
        horaInicio: Number(bloqHoraInicio),
        horaFim: Number(bloqHoraFim),
        motivo: bloqMotivo,
      })
      if (!res.ok) {
        setErro(res.mensagem)
        return
      }
      setBloqMotivo("")
      setSucesso(res.mensagem)
      router.refresh()
    })
  }

  function removerBloqueio(bloqueioId: string) {
    setErro(null)
    setSucesso(null)
    startTransition(async () => {
      const res = await acaoRemoverBloqueio(bloqueioId)
      if (!res.ok) {
        setErro(res.mensagem)
        return
      }
      setSucesso(res.mensagem)
      router.refresh()
    })
  }

  const taxaFaltasFmt = formatarTaxaIndicador(indicadores.taxaFaltas)
  const ocupacaoFmt = formatarTaxaIndicador(indicadores.ocupacaoPlanejada)
  const totalPrevistas = Object.values(indicadores.consultasPrevistas).reduce(
    (soma, n) => soma + n,
    0,
  )
  const mapaNomesServicos = new Map(servicos.map((s) => [s.id, s.nome]))

  return (
    <div className="space-y-6">
      <div className="module-heading">
        <div>
          <p className="eyebrow">Visão da operação</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Gestão da Clínica
          </h1>
          <p className="text-sm text-muted">
            Uma visão clara da sua clínica. Acompanhe resultados e organize a operação.
          </p>
        </div>

        <div
          role="group"
          aria-label="Módulos de Gestão"
          className="module-tabs"
        >
          <button
            type="button"

            aria-pressed={abaAtiva === "dashboard"}
            onClick={() => setAbaAtiva("dashboard")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              abaAtiva === "dashboard"
                ? "bg-ink text-white "
                : "text-muted hover:bg-soft hover:text-ink"
            }`}
          >
            Indicadores
          </button>

          <button
            type="button"

            aria-pressed={abaAtiva === "equipe"}
            onClick={() => setAbaAtiva("equipe")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              abaAtiva === "equipe"
                ? "bg-ink text-white "
                : "text-muted hover:bg-soft hover:text-ink"
            }`}
          >
            Equipe ({funcionarios.length})
          </button>

          <button
            type="button"

            aria-pressed={abaAtiva === "servicos"}
            onClick={() => setAbaAtiva("servicos")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              abaAtiva === "servicos"
                ? "bg-ink text-white "
                : "text-muted hover:bg-soft hover:text-ink"
            }`}
          >
            Serviços ({servicos.length})
          </button>

          <button
            type="button"

            aria-pressed={abaAtiva === "expediente"}
            onClick={() => setAbaAtiva("expediente")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              abaAtiva === "expediente"
                ? "bg-ink text-white "
                : "text-muted hover:bg-soft hover:text-ink"
            }`}
          >
            Expediente ({bloqueios.length})
          </button>
        </div>
      </div>

      {mostrarPrimeirosPassos && (
        <section
          aria-labelledby="titulo-primeiros-passos"
          className="rounded-xl border border-input bg-soft px-4 py-4"
        >
          <h2 id="titulo-primeiros-passos" className="text-sm font-semibold text-ink">
            Primeiros passos desta clínica
          </h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink">
            <li>Cadastre um profissional na aba Equipe, com o papel de dentista.</li>
            <li>Cadastre um serviço e marque quem pode realizá-lo.</li>
            <li>Confira o expediente. Depois convide a recepção para abrir a agenda.</li>
          </ol>
        </section>
      )}

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

      {/* Alerta se houver consultas futuras de profissionais desativados */}
      {(consultasProfissionaisInativos.length > 0 || afetadasRecentes.length > 0) && (
        <section
          aria-labelledby="titulo-alerta-desativacao"
          className="rounded-xl border border-[#F6C892] bg-[#FFF4E5] p-5 text-ink"
        >
          <h2 id="titulo-alerta-desativacao" className="text-sm font-semibold text-[#7A3900]">
            Remarcação necessária — Profissional desativado
          </h2>
          <p className="mt-1 text-xs text-[#7A3900]">
            As consultas futuras abaixo precisam ser remarcadas pela recepção:
          </p>
          <ul className="mt-3 space-y-2 text-xs font-semibold text-ink">
            {consultasProfissionaisInativos.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-[#F6C892] bg-white px-3.5 py-2.5"
              >
                {c.pacienteNome} • {c.servicoNome} • {c.profissionalNome} •{" "}
                <span className="font-sans">{formatarDataHoraClinica(new Date(c.inicioISO))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {abaAtiva === "dashboard" && (
        <div className="space-y-6">
          {/* Compact Filter Bar */}
          <section
            aria-labelledby="titulo-filtros-dashboard"
            className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-white p-4 sm:flex-row sm:items-center sm:px-5"
          >
            <div>
              <h2 id="titulo-filtros-dashboard" className="text-sm font-semibold text-ink">
                Período: {formatarDataCurtaClinica(new Date(periodoInicioISO))} até{" "}
                {formatarDataCurtaClinica(new Date(periodoFimISO))}
              </h2>
              <p className="text-xs text-muted">
                Ocupação mede minutos reservados vs. expediente disponível.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                id="dash-periodo"
                aria-label="Janela do período"
                value={diasFiltroAtual}
                onChange={(e) =>
                  aplicarFiltroDashboard(Number(e.target.value), profissionalFiltroAtual)
                }
                className="rounded-xl border border-input bg-canvas px-3 py-2 text-xs font-semibold text-ink focus:border-brand focus:bg-white focus:outline-none"
              >
                <option value={3}>Curto (Ontem, Hoje e Amanhã)</option>
                <option value={7}>7 dias</option>
                <option value={14}>14 dias</option>
                <option value={30}>30 dias</option>
              </select>

              <select
                id="dash-profissional"
                aria-label="Especialista"
                value={profissionalFiltroAtual}
                onChange={(e) =>
                  aplicarFiltroDashboard(diasFiltroAtual, e.target.value)
                }
                className="rounded-xl border border-input bg-canvas px-3 py-2 text-xs font-semibold text-ink focus:border-brand focus:bg-white focus:outline-none"
              >
                <option value="todos">Todos os especialistas</option>
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* 4 Rounded KPI Cards */}
          <section
            aria-label="Indicadores principais do período"
            className="kpi-grid"
          >
            <article className="flex flex-col justify-between rounded-xl border border-line bg-white p-5">
              <div>
                <h3 className="text-xs font-semibold text-muted">Consultas previstas</h3>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-ink tabular-nums">
                  {totalPrevistas}
                </p>
              </div>
              <p className="mt-4 text-xs text-muted tabular-nums">
                Agendadas: <strong>{indicadores.consultasPrevistas.agendado}</strong> • Na recepção:{" "}
                <strong>{indicadores.consultasPrevistas.chegou}</strong>
              </p>
            </article>

            <article className="flex flex-col justify-between rounded-xl border border-line bg-white p-5">
              <div>
                <h3 className="text-xs font-semibold text-muted">Atendimentos concluídos</h3>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-[#00522B] tabular-nums">
                  {indicadores.atendimentosConcluidos}
                </p>
              </div>
              <p className="mt-4 text-xs text-muted">
                Finalizados em consultório na janela.
              </p>
            </article>

            <article className="flex flex-col justify-between rounded-xl border border-line bg-white p-5">
              <div>
                <h3 className="text-xs font-semibold text-muted">Taxa de faltas</h3>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-ink tabular-nums">
                  {taxaFaltasFmt.principal}
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-soft" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-[#D7153A]"
                    style={{ width: `${taxaFaltasFmt.percentualNumero}%` }}
                  />
                </div>
              </div>
              <p className="mt-3 font-sans text-xs text-muted tabular-nums">
                Faltas ÷ (Concluídas + Faltas): {taxaFaltasFmt.detalhe}
              </p>
            </article>

            <article className="flex flex-col justify-between rounded-xl border border-line bg-white p-5">
              <div>
                <h3 className="text-xs font-semibold text-muted">Ocupação planejada</h3>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-ink tabular-nums">
                  {ocupacaoFmt.principal}
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-soft" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${ocupacaoFmt.percentualNumero}%` }}
                  />
                </div>
              </div>
              <p className="mt-3 font-sans text-xs text-muted tabular-nums">
                Reservados ÷ Disponíveis: {ocupacaoFmt.detalhe} min
              </p>
            </article>
          </section>

          {/* Breakdown Grid: Situações, Cancelamentos por Motivo e Distribuição por Serviço */}
          <div className="dashboard-breakdown">
            <section
              aria-labelledby="titulo-por-situacao"
              className="rounded-xl border border-line bg-white p-5"
            >
              <h3 id="titulo-por-situacao" className="text-base font-semibold text-ink">
                Por situação
              </h3>
              <dl className="mt-4 divide-y divide-soft text-sm">
                {(
                  Object.keys(indicadores.consultasPrevistas) as SituacaoAtendimento[]
                ).map((sit) => (
                  <div key={sit} className="grid grid-cols-[1fr_auto] gap-x-3 py-2.5">
                    <dt>
                      <BadgeSituacao situacao={sit} />
                    </dt>
                    <dd className="font-sans text-sm font-semibold text-ink tabular-nums">
                      {indicadores.consultasPrevistas[sit]}
                    </dd>
                    <dd className="status-meter col-span-2" aria-hidden="true"><span style={{ width: `${totalPrevistas ? (indicadores.consultasPrevistas[sit] / totalPrevistas) * 100 : 0}%` }} /></dd>
                  </div>
                ))}
              </dl>
            </section>

            <section
              aria-labelledby="titulo-cancelamentos-motivo"
              className="rounded-xl border border-line bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <h3
                  id="titulo-cancelamentos-motivo"
                  className="text-base font-semibold text-ink"
                >
                  Cancelamentos por motivo
                </h3>
                <span className="rounded-full bg-soft px-2.5 py-0.5 text-xs font-semibold text-ink">
                  {indicadores.cancelamentos.total}
                </span>
              </div>

              {indicadores.cancelamentos.porMotivo.length === 0 ? (
                <p className="mt-4 rounded-xl bg-canvas p-3 text-xs text-muted">
                  Nenhum cancelamento registrado no período.
                </p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm">
                  {indicadores.cancelamentos.porMotivo.map((item) => (
                    <li
                      key={item.motivo}
                      className="flex items-center justify-between rounded-xl bg-canvas px-3.5 py-2.5"
                    >
                      <span className="text-xs font-semibold text-ink">{item.motivo}</span>
                      <span className="rounded-full bg-ink px-2.5 py-0.5 font-sans text-xs font-semibold text-white tabular-nums">
                        {item.quantidade}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section
              aria-labelledby="titulo-distribuicao-servico"
              className="rounded-xl border border-line bg-white p-5"
            >
              <h3 id="titulo-distribuicao-servico" className="text-base font-semibold text-ink">
                Por procedimento
              </h3>

              {indicadores.distribuicaoPorServico.length === 0 ? (
                <p className="mt-4 text-xs text-muted">Sem consultas no período.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-line text-muted">
                        <th className="pb-2 font-semibold">Serviço</th>
                        <th className="pb-2 font-semibold">Situação</th>
                        <th className="pb-2 text-right font-semibold">Qtd.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-soft">
                      {indicadores.distribuicaoPorServico.map((item) => (
                        <tr key={`${item.servicoId}-${item.situacao}`}>
                          <td className="py-2.5 font-semibold text-ink">
                            {mapaNomesServicos.get(item.servicoId) ?? item.servicoId}
                          </td>
                          <td className="py-2.5 text-muted">
                            {METADADOS_SITUACAO[item.situacao].rotulo}
                          </td>
                          <td className="py-2.5 text-right font-sans font-semibold text-ink tabular-nums">
                            {item.quantidade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Próximas consultas e alertas operacionais */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section
              aria-labelledby="titulo-proximas-consultas-gestor"
              className="rounded-xl border border-line bg-white p-5"
            >
              <h3
                id="titulo-proximas-consultas-gestor"
                className="text-base font-semibold text-ink"
              >
                Próximas consultas ({proximasConsultas.length})
              </h3>
              {proximasConsultas.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  Não há consultas futuras agendadas para o filtro atual.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-soft text-sm">
                  {proximasConsultas.map((c) => {
                    const ini = new Date(c.inicioISO)
                    const fim = new Date(c.fimISO)
                    return (
                      <li key={c.id} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <BadgeSituacao situacao={c.situacao} />
                          <BadgePresenca confirmada={c.presencaConfirmada} />
                        </div>
                        <p className="mt-1.5 font-semibold text-ink">
                          {c.pacienteNome} — {c.servicoNome}
                        </p>
                        <p className="font-sans text-xs text-muted tabular-nums">
                          {c.profissionalNome} • {formatarDataCurtaClinica(ini)} (
                          {formatarIntervaloHorarioClinica(ini, fim)})
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section
              aria-labelledby="titulo-alertas-operacionais"
              className="rounded-xl border border-line bg-white p-5"
            >
              <h3
                id="titulo-alertas-operacionais"
                className="text-base font-semibold text-ink"
              >
                Alertas da agenda
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="rounded-xl border border-[#F6C892] bg-[#FFF4E5] p-4 text-ink">
                  <p className="font-semibold text-[#7A3900]">
                    Aguardando confirmação de presença: {consultasSemConfirmacao.length}
                  </p>
                  <p className="mt-1 text-xs text-[#7A3900]">
                    Contatar pacientes pendentes para reduzir faltas.
                  </p>
                </li>
                <li className="rounded-xl border border-line bg-canvas p-4 text-ink">
                  <p className="font-semibold text-ink">
                    Especialistas ativos: {profissionais.filter((p) => p.ativo).length} de{" "}
                    {profissionais.length}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Consultórios com expediente habilitado.
                  </p>
                </li>
              </ul>
            </section>
          </div>
        </div>
      )}

      {abaAtiva === "equipe" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <section
            aria-labelledby="titulo-lista-funcionarios"
            className="space-y-4 rounded-xl border border-line bg-white p-6 lg:col-span-7"
          >
            <div>
              <h2 id="titulo-lista-funcionarios" className="text-lg font-semibold text-ink">
                Funcionários ({funcionarios.length})
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Desativar revoga o acesso imediatamente e sinaliza consultas futuras para remarcação.
              </p>
            </div>

            <div className="divide-y divide-soft">
              {funcionarios.map((f) => (
                <article
                  key={f.id}
                  className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{f.nome}</span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          f.ativo
                            ? "border-[#A3DFC0] bg-[#E5F5EC] text-[#00522B]"
                            : "border-[#F5B7C4] bg-[#FBE9ED] text-[#8A0D29]"
                        }`}
                      >
                        {f.ativo ? "Ativo" : "Desativado"}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-muted">{f.email}</p>
                    <p className="mt-0.5 text-xs font-semibold text-ink">
                      {f.papeis.map((p) => ROTULO_PAPEL[p]).join(" + ")}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => alternarAtivacaoFuncionario(f.id, !f.ativo)}
                    className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                      f.ativo
                        ? "border-[#F5B7C4] bg-white text-[#D7153A] hover:bg-[#FBE9ED]"
                        : "border-[#006938] bg-[#006938] text-white hover:bg-[#00522B]"
                    }`}
                  >
                    {f.ativo ? "Desativar" : "Reativar"}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="titulo-convidar-funcionario"
            className="rounded-xl border border-line bg-white p-6 lg:col-span-5"
          >
            <h2 id="titulo-convidar-funcionario" className="text-lg font-semibold text-ink">
              Convidar funcionário
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Atribua um ou mais papéis (Recepção, Dentista, Gestor).
            </p>

            <form onSubmit={submeterConvite} className="mt-4 space-y-4">
              <div>
                <label htmlFor="convite-nome" className="block text-xs font-semibold text-muted">
                  Nome completo *
                </label>
                <input
                  id="convite-nome"
                  type="text"
                  required
                  maxLength={120}
                  value={conviteNome}
                  onChange={(e) => setConviteNome(e.target.value)}
                  placeholder="Ex.: Dra. Juliana Prado"
                  className="mt-1 w-full rounded-xl border border-input bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="convite-email" className="block text-xs font-semibold text-muted">
                  E-mail institucional *
                </label>
                <input
                  id="convite-email"
                  type="email"
                  required
                  maxLength={160}
                  value={conviteEmail}
                  onChange={(e) => setConviteEmail(e.target.value)}
                  placeholder="juliana@clinica-aurora.exemplo.invalid"
                  className="mt-1 w-full rounded-xl border border-input bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
                />
              </div>

              <fieldset>
                <legend className="text-xs font-semibold text-muted">Papéis autorizados *</legend>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {(["recepcao", "dentista", "gestor"] as const).map((papel) => (
                    <label
                      key={papel}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-input bg-canvas px-3 py-2 text-xs font-semibold text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={convitePapeis.includes(papel)}
                        onChange={() => alternarPapelConvite(papel)}
                        className="h-4 w-4 accent-ink"
                      />
                      <span>{ROTULO_PAPEL[papel]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {convitePapeis.includes("dentista") && (
                <div>
                  <label
                    htmlFor="convite-especialidade"
                    className="block text-xs font-semibold text-muted"
                  >
                    Especialidade odontológica
                  </label>
                  <input
                    id="convite-especialidade"
                    type="text"
                    maxLength={120}
                    value={conviteEspecialidade}
                    onChange={(e) => setConviteEspecialidade(e.target.value)}
                    placeholder="Ex.: Ortodontia e Clínica Geral"
                    className="mt-1 w-full rounded-xl border border-input bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand"
              >
                {isPending ? "Enviando..." : "Enviar convite"}
              </button>
            </form>
          </section>
        </div>
      )}

      {abaAtiva === "servicos" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <section
            aria-labelledby="titulo-servicos-cadastrados"
            className="space-y-4 rounded-xl border border-line bg-white p-6 lg:col-span-7"
          >
            <h2 id="titulo-servicos-cadastrados" className="text-lg font-semibold text-ink">
              Catálogo de serviços ({servicos.length})
            </h2>

            <div className="divide-y divide-soft">
              {servicos.map((s) => (
                <article key={s.id} className="py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-ink">{s.nome}</h3>
                    <span className="rounded-full bg-soft px-2.5 py-0.5 font-sans text-xs font-semibold text-ink tabular-nums">
                      {s.duracaoMinutos} min
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{s.descricao}</p>
                  <p className="mt-1 text-xs text-muted">
                    <strong className="text-ink">Valor:</strong> {s.indicacaoPreco}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      s.disponivelParaAutoagendamento
                        ? "bg-[#E5F5EC] text-[#00522B]"
                        : "bg-soft text-muted"
                    }`}
                  >
                    {s.disponivelParaAutoagendamento
                      ? "Autoagendamento habilitado"
                      : "Apenas recepção"}
                  </span>
                </article>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="titulo-novo-servico"
            className="rounded-xl border border-line bg-white p-6 lg:col-span-5"
          >
            <h2 id="titulo-novo-servico" className="text-lg font-semibold text-ink">
              Novo serviço
            </h2>

            <form onSubmit={submeterNovoServico} className="mt-4 space-y-4">
              <div>
                <label htmlFor="serv-nome" className="block text-xs font-semibold text-muted">
                  Nome do serviço *
                </label>
                <input
                  id="serv-nome"
                  type="text"
                  required
                  maxLength={120}
                  value={servicoNome}
                  onChange={(e) => setServicoNome(e.target.value)}
                  placeholder="Ex.: Avaliação de Urgência"
                  className="mt-1 w-full rounded-xl border border-input bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="serv-duracao" className="block text-xs font-semibold text-muted">
                  Duração (minutos) *
                </label>
                <input
                  id="serv-duracao"
                  type="number"
                  min={15}
                  max={240}
                  step={15}
                  required
                  value={servicoDuracao}
                  onChange={(e) => setServicoDuracao(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-input bg-canvas px-3.5 py-2.5 font-sans text-sm font-semibold text-ink focus:border-brand focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="serv-descricao" className="block text-xs font-semibold text-muted">
                  Descrição
                </label>
                <input
                  id="serv-descricao"
                  type="text"
                  maxLength={300}
                  value={servicoDescricao}
                  onChange={(e) => setServicoDescricao(e.target.value)}
                  placeholder="Finalidade clínica do serviço"
                  className="mt-1 w-full rounded-xl border border-input bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="serv-preco" className="block text-xs font-semibold text-muted">
                  Indicação transparente de valor
                </label>
                <input
                  id="serv-preco"
                  type="text"
                  maxLength={240}
                  value={servicoIndicacaoPreco}
                  onChange={(e) => setServicoIndicacaoPreco(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:bg-white focus:outline-none"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={servicoAutoagendamento}
                  onChange={(e) => setServicoAutoagendamento(e.target.checked)}
                  className="h-4 w-4 accent-ink"
                />
                <span>Permitir autoagendamento pelo paciente</span>
              </label>

              <fieldset>
                <legend className="text-xs font-semibold text-muted">
                  Especialistas habilitados
                </legend>
                <div className="mt-1.5 space-y-1.5">
                  {profissionais.map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-semibold text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={servicoProfissionais.includes(p.id)}
                        onChange={() =>
                          setServicoProfissionais((atual) =>
                            atual.includes(p.id)
                              ? atual.filter((id) => id !== p.id)
                              : [...atual, p.id],
                          )
                        }
                        className="h-4 w-4 accent-ink"
                      />
                      <span>
                        {p.nome} ({p.especialidade})
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand"
              >
                Salvar serviço
              </button>
            </form>
          </section>
        </div>
      )}

      {abaAtiva === "expediente" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <section
            aria-labelledby="titulo-expediente-profissionais"
            className="space-y-4 rounded-xl border border-line bg-white p-6 lg:col-span-6"
          >
            <div>
              <h2
                id="titulo-expediente-profissionais"
                className="text-lg font-semibold text-ink"
              >
                Expediente por especialista
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Intervalo de almoço (12h–13h) descontado automaticamente.
              </p>
            </div>

            <div className="space-y-3">
              {profissionais.map((p) => (
                <LinhaExpedienteProfissional
                  key={p.id}
                  profissional={p}
                  disabled={isPending}
                  onSalvar={salvarExpedienteProfissional}
                />
              ))}
            </div>
          </section>

          <section
            aria-labelledby="titulo-bloqueios-agenda"
            className="space-y-5 rounded-xl border border-line bg-white p-6 lg:col-span-6"
          >
            <div>
              <h2 id="titulo-bloqueios-agenda" className="text-lg font-semibold text-ink">
                Bloqueios e ausências
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Períodos bloqueados não são ofertados para agendamento.
              </p>
            </div>

            <form
              onSubmit={submeterBloqueio}
              className="space-y-3.5 border-b border-soft pb-5"
            >
              <div>
                <label htmlFor="bloq-profissional" className="block text-xs font-semibold text-muted">
                  Especialista
                </label>
                <select
                  id="bloq-profissional"
                  value={bloqProfissionalId}
                  onChange={(e) => setBloqProfissionalId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-canvas px-3.5 py-2.5 text-sm font-semibold text-ink"
                >
                  {profissionais.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="bloq-data" className="block text-xs font-semibold text-muted">
                    Data
                  </label>
                  <input
                    id="bloq-data"
                    type="date"
                    value={bloqDataISO}
                    onChange={(e) => setBloqDataISO(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-canvas px-3 py-2 font-sans text-xs font-semibold text-ink"
                  />
                </div>
                <div>
                  <label htmlFor="bloq-inicio" className="block text-xs font-semibold text-muted">
                    Início (6–21h)
                  </label>
                  <input
                    id="bloq-inicio"
                    type="number"
                    min={6}
                    max={21}
                    value={bloqHoraInicio}
                    onChange={(e) => setBloqHoraInicio(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-input bg-canvas px-3 py-2 font-sans text-xs font-semibold text-ink"
                  />
                </div>
                <div>
                  <label htmlFor="bloq-fim" className="block text-xs font-semibold text-muted">
                    Fim (7–22h)
                  </label>
                  <input
                    id="bloq-fim"
                    type="number"
                    min={7}
                    max={22}
                    value={bloqHoraFim}
                    onChange={(e) => setBloqHoraFim(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-input bg-canvas px-3 py-2 font-sans text-xs font-semibold text-ink"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bloq-motivo" className="block text-xs font-semibold text-muted">
                  Motivo
                </label>
                <input
                  id="bloq-motivo"
                  type="text"
                  required
                  maxLength={200}
                  value={bloqMotivo}
                  onChange={(e) => setBloqMotivo(e.target.value)}
                  placeholder="Ex.: Congresso / Manutenção"
                  className="mt-1 w-full rounded-xl border border-input bg-canvas px-3.5 py-2 text-sm text-ink"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand"
              >
                Registrar bloqueio
              </button>
            </form>

            <div>
              <h3 className="text-xs font-semibold uppercase text-muted">
                Bloqueios ativos ({bloqueios.length})
              </h3>
              {bloqueios.length === 0 ? (
                <p className="mt-2 text-xs text-muted">Nenhum bloqueio ativo.</p>
              ) : (
                <ul className="mt-2.5 space-y-2 text-xs">
                  {bloqueios.map((b) => (
                    <li
                      key={b.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-canvas p-3"
                    >
                      <div>
                        <p className="font-semibold text-ink">
                          {b.profissionalNome} — {b.motivo}
                        </p>
                        <p className="font-sans text-muted tabular-nums">
                          {formatarDataCurtaClinica(new Date(b.inicioISO))} •{" "}
                          {formatarIntervaloHorarioClinica(
                            new Date(b.inicioISO),
                            new Date(b.fimISO),
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => removerBloqueio(b.id)}
                        className="rounded-lg border border-[#F5B7C4] bg-white px-2.5 py-1 font-semibold text-[#D7153A] hover:bg-[#FBE9ED]"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function LinhaExpedienteProfissional({
  profissional,
  disabled,
  onSalvar,
}: {
  profissional: ProfissionalGestorDTO
  disabled: boolean
  onSalvar: (id: string, abertura: number, fechamento: number) => void
}) {
  const [abertura, setAbertura] = useState(profissional.aberturaHora)
  const [fechamento, setFechamento] = useState(profissional.fechamentoHora)

  return (
    <div className="rounded-xl border border-line bg-canvas p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{profissional.nome}</p>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-muted">
          {profissional.ativo ? "Ativo" : "Desativado"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor={`exp-abertura-${profissional.id}`}
            className="block text-xs font-semibold text-muted"
          >
            Abertura (h)
          </label>
          <input
            id={`exp-abertura-${profissional.id}`}
            type="number"
            min={6}
            max={20}
            value={abertura}
            onChange={(e) => setAbertura(Number(e.target.value))}
            className="mt-1 w-20 rounded-xl border border-input bg-white px-3 py-1.5 font-sans text-sm font-semibold text-ink"
          />
        </div>
        <div>
          <label
            htmlFor={`exp-fechamento-${profissional.id}`}
            className="block text-xs font-semibold text-muted"
          >
            Fechamento (h)
          </label>
          <input
            id={`exp-fechamento-${profissional.id}`}
            type="number"
            min={8}
            max={22}
            value={fechamento}
            onChange={(e) => setFechamento(Number(e.target.value))}
            className="mt-1 w-20 rounded-xl border border-input bg-white px-3 py-1.5 font-sans text-sm font-semibold text-ink"
          />
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSalvar(profissional.id, abertura, fechamento)}
          className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand"
        >
          Salvar
        </button>
      </div>
    </div>
  )
}
