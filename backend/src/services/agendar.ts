import { podeAgendar } from "../auth"
import {
  avaliarReserva,
  duracaoAtendimentoValida,
  falha,
  ocupaAgenda,
  sucesso,
  type Agendamento,
  type Ator,
  type Intervalo,
  type Resultado,
} from "../domain"
import type { AgendaRepositorio } from "./agenda-repositorio"

export type ComandoAgendar = {
  ator: Ator
  pacienteId: string
  profissionalId: string
  servicoId: string
  inicio: Date
  duracaoMinutos: number
  agora: Date
  profissionalHabilitado: boolean
  expediente: readonly Intervalo[]
  bloqueios: readonly Intervalo[]
}

export async function agendar(
  repositorio: AgendaRepositorio,
  comando: ComandoAgendar,
): Promise<Resultado<Agendamento>> {
  const permissao = podeAgendar(comando.ator, comando.pacienteId)
  if (!permissao.ok) return permissao
  if (!duracaoAtendimentoValida(comando.duracaoMinutos)) {
    return falha("duracao_invalida", "A duração do serviço é inválida.")
  }

  // O limite de reservas por paciente ainda não tem número aprovado.
  return repositorio.transacao((vista) => {
    const fim = new Date(comando.inicio.getTime() + comando.duracaoMinutos * 60_000)
    const ocupadas = vista
      .listarPorProfissional(comando.profissionalId)
      .filter((consulta) => ocupaAgenda(consulta.situacao))
    const avaliacao = avaliarReserva({
      inicio: comando.inicio,
      fim,
      agora: comando.agora,
      profissionalHabilitado: comando.profissionalHabilitado,
      expediente: comando.expediente,
      bloqueios: comando.bloqueios,
      ocupadas,
    })
    if (!avaliacao.ok) return avaliacao

    const consulta: Agendamento = {
      id: crypto.randomUUID(),
      pacienteId: comando.pacienteId,
      profissionalId: comando.profissionalId,
      servicoId: comando.servicoId,
      inicio: new Date(comando.inicio),
      fim,
      situacao: "agendado",
      presencaConfirmada: false,
      motivoCancelamento: null,
    }
    vista.inserir(consulta, {
      agendamentoId: consulta.id,
      autorId: comando.ator.id,
      momento: new Date(comando.agora),
      acao: "agendar",
      situacaoAnterior: null,
      situacaoNova: "agendado",
      motivo: null,
      horario: null,
    })
    return sucesso(consulta)
  })
}
