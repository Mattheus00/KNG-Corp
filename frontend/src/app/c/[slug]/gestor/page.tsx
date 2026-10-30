import {
  formatarDataISOClinica,
  obterCenarioSessao,
  obterPainelGestorSessao,
} from "@sgc/backend/data"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AvisoPermissao } from "@/components/aviso-permissao"
import { PainelGestor } from "@/components/painel-gestor"
import { lerSessaoId } from "@/lib/sessao"

export const metadata: Metadata = {
  title: "Painel do Gestor — Indicadores, Equipe, Serviços e Expediente",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PaginaGestor({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ dias?: string; profissional?: string }> }) {
  const { slug } = await params
  const sessaoId = await lerSessaoId()
  const cenario = obterCenarioSessao({ sessaoId, clinicaSlug: slug })
  if (!cenario) notFound()

  if (!cenario.atorAtual.papeis.includes("gestor")) {
    return (
      <AvisoPermissao
        papelNecessario="gestor"
        nomeAtorAtual={cenario.nomeAtorAtual}
        papeisAtuais={cenario.atorAtual.papeis}
        contaSugeridaId={slug === "aurora" ? "22222222-2222-4222-8222-222222222204" : ""}
        contaSugeridaNome={slug === "aurora" ? "Roberto Vasconcelos" : ""}
      />
    )
  }

  const filtros = await searchParams!
  const diasSolicitados = Number(filtros.dias ?? 7)
  const diasPeriodo = [3, 7, 14, 30].includes(diasSolicitados) ? diasSolicitados : 7
  const profissionalFiltro =
    filtros.profissional && filtros.profissional !== "todos" ? filtros.profissional : undefined

  const painelResultado = obterPainelGestorSessao({ sessaoId, clinicaSlug: slug }, {
    diasPeriodo,
    profissionalId: profissionalFiltro,
  })

  if (!painelResultado.ok) {
    return (
      <AvisoPermissao
        papelNecessario="gestor"
        nomeAtorAtual={cenario.nomeAtorAtual}
        papeisAtuais={cenario.atorAtual.papeis}
        contaSugeridaId={slug === "aurora" ? "22222222-2222-4222-8222-222222222204" : ""}
        contaSugeridaNome={slug === "aurora" ? "Roberto Vasconcelos" : ""}
      />
    )
  }

  const dados = painelResultado.valor
  const mapaNomesProf = new Map(cenario.profissionais.map((p) => [p.id, p.nome]))

  const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const dataPadraoBloqueioISO = formatarDataISOClinica(amanha)

  return (
    <PainelGestor
      indicadores={dados.indicadores}
      periodoInicioISO={dados.periodoInicio.toISOString()}
      periodoFimISO={dados.periodoFim.toISOString()}
      diasFiltroAtual={diasPeriodo}
      profissionalFiltroAtual={profissionalFiltro ?? "todos"}
      proximasConsultas={dados.proximasConsultas.map((c) => ({
        id: c.id,
        pacienteNome: c.pacienteNome,
        pacienteTelefone: c.pacienteTelefone,
        profissionalId: c.profissionalId,
        profissionalNome: c.profissionalNome,
        servicoNome: c.servicoNome,
        inicioISO: c.inicio.toISOString(),
        fimISO: c.fim.toISOString(),
        situacao: c.situacao,
        presencaConfirmada: c.presencaConfirmada,
      }))}
      consultasProfissionaisInativos={dados.consultasProfissionaisInativos.map((c) => ({
        id: c.id,
        pacienteNome: c.pacienteNome,
        pacienteTelefone: c.pacienteTelefone,
        profissionalId: c.profissionalId,
        profissionalNome: c.profissionalNome,
        servicoNome: c.servicoNome,
        inicioISO: c.inicio.toISOString(),
        fimISO: c.fim.toISOString(),
        situacao: c.situacao,
        presencaConfirmada: c.presencaConfirmada,
      }))}
      consultasSemConfirmacao={dados.consultasSemConfirmacao.map((c) => ({
        id: c.id,
        pacienteNome: c.pacienteNome,
        pacienteTelefone: c.pacienteTelefone,
        profissionalId: c.profissionalId,
        profissionalNome: c.profissionalNome,
        servicoNome: c.servicoNome,
        inicioISO: c.inicio.toISOString(),
        fimISO: c.fim.toISOString(),
        situacao: c.situacao,
        presencaConfirmada: c.presencaConfirmada,
      }))}
      funcionarios={cenario.funcionarios.map((f) => ({
        id: f.id,
        nome: f.nome,
        email: f.email,
        papeis: [...f.papeis],
        profissionalId: f.profissionalId,
        ativo: f.ativo,
        convitePendente: f.convitePendente,
      }))}
      profissionais={cenario.profissionais.map((p) => ({
        id: p.id,
        nome: p.nome,
        especialidade: p.especialidade,
        ativo: p.ativo,
        aberturaHora: p.aberturaHora,
        fechamentoHora: p.fechamentoHora,
      }))}
      servicos={cenario.servicos.map((s) => ({
        id: s.id,
        nome: s.nome,
        descricao: s.descricao,
        duracaoMinutos: s.duracaoMinutos,
        indicacaoPreco: s.indicacaoPreco,
        disponivelParaAutoagendamento: s.disponivelParaAutoagendamento,
        profissionaisHabilitados: [...s.profissionaisHabilitados],
      }))}
      bloqueios={cenario.bloqueios.map((b) => ({
        id: b.id,
        profissionalId: b.profissionalId,
        profissionalNome: mapaNomesProf.get(b.profissionalId) ?? "Profissional",
        motivo: b.motivo,
        inicioISO: b.inicio.toISOString(),
        fimISO: b.fim.toISOString(),
      }))}
      dataPadraoBloqueioISO={dataPadraoBloqueioISO}
      mostrarPrimeirosPassos={cenario.profissionais.length === 0 || cenario.servicos.length === 0}
    />
  )
}
