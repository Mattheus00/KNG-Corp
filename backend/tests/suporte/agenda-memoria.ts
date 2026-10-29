import {
  intervalosSobrepoem,
  ocupaAgenda,
  type Agendamento,
  type RegistroHistorico,
} from "../../src/domain"
import type { AgendaRepositorio, VistaAgenda } from "../../src/services"

export type AgendaMemoria = AgendaRepositorio & {
  listar(): readonly Agendamento[]
  listarHistorico(agendamentoId: string): readonly RegistroHistorico[]
}

export function criarAgendaMemoria(): AgendaMemoria {
  const consultas: Agendamento[] = []
  const registros: RegistroHistorico[] = []
  let cadeia: Promise<unknown> = Promise.resolve()

  return {
    transacao(operacao) {
      const execucao = cadeia.then(() => {
        const consultasRascunho = consultas.map(copiarAgendamento)
        const registrosRascunho = registros.map(copiarHistorico)
        const resultado = operacao(criarVista(consultasRascunho, registrosRascunho))
        if (!ehFalha(resultado)) {
          consultas.splice(0, consultas.length, ...consultasRascunho)
          registros.splice(0, registros.length, ...registrosRascunho)
        }
        return resultado
      })
      cadeia = execucao.then(
        () => undefined,
        () => undefined,
      )
      return execucao
    },
    listar() {
      return consultas.map(copiarAgendamento)
    },
    listarHistorico(agendamentoId) {
      return registros
        .filter((registro) => registro.agendamentoId === agendamentoId)
        .map(copiarHistorico)
    },
  }
}

function criarVista(consultas: Agendamento[], registros: RegistroHistorico[]): VistaAgenda {
  return {
    listarPorProfissional(profissionalId) {
      return consultas.filter((consulta) => consulta.profissionalId === profissionalId).map(copiarAgendamento)
    },
    obter(id) {
      const encontrada = consultas.find((consulta) => consulta.id === id)
      return encontrada ? copiarAgendamento(encontrada) : null
    },
    inserir(consulta, historico) {
      garantirSemConflito(consultas, consulta, null)
      consultas.push(copiarAgendamento(consulta))
      registros.push(copiarHistorico(historico))
    },
    substituir(consulta, historico) {
      const indice = consultas.findIndex((item) => item.id === consulta.id)
      if (indice < 0) {
        throw new Error("Consulta inexistente na substituição.")
      }
      garantirSemConflito(consultas, consulta, consulta.id)
      consultas[indice] = copiarAgendamento(consulta)
      registros.push(copiarHistorico(historico))
    },
  }
}

function ehFalha(valor: unknown): boolean {
  if (typeof valor !== "object" || valor === null || !("ok" in valor)) return false
  return valor.ok === false
}

function garantirSemConflito(
  consultas: readonly Agendamento[],
  consulta: Agendamento,
  ignorarId: string | null,
): void {
  if (!ocupaAgenda(consulta.situacao)) return
  const conflito = consultas.some(
    (existente) =>
      existente.id !== ignorarId &&
      existente.profissionalId === consulta.profissionalId &&
      ocupaAgenda(existente.situacao) &&
      intervalosSobrepoem(existente, consulta),
  )
  if (conflito) {
    throw new Error("Conflito de horário não impedido pela regra.")
  }
}

function copiarAgendamento(consulta: Agendamento): Agendamento {
  return {
    ...consulta,
    inicio: new Date(consulta.inicio),
    fim: new Date(consulta.fim),
  }
}

function copiarHistorico(registro: RegistroHistorico): RegistroHistorico {
  return {
    ...registro,
    momento: new Date(registro.momento),
    horario: registro.horario
      ? {
          inicioAnterior: new Date(registro.horario.inicioAnterior),
          fimAnterior: new Date(registro.horario.fimAnterior),
          inicioNovo: new Date(registro.horario.inicioNovo),
          fimNovo: new Date(registro.horario.fimNovo),
        }
      : null,
  }
}
