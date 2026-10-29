import { describe, expect, test } from "vitest"
import { FUSO_CLINICA, instanteNoFuso, relogioNoFuso } from "../src/domain"

describe("fuso da clínica", () => {
  test("interpreta o horário de parede em America/Sao_Paulo", () => {
    const instante = instanteNoFuso({ ano: 2026, mes: 1, dia: 15, hora: 9, minuto: 30 })

    expect(instante.toISOString()).toBe("2026-01-15T12:30:00.000Z")
    expect(relogioNoFuso(instante)).toEqual({
      ano: 2026,
      mes: 1,
      dia: 15,
      hora: 9,
      minuto: 30,
    })
  })

  test("mantém a meia-noite no mesmo dia civil da clínica", () => {
    const instante = instanteNoFuso({ ano: 2026, mes: 1, dia: 15, hora: 0, minuto: 0 })

    expect(instante.toISOString()).toBe("2026-01-15T03:00:00.000Z")
    expect(relogioNoFuso(instante, FUSO_CLINICA).dia).toBe(15)
  })
})
