import { describe, expect, test } from "vitest"
import type { Agendamento, RegistroHistorico } from "../src/domain"
import { criarAgendaMemoria } from "./suporte/agenda-memoria"
import { naClinica } from "./suporte/relogio"

const consulta: Agendamento = {
  id: "consulta-1",
  pacienteId: "paciente-1",
  profissionalId: "profissional-1",
  servicoId: "avaliacao",
  inicio: naClinica(2026, 10, 30, 9),
  fim: naClinica(2026, 10, 30, 10),
  situacao: "agendado",
  presencaConfirmada: false,
  motivoCancelamento: null,
}

const historico: RegistroHistorico = {
  agendamentoId: consulta.id,
  autorId: "recepcao-1",
  momento: naClinica(2026, 10, 30, 8),
  acao: "agendar",
  situacaoAnterior: null,
  situacaoNova: "agendado",
  motivo: null,
  horario: null,
}

describe("transação em memória", () => {
  test("exceção depois da escrita desfaz consulta e histórico", async () => {
    const agenda = criarAgendaMemoria()

    await expect(
      agenda.transacao((vista) => {
        vista.inserir(consulta, historico)
        throw new Error("falha de persistência")
      }),
    ).rejects.toThrow("falha de persistência")

    expect(agenda.listar()).toHaveLength(0)
    expect(agenda.listarHistorico(consulta.id)).toHaveLength(0)
  })

  test("falha de negócio depois da escrita também desfaz", async () => {
    const agenda = criarAgendaMemoria()

    const resultado = await agenda.transacao((vista) => {
      vista.inserir(consulta, historico)
      return { ok: false as const, erro: { codigo: "conflito_horario" as const, mensagem: "Esse horário não está mais disponível." } }
    })

    expect(resultado.ok).toBe(false)
    expect(agenda.listar()).toHaveLength(0)
    expect(agenda.listarHistorico(consulta.id)).toHaveLength(0)
  })
})
