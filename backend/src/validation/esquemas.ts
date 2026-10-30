import {
  falha,
  LIMITE_MOTIVO_CANCELAMENTO,
  PAPEIS,
  SITUACOES_ATENDIMENTO,
  sucesso,
  type ErroCampo,
  type Resultado,
} from "../domain"
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
  motivo: z.string().trim().min(1).max(LIMITE_MOTIVO_CANCELAMENTO),
})

export const esquemaPedidoAlterarSituacao = z.object({
  agendamentoId: id,
  situacao: z.enum(SITUACOES_ATENDIMENTO),
  motivo: z.string().trim().max(LIMITE_MOTIVO_CANCELAMENTO).nullable().optional(),
})

export const esquemaPedidoConfirmarPresenca = z.object({
  agendamentoId: id,
})

export const esquemaCadastroPacientePublico = z.object({
  nome: z.string().trim().min(3).max(120),
  email: z.email().max(160),
  telefone: z.string().trim().min(8).max(30),
  aceitouTermos: z.literal(true),
})

export const esquemaAtualizacaoPaciente = z.object({
  pacienteId: id,
  nome: z.string().trim().min(3).max(120),
  email: z.string().trim().max(160),
  telefone: z.string().trim().min(8).max(30),
})

export const esquemaCadastroPacienteRecepcao = z.object({
  nome: z.string().trim().min(3).max(120),
  telefone: z.string().trim().min(8).max(30),
  email: z.string().trim().max(160).optional(),
})

export const esquemaConviteFuncionario = z.object({
  nome: z.string().trim().min(3).max(120),
  email: z.email().max(160),
  papeis: z.array(z.enum(PAPEIS)).min(1).max(4),
  especialidade: z.string().trim().max(120).optional(),
})

export type PedidoAgendamento = z.infer<typeof esquemaPedidoAgendamento>
export type PedidoRemarcacao = z.infer<typeof esquemaPedidoRemarcacao>
export type PedidoCancelamento = z.infer<typeof esquemaPedidoCancelamento>
export type PedidoAlterarSituacao = z.infer<typeof esquemaPedidoAlterarSituacao>
export type PedidoConfirmarPresenca = z.infer<typeof esquemaPedidoConfirmarPresenca>
export type CadastroPacientePublico = z.infer<typeof esquemaCadastroPacientePublico>
export type AtualizacaoPaciente = z.infer<typeof esquemaAtualizacaoPaciente>
export type CadastroPacienteRecepcao = z.infer<typeof esquemaCadastroPacienteRecepcao>
export type ConviteFuncionario = z.infer<typeof esquemaConviteFuncionario>

export function lerPedidoAgendamento(entrada: unknown): Resultado<PedidoAgendamento> {
  return ler(esquemaPedidoAgendamento, entrada, "Os dados do agendamento são inválidos.")
}

export function lerPedidoRemarcacao(entrada: unknown): Resultado<PedidoRemarcacao> {
  return ler(esquemaPedidoRemarcacao, entrada, "Os dados da remarcação são inválidos.")
}

export function lerPedidoCancelamento(entrada: unknown): Resultado<PedidoCancelamento> {
  return ler(esquemaPedidoCancelamento, entrada, "Os dados do cancelamento são inválidos.")
}

export function lerPedidoAlterarSituacao(entrada: unknown): Resultado<PedidoAlterarSituacao> {
  return ler(esquemaPedidoAlterarSituacao, entrada, "Os dados da alteração de situação são inválidos.")
}

export function lerPedidoConfirmarPresenca(entrada: unknown): Resultado<PedidoConfirmarPresenca> {
  return ler(esquemaPedidoConfirmarPresenca, entrada, "O identificador da consulta é inválido.")
}

export function lerCadastroPacientePublico(entrada: unknown): Resultado<CadastroPacientePublico> {
  return ler(
    esquemaCadastroPacientePublico,
    entrada,
    "Verifique o preenchimento de nome, e-mail, telefone e aceite dos termos.",
  )
}

export function lerAtualizacaoPaciente(entrada: unknown): Resultado<AtualizacaoPaciente> {
  return ler(esquemaAtualizacaoPaciente, entrada, "Os dados básicos informados são inválidos.")
}

export function lerCadastroPacienteRecepcao(entrada: unknown): Resultado<CadastroPacienteRecepcao> {
  return ler(esquemaCadastroPacienteRecepcao, entrada, "Os dados do paciente são inválidos.")
}

export function lerConviteFuncionario(entrada: unknown): Resultado<ConviteFuncionario> {
  return ler(esquemaConviteFuncionario, entrada, "Os dados do convite de funcionário são inválidos.")
}

function ler<T>(esquema: z.ZodType<T>, entrada: unknown, mensagem: string): Resultado<T> {
  const lido = esquema.safeParse(entrada)
  if (!lido.success) return falha("entrada_invalida", mensagem, camposDoErro(lido.error.issues))
  return sucesso(lido.data)
}

function camposDoErro(issues: readonly z.core.$ZodIssue[]): ErroCampo[] {
  return issues.map((issue) => ({
    campo: issue.path.length > 0 ? issue.path.map(String).join(".") : "entrada",
    mensagem: mensagemDoCampo(issue),
  }))
}

function mensagemDoCampo(issue: z.core.$ZodIssue): string {
  if (issue.code === "invalid_format" && issue.format === "uuid") return "Identificador inválido."
  if (issue.code === "invalid_format" && issue.format === "email") return "E-mail inválido."
  if (issue.code === "invalid_format" && (issue.format === "datetime" || issue.format === "date")) {
    return "Data inválida."
  }
  if (issue.code === "too_small") return "Preencha este campo."
  if (issue.code === "too_big") return "O texto informado é longo demais."
  return "Valor em formato inválido."
}
