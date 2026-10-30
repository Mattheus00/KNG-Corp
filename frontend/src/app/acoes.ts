"use server"

import {
  adicionarBloqueioSessao,
  alternarContaDemonstrativa,
  alterarStatusFuncionarioSessao,
  atualizarDadosBasicosPaciente,
  atualizarExpedienteProfissionalSessao,
  autenticarPorEmailDemo,
  cadastrarContaPacientePublico,
  cadastrarPacientePelaRecepcao,
  consultarHorariosDisponiveisNoDia,
  convidarFuncionarioSessao,
  executarAgendamentoSessao,
  executarCancelamentoSessao,
  executarConfirmacaoPresencaSessao,
  executarMudancaSituacaoSessao,
  executarRemarcacaoSessao,
  cadastrarClinicaSessao,
  obterCenarioSessao,
  removerBloqueioSessao,
  restaurarCenarioSessao,
  salvarServicoSessao,
} from "@sgc/backend/data"
import type { Papel, SituacaoAtendimento } from "@sgc/backend/domain"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { lerClinicaSlug, lerSessaoId } from "@/lib/sessao"

export type RespostaAcao<T = null> =
  | { ok: true; mensagem: string; dados?: T }
  | {
      ok: false
      mensagem: string
      codigo?: string
      campos?: readonly { campo: string; mensagem: string }[]
    }

function revalidarClinica(slug: string) {
  revalidatePath(`/c/${slug}`)
}

async function escopoAtual() {
  const sessaoId = await lerSessaoId()
  const clinicaSlug = await lerClinicaSlug()
  return { sessaoId, clinicaSlug }
}

function rotaDaClinica(slug: string, rota: string) {
  if (rota.startsWith("/c/")) return rota
  return `/c/${slug}${rota.startsWith("/") ? rota : `/${rota}`}`
}

export async function acaoAlternarPerfilDemo(
  contaId: string,
): Promise<RespostaAcao<{ rotaInicial: string; nome: string }>> {
  const escopo = await escopoAtual()
  const resultado = alternarContaDemonstrativa(escopo, contaId)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarClinica(escopo.clinicaSlug)
  return {
    ok: true,
    mensagem: `Perfil ativo alterado para ${resultado.valor.nome} (${resultado.valor.rotuloPerfil}).`,
    dados: {
      rotaInicial: rotaDaClinica(escopo.clinicaSlug, resultado.valor.rotaInicial),
      nome: resultado.valor.nome,
    },
  }
}

export async function acaoRestaurarDemonstracao(): Promise<RespostaAcao<{ rotaInicial: string }>> {
  const escopo = await escopoAtual()
  const atual = obterCenarioSessao(escopo)
  restaurarCenarioSessao(escopo, atual?.atorAtual.id)
  revalidarClinica("aurora")
  return {
    ok: true,
    mensagem: "Os dados fictícios desta sessão demonstrativa foram restaurados ao estado inicial.",
    dados: { rotaInicial: "/c/aurora" },
  }
}

export async function acaoLoginEmailDemo(
  email: string,
): Promise<RespostaAcao<{ rotaInicial: string; nome: string }>> {
  const escopo = await escopoAtual()
  const resultado = autenticarPorEmailDemo(escopo, email)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarClinica(escopo.clinicaSlug)
  return {
    ok: true,
    mensagem: `Acesso iniciado como ${resultado.valor.nome}.`,
    dados: {
      nome: resultado.valor.nome,
      rotaInicial: rotaDaClinica(escopo.clinicaSlug, resultado.valor.rotaInicial),
    },
  }
}

export async function acaoCadastrarPacientePublico(entrada: {
  nome: string
  email: string
  telefone: string
  aceitouTermos: boolean
}): Promise<RespostaAcao<{ pacienteId: string; rotaInicial: string }>> {
  const escopo = await escopoAtual()
  const resultado = cadastrarContaPacientePublico(escopo, entrada)
  if (!resultado.ok) {
    return {
      ok: false,
      mensagem: resultado.erro.mensagem,
      codigo: resultado.erro.codigo,
      campos: resultado.erro.campos,
    }
  }
  revalidarClinica(escopo.clinicaSlug)
  return {
    ok: true,
    mensagem: "Cadastro concluído com perfil de Paciente. Você já pode agendar sua avaliação.",
    dados: {
      pacienteId: resultado.valor.id,
      rotaInicial: rotaDaClinica(escopo.clinicaSlug, "/paciente"),
    },
  }
}

export async function acaoAtualizarDadosPaciente(entrada: {
  pacienteId: string
  nome: string
  email: string
  telefone: string
}): Promise<RespostaAcao> {
  const escopo = await escopoAtual()
  const resultado = atualizarDadosBasicosPaciente(escopo, entrada)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarClinica(escopo.clinicaSlug)
  return {
    ok: true,
    mensagem: "Dados básicos de contato atualizados com sucesso.",
  }
}

export async function acaoCadastrarPacienteRecepcao(entrada: {
  nome: string
  telefone: string
  email?: string
}): Promise<RespostaAcao<{ pacienteId: string; nome: string }>> {
  const escopo = await escopoAtual()
  const resultado = cadastrarPacientePelaRecepcao(escopo, entrada)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarClinica(escopo.clinicaSlug)
  return {
    ok: true,
    mensagem: `Paciente ${resultado.valor.nome} cadastrado para atendimento operacional.`,
    dados: { pacienteId: resultado.valor.id, nome: resultado.valor.nome },
  }
}

export async function acaoConsultarHorariosDisponiveis(entrada: {
  profissionalId: string
  servicoId: string
  dataISO: string
  ignorarAgendamentoId?: string
}): Promise<RespostaAcao<string[]>> {
  const escopo = await escopoAtual()
  const resultado = consultarHorariosDisponiveisNoDia(escopo, entrada)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  return {
    ok: true,
    mensagem: "Horários consultados.",
    dados: resultado.valor.map((d) => d.toISOString()),
  }
}

export async function acaoAgendarConsulta(entrada: {
  pacienteId: string
  profissionalId: string
  servicoId: string
  inicio: string
}): Promise<
  RespostaAcao<{
    id: string
    inicioISO: string
    fimISO: string
    profissionalId: string
    servicoId: string
  }>
> {
  const escopo = await escopoAtual()
  const resultado = await executarAgendamentoSessao(escopo, entrada)
  if (!resultado.ok) {
    return {
      ok: false,
      mensagem: resultado.erro.mensagem,
      codigo: resultado.erro.codigo,
      campos: resultado.erro.campos,
    }
  }
  revalidarClinica(escopo.clinicaSlug)
  return {
    ok: true,
    mensagem: "Reserva confirmada com sucesso.",
    dados: {
      id: resultado.valor.id,
      inicioISO: resultado.valor.inicio.toISOString(),
      fimISO: resultado.valor.fim.toISOString(),
      profissionalId: resultado.valor.profissionalId,
      servicoId: resultado.valor.servicoId,
    },
  }
}

export async function acaoRemarcarConsulta(entrada: {
  agendamentoId: string
  inicio: string
}): Promise<RespostaAcao<{ id: string; inicioISO: string; fimISO: string }>> {
  const escopo = await escopoAtual()
  const resultado = await executarRemarcacaoSessao(escopo, entrada)
  if (!resultado.ok) {
    return {
      ok: false,
      mensagem: resultado.erro.mensagem,
      codigo: resultado.erro.codigo,
      campos: resultado.erro.campos,
    }
  }
  revalidarClinica(escopo.clinicaSlug)
  return {
    ok: true,
    mensagem:
      "Consulta remarcada com sucesso. A confirmação de presença foi reiniciada para o novo horário.",
    dados: {
      id: resultado.valor.id,
      inicioISO: resultado.valor.inicio.toISOString(),
      fimISO: resultado.valor.fim.toISOString(),
    },
  }
}

export async function acaoCancelarConsulta(entrada: {
  agendamentoId: string
  motivo: string
}): Promise<RespostaAcao> {
  const escopo = await escopoAtual()
  const resultado = await executarCancelamentoSessao(escopo, entrada)
  if (!resultado.ok) {
    return {
      ok: false,
      mensagem: resultado.erro.mensagem,
      codigo: resultado.erro.codigo,
      campos: resultado.erro.campos,
    }
  }
  revalidarClinica(escopo.clinicaSlug)
  return {
    ok: true,
    mensagem: "Consulta cancelada e horário liberado na agenda.",
  }
}

export async function acaoAlterarSituacaoAtendimento(entrada: {
  agendamentoId: string
  situacao: SituacaoAtendimento
  motivo?: string | null
}): Promise<RespostaAcao> {
  const escopo = await escopoAtual()
  const resultado = await executarMudancaSituacaoSessao(escopo, entrada)
  if (!resultado.ok) {
    return {
      ok: false,
      mensagem: resultado.erro.mensagem,
      codigo: resultado.erro.codigo,
    }
  }
  revalidarClinica(escopo.clinicaSlug)
  return {
    ok: true,
    mensagem: "Situação do atendimento atualizada com sucesso.",
  }
}

export async function acaoConfirmarPresenca(agendamentoId: string): Promise<RespostaAcao> {
  const escopo = await escopoAtual()
  const resultado = await executarConfirmacaoPresencaSessao(escopo, agendamentoId)
  if (!resultado.ok) {
    return {
      ok: false,
      mensagem: resultado.erro.mensagem,
      codigo: resultado.erro.codigo,
    }
  }
  revalidarClinica(escopo.clinicaSlug)
  return {
    ok: true,
    mensagem: "Presença confirmada para o horário vigente.",
  }
}

export async function acaoConvidarFuncionario(entrada: {
  nome: string
  email: string
  papeis: Papel[]
  especialidade?: string
}): Promise<RespostaAcao> {
  const escopo = await escopoAtual()
  const resultado = convidarFuncionarioSessao(escopo, entrada)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarClinica(escopo.clinicaSlug)
  return {
    ok: true,
    mensagem: `Convite registrado para ${resultado.valor.nome} (${resultado.valor.papeis.join(", ")}).`,
  }
}

export async function acaoAlterarStatusFuncionario(entrada: {
  funcionarioId: string
  ativo: boolean
}): Promise<
  RespostaAcao<{
    afetadas: Array<{
      id: string
      pacienteNome: string
      servicoNome: string
      inicioISO: string
    }>
  }>
> {
  const escopo = await escopoAtual()
  const resultado = alterarStatusFuncionarioSessao(escopo, entrada)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarClinica(escopo.clinicaSlug)
  const qtdAfetadas = resultado.valor.consultasFuturasAfetadas.length
  const sufixoAfetadas =
    !entrada.ativo && qtdAfetadas > 0
      ? ` Atenção: ${qtdAfetadas} consulta(s) futura(s) precisam ser encaminhadas para remarcação.`
      : ""
  return {
    ok: true,
    mensagem: `Situação de ${resultado.valor.funcionario.nome} atualizada para ${
      entrada.ativo ? "Ativo" : "Desativado"
    }.${sufixoAfetadas}`,
    dados: {
      afetadas: resultado.valor.consultasFuturasAfetadas.map((a) => ({
        id: a.id,
        pacienteNome: a.pacienteNome,
        servicoNome: a.servicoNome,
        inicioISO: a.inicio.toISOString(),
      })),
    },
  }
}

export async function acaoSalvarServico(entrada: {
  nome: string
  descricao: string
  duracaoMinutos: number
  indicacaoPreco: string
  disponivelParaAutoagendamento: boolean
  profissionaisHabilitados: string[]
}): Promise<RespostaAcao> {
  const escopo = await escopoAtual()
  const resultado = salvarServicoSessao(escopo, entrada)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarClinica(escopo.clinicaSlug)
  return {
    ok: true,
    mensagem: `Serviço "${resultado.valor.nome}" (${resultado.valor.duracaoMinutos} min) adicionado.`,
  }
}

export async function acaoAtualizarExpediente(entrada: {
  profissionalId: string
  aberturaHora: number
  fechamentoHora: number
}): Promise<RespostaAcao> {
  const escopo = await escopoAtual()
  const resultado = atualizarExpedienteProfissionalSessao(escopo, entrada)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarClinica(escopo.clinicaSlug)
  return {
    ok: true,
    mensagem: `Expediente de ${resultado.valor.nome} atualizado para ${String(
      resultado.valor.aberturaHora,
    ).padStart(2, "0")}:00 às ${String(resultado.valor.fechamentoHora).padStart(2, "0")}:00.`,
  }
}

export async function acaoAdicionarBloqueio(entrada: {
  profissionalId: string
  dataISO: string
  horaInicio: number
  horaFim: number
  motivo: string
}): Promise<RespostaAcao> {
  const escopo = await escopoAtual()
  const resultado = adicionarBloqueioSessao(escopo, entrada)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarClinica(escopo.clinicaSlug)
  return {
    ok: true,
    mensagem: "Bloqueio de agenda registrado com sucesso.",
  }
}

export async function acaoCadastrarClinica(entrada: {
  nome: string
  slug: string
  responsavelNome: string
  responsavelEmail: string
}): Promise<RespostaAcao> {
  const sessaoId = await lerSessaoId()
  const resultado = cadastrarClinicaSessao(sessaoId, entrada)
  if (!resultado.ok) {
    return {
      ok: false,
      mensagem: resultado.erro.mensagem,
      codigo: resultado.erro.codigo,
      campos: resultado.erro.campos,
    }
  }
  redirect(`/c/${resultado.valor.slug}/gestor`)
}

export async function acaoRemoverBloqueio(bloqueioId: string): Promise<RespostaAcao> {
  const escopo = await escopoAtual()
  const resultado = removerBloqueioSessao(escopo, bloqueioId)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarClinica(escopo.clinicaSlug)
  return {
    ok: true,
    mensagem: "Bloqueio removido e disponibilidade restaurada.",
  }
}
