import { podeAlterarSituacao, podeConfirmarPresenca } from "../auth"
import {
  falha,
  motivoObrigatorio,
  sucesso,
  type Agendamento,
  type Ator,
  type Resultado,
  type SituacaoAtendimento,
} from "../domain"
import type { AgendaRepositorio } from "./agenda-repositorio"

export type ComandoAlterarSituacao = {
  ator: Ator
  agendamentoId: string
  situacao: SituacaoAtendimento
  motivo: string | null
  agora: Date
}

export type ComandoConfirmarPresenca = {
  ator: Ator
  agendamentoId: string
  agora: Date
}

export async function alterarSituacao(
  repositorio: AgendaRepositorio,
  comando: ComandoAlterarSituacao,
): Promise<Resultado<Agendamento>> {
  const motivo = comando.motivo?.trim() ?? ""
  if (motivoObrigatorio(comando.situacao) && motivo.length === 0) {
    return falha("motivo_obrigatorio", "Informe o motivo do cancelamento.")
  }

  return repositorio.transacao((vista) => {
    const atual = vista.obter(comando.agendamentoId)
    if (!atual) return falha("consulta_nao_encontrada", "A consulta não foi encontrada.")

    const permissao = podeAlterarSituacao(comando.ator, atual, comando.situacao)
    if (!permissao.ok) return permissao

    const atualizada: Agendamento = {
      ...atual,
      situacao: comando.situacao,
      motivoCancelamento: comando.situacao === "cancelado" ? motivo : atual.motivoCancelamento,
    }
    vista.substituir(atualizada, {
      agendamentoId: atualizada.id,
      autorId: comando.ator.id,
      momento: new Date(comando.agora),
      acao: "alterar_situacao",
      situacaoAnterior: atual.situacao,
      situacaoNova: comando.situacao,
      motivo: comando.situacao === "cancelado" ? motivo : null,
    })
    return sucesso(atualizada)
  })
}

export async function confirmarPresenca(
  repositorio: AgendaRepositorio,
  comando: ComandoConfirmarPresenca,
): Promise<Resultado<Agendamento>> {
  const permissao = podeConfirmarPresenca(comando.ator)
  if (!permissao.ok) return permissao

  return repositorio.transacao((vista) => {
    const atual = vista.obter(comando.agendamentoId)
    if (!atual) return falha("consulta_nao_encontrada", "A consulta não foi encontrada.")
    if (atual.situacao !== "agendado" && atual.situacao !== "chegou") {
      return falha("presenca_nao_permitida", "Não é possível confirmar a presença nesta situação.")
    }
    if (atual.presencaConfirmada) return sucesso(atual)

    const atualizada: Agendamento = { ...atual, presencaConfirmada: true }
    vista.substituir(atualizada, {
      agendamentoId: atualizada.id,
      autorId: comando.ator.id,
      momento: new Date(comando.agora),
      acao: "confirmar_presenca",
      situacaoAnterior: atual.situacao,
      situacaoNova: atual.situacao,
      motivo: null,
    })
    return sucesso(atualizada)
  })
}
