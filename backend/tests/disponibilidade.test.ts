import { describe, expect, test } from "vitest"
import { avaliarReserva, horariosDisponiveis } from "../src/domain"
import { expedienteDoDia, naClinica } from "./suporte/relogio"

const dia = { ano: 2026, mes: 10, dia: 30 }
const agora = naClinica(2026, 10, 30, 8)
const expediente = [expedienteDoDia(dia.ano, dia.mes, dia.dia)]

describe("disponibilidade", () => {
  test("não oferece serviço de 60 minutos em uma janela livre de 30", () => {
    const ocupadas = [
      { inicio: naClinica(2026, 10, 30, 9), fim: naClinica(2026, 10, 30, 10) },
      { inicio: naClinica(2026, 10, 30, 10, 30), fim: naClinica(2026, 10, 30, 12) },
    ]

    const horarios = horariosDisponiveis({
      duracaoMinutos: 60,
      passoMinutos: 60,
      agora,
      expediente,
      bloqueios: [],
      ocupadas,
    })

    expect(horarios.map((horario) => horario.toISOString())).not.toContain(
      naClinica(2026, 10, 30, 10).toISOString(),
    )
    expect(
      avaliarReserva({
        inicio: naClinica(2026, 10, 30, 10),
        fim: naClinica(2026, 10, 30, 11),
        agora,
        profissionalHabilitado: true,
        expediente,
        bloqueios: [],
        ocupadas,
      }),
    ).toMatchObject({ ok: false, erro: { codigo: "conflito_horario" } })
  })

  test("recusa horário no passado e horário fora do expediente ou bloqueado", () => {
    expect(
      avaliarReserva({
        inicio: naClinica(2026, 10, 30, 7),
        fim: naClinica(2026, 10, 30, 8),
        agora,
        profissionalHabilitado: true,
        expediente,
        bloqueios: [],
        ocupadas: [],
      }),
    ).toMatchObject({ ok: false, erro: { codigo: "horario_no_passado" } })

    expect(
      avaliarReserva({
        inicio: naClinica(2026, 10, 30, 12),
        fim: naClinica(2026, 10, 30, 13),
        agora,
        profissionalHabilitado: true,
        expediente,
        bloqueios: [{ inicio: naClinica(2026, 10, 30, 12), fim: naClinica(2026, 10, 30, 14) }],
        ocupadas: [],
      }),
    ).toMatchObject({ ok: false, erro: { codigo: "fora_do_expediente" } })
  })

  test("não oferece horário anterior a agora, mesmo dentro do expediente", () => {
    const horarios = horariosDisponiveis({
      duracaoMinutos: 30,
      passoMinutos: 30,
      agora: naClinica(2026, 10, 30, 9, 15),
      expediente,
      bloqueios: [],
      ocupadas: [],
    })

    expect(horarios[0]?.toISOString()).toBe(naClinica(2026, 10, 30, 9, 30).toISOString())
  })

  test("intervalo ocupado deixa de ser ofertado", () => {
    const inicio = naClinica(2026, 10, 30, 9)
    const semOcupacao = horariosDisponiveis({
      duracaoMinutos: 60,
      passoMinutos: 60,
      agora,
      expediente,
      bloqueios: [],
      ocupadas: [],
    })
    const comOcupacao = horariosDisponiveis({
      duracaoMinutos: 60,
      passoMinutos: 60,
      agora,
      expediente,
      bloqueios: [],
      ocupadas: [{ inicio, fim: naClinica(2026, 10, 30, 10) }],
    })

    expect(semOcupacao.map((horario) => horario.toISOString())).toContain(inicio.toISOString())
    expect(comOcupacao.map((horario) => horario.toISOString())).not.toContain(inicio.toISOString())
  })

  test("recusa profissional que não realiza o serviço", () => {
    expect(
      avaliarReserva({
        inicio: naClinica(2026, 10, 30, 9),
        fim: naClinica(2026, 10, 30, 10),
        agora,
        profissionalHabilitado: false,
        expediente,
        bloqueios: [],
        ocupadas: [],
      }),
    ).toMatchObject({ ok: false, erro: { codigo: "profissional_nao_habilitado" } })
  })
})
