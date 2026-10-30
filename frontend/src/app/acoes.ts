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
  obterCenarioSessao,
  removerBloqueioSessao,
  restaurarCenarioSessao,
  salvarServicoSessao,
} from "@sgc/backend/data"
import type { Papel, SituacaoAtendimento } from "@sgc/backend/domain"
import { revalidatePath } from "next/cache"
import { lerSessaoId } from "@/lib/sessao"

export type RespostaAcao<T = null> =
  | { ok: true; mensagem: string; dados?: T }
  | {
      ok: false
      mensagem: string
      codigo?: string
      campos?: readonly { campo: string; mensagem: string }[]
    }

function revalidarTudo() {
  revalidatePath("/")
  revalidatePath("/acesso")
  revalidatePath("/paciente")
  revalidatePath("/recepcao")
  revalidatePath("/dentista")
  revalidatePath("/gestor")
}

export async function acaoAlternarPerfilDemo(
  contaId: string,
): Promise<RespostaAcao<{ rotaInicial: string; nome: string }>> {
  const sessaoId = await lerSessaoId()
  const resultado = alternarContaDemonstrativa(sessaoId, contaId)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarTudo()
  return {
    ok: true,
    mensagem: `Perfil ativo alterado para ${resultado.valor.nome} (${resultado.valor.rotuloPerfil}).`,
    dados: {
      rotaInicial: resultado.valor.rotaInicial,
      nome: resultado.valor.nome,
    },
  }
}

export async function acaoRestaurarDemonstracao(): Promise<RespostaAcao> {
  const sessaoId = await lerSessaoId()
  const atual = obterCenarioSessao(sessaoId)
  restaurarCenarioSessao(sessaoId, atual.atorAtual.id)
  revalidarTudo()
  return {
    ok: true,
    mensagem: "Os dados fictícios desta sessão demonstrativa foram restaurados ao estado inicial.",
  }
}

export async function acaoLoginEmailDemo(
  email: string,
): Promise<RespostaAcao<{ rotaInicial: string; nome: string }>> {
  const sessaoId = await lerSessaoId()
  const resultado = autenticarPorEmailDemo(sessaoId, email)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarTudo()
  return {
    ok: true,
    mensagem: `Acesso iniciado como ${resultado.valor.nome}.`,
    dados: resultado.valor,
  }
}

export async function acaoCadastrarPacientePublico(entrada: {
  nome: string
  email: string
  telefone: string
  aceitouTermos: boolean
}): Promise<RespostaAcao<{ pacienteId: string; rotaInicial: string }>> {
  const sessaoId = await lerSessaoId()
  const resultado = cadastrarContaPacientePublico(sessaoId, entrada)
  if (!resultado.ok) {
    return {
      ok: false,
      mensagem: resultado.erro.mensagem,
      codigo: resultado.erro.codigo,
      campos: resultado.erro.campos,
    }
  }
  revalidarTudo()
  return {
    ok: true,
    mensagem: "Cadastro concluído com perfil de Paciente. Você já pode agendar sua avaliação.",
    dados: { pacienteId: resultado.valor.id, rotaInicial: "/paciente" },
  }
}

export async function acaoAtualizarDadosPaciente(entrada: {
  pacienteId: string
  nome: string
  email: string
  telefone: string
}): Promise<RespostaAcao> {
  const sessaoId = await lerSessaoId()
  const resultado = atualizarDadosBasicosPaciente(sessaoId, entrada)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarTudo()
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
  const sessaoId = await lerSessaoId()
  const resultado = cadastrarPacientePelaRecepcao(sessaoId, entrada)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarTudo()
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
  const sessaoId = await lerSessaoId()
  const resultado = consultarHorariosDisponiveisNoDia(sessaoId, entrada)
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
  const sessaoId = await lerSessaoId()
  const resultado = await executarAgendamentoSessao(sessaoId, entrada)
  if (!resultado.ok) {
    return {
      ok: false,
      mensagem: resultado.erro.mensagem,
      codigo: resultado.erro.codigo,
      campos: resultado.erro.campos,
    }
  }
  revalidarTudo()
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
  const sessaoId = await lerSessaoId()
  const resultado = await executarRemarcacaoSessao(sessaoId, entrada)
  if (!resultado.ok) {
    return {
      ok: false,
      mensagem: resultado.erro.mensagem,
      codigo: resultado.erro.codigo,
      campos: resultado.erro.campos,
    }
  }
  revalidarTudo()
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
  const sessaoId = await lerSessaoId()
  const resultado = await executarCancelamentoSessao(sessaoId, entrada)
  if (!resultado.ok) {
    return {
      ok: false,
      mensagem: resultado.erro.mensagem,
      codigo: resultado.erro.codigo,
      campos: resultado.erro.campos,
    }
  }
  revalidarTudo()
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
  const sessaoId = await lerSessaoId()
  const resultado = await executarMudancaSituacaoSessao(sessaoId, entrada)
  if (!resultado.ok) {
    return {
      ok: false,
      mensagem: resultado.erro.mensagem,
      codigo: resultado.erro.codigo,
    }
  }
  revalidarTudo()
  return {
    ok: true,
    mensagem: "Situação do atendimento atualizada com sucesso.",
  }
}

export async function acaoConfirmarPresenca(agendamentoId: string): Promise<RespostaAcao> {
  const sessaoId = await lerSessaoId()
  const resultado = await executarConfirmacaoPresencaSessao(sessaoId, agendamentoId)
  if (!resultado.ok) {
    return {
      ok: false,
      mensagem: resultado.erro.mensagem,
      codigo: resultado.erro.codigo,
    }
  }
  revalidarTudo()
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
  const sessaoId = await lerSessaoId()
  const resultado = convidarFuncionarioSessao(sessaoId, entrada)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarTudo()
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
  const sessaoId = await lerSessaoId()
  const resultado = alterarStatusFuncionarioSessao(sessaoId, entrada)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarTudo()
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
  const sessaoId = await lerSessaoId()
  const resultado = salvarServicoSessao(sessaoId, entrada)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarTudo()
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
  const sessaoId = await lerSessaoId()
  const resultado = atualizarExpedienteProfissionalSessao(sessaoId, entrada)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarTudo()
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
  const sessaoId = await lerSessaoId()
  const resultado = adicionarBloqueioSessao(sessaoId, entrada)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarTudo()
  return {
    ok: true,
    mensagem: "Bloqueio de agenda registrado com sucesso.",
  }
}

export async function acaoRemoverBloqueio(bloqueioId: string): Promise<RespostaAcao> {
  const sessaoId = await lerSessaoId()
  const resultado = removerBloqueioSessao(sessaoId, bloqueioId)
  if (!resultado.ok) {
    return { ok: false, mensagem: resultado.erro.mensagem, codigo: resultado.erro.codigo }
  }
  revalidarTudo()
  return {
    ok: true,
    mensagem: "Bloqueio removido e disponibilidade restaurada.",
  }
}
