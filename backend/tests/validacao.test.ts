import { describe, expect, test } from "vitest"
import { lerPedidoAgendamento, lerPedidoCancelamento } from "../src/validation"

const id = "11111111-1111-4111-8111-111111111111"

describe("validação de entrada", () => {
  test("aceita o pedido de agendamento sem duração vinda do navegador", () => {
    const pedido = lerPedidoAgendamento({
      pacienteId: id,
      profissionalId: "22222222-2222-4222-8222-222222222222",
      servicoId: "33333333-3333-4333-8333-333333333333",
      inicio: "2026-10-30T12:00:00.000Z",
    })

    expect(pedido.ok).toBe(true)
  })

  test("rejeita identificador inválido sem devolver o valor informado", () => {
    const pedido = lerPedidoAgendamento({ pacienteId: "nao-e-uuid" })

    expect(pedido.ok).toBe(false)
    if (pedido.ok) return
    expect(pedido.erro.campos).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo: "pacienteId", mensagem: "Identificador inválido." })]),
    )
    expect(JSON.stringify(pedido.erro)).not.toContain("nao-e-uuid")
  })

  test("rejeita cancelamento sem motivo ou com motivo longo demais", () => {
    expect(lerPedidoCancelamento({ agendamentoId: id, motivo: "   " })).toMatchObject({
      ok: false,
      erro: { codigo: "entrada_invalida" },
    })
    expect(lerPedidoCancelamento({ agendamentoId: id, motivo: "a".repeat(201) })).toMatchObject({
      ok: false,
      erro: {
        codigo: "entrada_invalida",
        campos: [expect.objectContaining({ campo: "motivo", mensagem: "O texto informado é longo demais." })],
      },
    })
  })
})
