import { falha, sucesso, type Resultado } from "./resultado"
import { intervalosSobrepoem, subtrairIntervalos, type Intervalo } from "./intervalo"

export type PedidoDisponibilidade = {
  duracaoMinutos: number
  passoMinutos: number
  agora: Date
  expediente: readonly Intervalo[]
  bloqueios: readonly Intervalo[]
  ocupadas: readonly Intervalo[]
}

export type ContextoReserva = {
  inicio: Date
  fim: Date
  agora: Date
  profissionalHabilitado: boolean
  expediente: readonly Intervalo[]
  bloqueios: readonly Intervalo[]
  ocupadas: readonly Intervalo[]
}

export function duracaoAtendimentoValida(duracaoMinutos: number): boolean {
  return Number.isInteger(duracaoMinutos) && duracaoMinutos > 0
}

// O passo é explícito. Sem uma grade aprovada, quem chama informa o passo;
// o agendamento usa a duração do serviço, alinhada ao início de cada trecho livre.
export function horariosDisponiveis(pedido: PedidoDisponibilidade): Date[] {
  if (!duracaoAtendimentoValida(pedido.duracaoMinutos) || !duracaoAtendimentoValida(pedido.passoMinutos)) {
    return []
  }

  const livres = subtrairIntervalos(
    subtrairIntervalos(pedido.expediente, pedido.bloqueios),
    pedido.ocupadas,
  )
  const duracaoMs = pedido.duracaoMinutos * 60_000
  const passoMs = pedido.passoMinutos * 60_000
  const inicios: Date[] = []

  for (const livre of livres) {
    let cursor = livre.inicio.getTime()
    const limite = livre.fim.getTime()
    while (cursor + duracaoMs <= limite) {
      if (cursor >= pedido.agora.getTime()) {
        inicios.push(new Date(cursor))
      }
      cursor += passoMs
    }
  }

  inicios.sort((esquerda, direita) => esquerda.getTime() - direita.getTime())
  return inicios
}

export function avaliarReserva(contexto: ContextoReserva): Resultado<null> {
  if (
    Number.isNaN(contexto.inicio.getTime()) ||
    Number.isNaN(contexto.fim.getTime()) ||
    contexto.fim <= contexto.inicio
  ) {
    return falha("duracao_invalida", "O horário do atendimento é inválido.")
  }

  if (contexto.inicio < contexto.agora) {
    return falha("horario_no_passado", "Não é possível agendar em um horário que já passou.")
  }

  if (!contexto.profissionalHabilitado) {
    return falha("profissional_nao_habilitado", "Este profissional não realiza o serviço escolhido.")
  }

  const pedido = { inicio: contexto.inicio, fim: contexto.fim }
  if (contexto.ocupadas.some((ocupada) => intervalosSobrepoem(pedido, ocupada))) {
    return falha("conflito_horario", "Esse horário não está mais disponível.")
  }

  const livres = subtrairIntervalos(contexto.expediente, contexto.bloqueios)
  const cabe = livres.some((livre) => livre.inicio <= contexto.inicio && contexto.fim <= livre.fim)
  if (!cabe) {
    return falha("fora_do_expediente", "O horário está fora do expediente ou em um período bloqueado.")
  }

  return sucesso(null)
}
