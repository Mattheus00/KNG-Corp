import { podeRemarcar } from "../auth"
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

export type ComandoRemarcar = {
  ator: Ator
  agendamentoId: string
  inicio: Date
  duracaoMinutos: number
  agora: Date
  profissionalHabilitado: boolean
  expediente: readonly Intervalo[]
  bloqueios: readonly Intervalo[]
}

// A remarcação mantém o mesmo profissional. Trocar de profissional seria outra reserva
// e ainda não está definido. Se o horário novo não couber, o registro original não muda.
export async function remarcar(
  repositorio: AgendaRepositorio,
  comando: ComandoRemarcar,
): Promise<Resultado<Agendamento>> {
  if (!duracaoAtendimentoValida(comando.duracaoMinutos)) {
    return falha("duracao_invalida", "A duração do serviço é inválida.")
  }

  return repositorio.transacao((vista) => {
    const atual = vista.obter(comando.agendamentoId)
    if (!atual) return falha("consulta_nao_encontrada", "A consulta não foi encontrada.")

    const permissao = podeRemarcar(comando.ator, atual)
    if (!permissao.ok) return permissao

    const fim = new Date(comando.inicio.getTime() + comando.duracaoMinutos * 60_000)
    const ocupadas = vista
      .listarPorProfissional(atual.profissionalId)
      .filter((consulta) => consulta.id !== atual.id && ocupaAgenda(consulta.situacao))
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

    const inicioNovo = new Date(comando.inicio)
    if (atual.inicio.getTime() === inicioNovo.getTime() && atual.fim.getTime() === fim.getTime()) {
      return sucesso(atual)
    }

    // A confirmação vale para o horário vigente. A antecedência da remarcação continua pendente.
    const atualizada: Agendamento = {
      ...atual,
      inicio: inicioNovo,
      fim,
      presencaConfirmada: false,
    }
    vista.substituir(atualizada, {
      agendamentoId: atualizada.id,
      autorId: comando.ator.id,
      momento: new Date(comando.agora),
      acao: "remarcar",
      situacaoAnterior: atual.situacao,
      situacaoNova: atual.situacao,
      motivo: null,
      horario: {
        inicioAnterior: new Date(atual.inicio),
        fimAnterior: new Date(atual.fim),
        inicioNovo,
        fimNovo: new Date(fim),
      },
    })
    return sucesso(atualizada)
  })
}
