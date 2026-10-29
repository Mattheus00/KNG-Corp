import { falha, sucesso, type Resultado } from "../domain"
import { z } from "zod"

const id = z.uuid()

// A duração não vem do navegador. A rota resolve a duração pelo serviço cadastrado.
export const esquemaPedidoAgendamento = z.object({
  pacienteId: id,
  profissionalId: id,
  servicoId: id,
  inicio: z.iso.datetime(),
})

export const esquemaPedidoRemarcacao = z.object({
  agendamentoId: id,
  inicio: z.iso.datetime(),
})

export const esquemaPedidoCancelamento = z.object({
  agendamentoId: id,
  motivo: z.string().trim().min(1),
})

export type PedidoAgendamento = z.infer<typeof esquemaPedidoAgendamento>
export type PedidoRemarcacao = z.infer<typeof esquemaPedidoRemarcacao>
export type PedidoCancelamento = z.infer<typeof esquemaPedidoCancelamento>

export function lerPedidoAgendamento(entrada: unknown): Resultado<PedidoAgendamento> {
  return ler(esquemaPedidoAgendamento, entrada, "Os dados do agendamento são inválidos.")
}

export function lerPedidoRemarcacao(entrada: unknown): Resultado<PedidoRemarcacao> {
  return ler(esquemaPedidoRemarcacao, entrada, "Os dados da remarcação são inválidos.")
}

export function lerPedidoCancelamento(entrada: unknown): Resultado<PedidoCancelamento> {
  return ler(esquemaPedidoCancelamento, entrada, "Os dados do cancelamento são inválidos.")
}

function ler<T>(esquema: z.ZodType<T>, entrada: unknown, mensagem: string): Resultado<T> {
  const lido = esquema.safeParse(entrada)
  if (!lido.success) return falha("entrada_invalida", mensagem)
  return sucesso(lido.data)
}
