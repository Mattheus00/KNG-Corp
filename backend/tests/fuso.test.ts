import { describe, expect, test } from "vitest"
import { FUSO_CLINICA, instanteNoFuso, relogioNoFuso } from "../src/domain"

describe("fuso da clínica", () => {
  test("interpreta o horário de parede em America/Sao_Paulo", () => {
    const instante = instanteNoFuso({ ano: 2026, mes: 1, dia: 15, hora: 9, minuto: 30 })
    expect(instante.ok).toBe(true)
    if (!instante.ok) return

    expect(instante.valor.toISOString()).toBe("2026-01-15T12:30:00.000Z")
    expect(relogioNoFuso(instante.valor)).toEqual({
      ano: 2026,
      mes: 1,
      dia: 15,
      hora: 9,
      minuto: 30,
    })
  })

  test("mantém a meia-noite no mesmo dia civil da clínica", () => {
    const instante = instanteNoFuso({ ano: 2026, mes: 1, dia: 15, hora: 0, minuto: 0 })
    expect(instante.ok).toBe(true)
    if (!instante.ok) return

    expect(instante.valor.toISOString()).toBe("2026-01-15T03:00:00.000Z")
    expect(relogioNoFuso(instante.valor, FUSO_CLINICA).dia).toBe(15)
  })

  test("aceita 29 de fevereiro em ano bissexto e recusa data civil inexistente", () => {
    const bissexto = instanteNoFuso({ ano: 2024, mes: 2, dia: 29, hora: 0, minuto: 0 })
    expect(bissexto.ok).toBe(true)
    if (bissexto.ok) expect(bissexto.valor.toISOString()).toBe("2024-02-29T03:00:00.000Z")

    expect(instanteNoFuso({ ano: 2026, mes: 2, dia: 31, hora: 9, minuto: 0 })).toMatchObject({
      ok: false,
      erro: { codigo: "entrada_invalida" },
    })
    expect(instanteNoFuso({ ano: 2026, mes: 2, dia: 29, hora: 9, minuto: 0 }).ok).toBe(false)
    expect(instanteNoFuso({ ano: 2026, mes: 1, dia: 15, hora: 24, minuto: 0 }).ok).toBe(false)
  })
})
