import { describe, expect, test } from "vitest"
import {
  calcularIndicadores,
  consultasAfetadasPorDesativacao,
  type Agendamento,
  type ConsultaParaIndicador,
} from "../src/domain"
import { expedienteDoDia, naClinica } from "./suporte/relogio"

const periodo = {
  inicio: naClinica(2026, 10, 30, 0),
  fim: naClinica(2026, 10, 31, 0),
}
const agora = naClinica(2026, 10, 30, 18)

function consulta(
  situacao: ConsultaParaIndicador["situacao"],
  hora: number,
  extras: Partial<ConsultaParaIndicador> = {},
): ConsultaParaIndicador {
  return {
    servicoId: "avaliacao",
    profissionalId: "profissional-1",
    inicio: naClinica(2026, 10, 30, hora),
    fim: naClinica(2026, 10, 30, hora + 1),
    situacao,
    motivoCancelamento: null,
    ...extras,
  }
}

describe("indicadores", () => {
  test("calcula faltas, ocupação e cancelamentos a partir dos registros", () => {
    const indicadores = calcularIndicadores({
      agora,
      periodo,
      expedientes: [
        {
          profissionalId: "profissional-1",
          expediente: [expedienteDoDia(2026, 10, 30)],
          bloqueios: [{ inicio: naClinica(2026, 10, 30, 12), fim: naClinica(2026, 10, 30, 13) }],
        },
      ],
      consultas: [
        consulta("concluido", 9),
        consulta("falta", 10),
        consulta("agendado", 11),
        consulta("cancelado", 14, { motivoCancelamento: "Imprevisto" }),
        consulta("cancelado", 15, { motivoCancelamento: "Imprevisto" }),
        consulta("falta", 16, { inicio: naClinica(2026, 10, 31, 9), fim: naClinica(2026, 10, 31, 10) }),
      ],
    })

    expect(indicadores.criterioData).toBe("data_prevista_da_consulta")
    expect(indicadores.atendimentosConcluidos).toBe(1)
    expect(indicadores.consultasPrevistas.falta).toBe(1)
    expect(indicadores.taxaFaltas).toEqual({ tipo: "valor", numerador: 1, denominador: 2, valor: 0.5 })
    expect(indicadores.ocupacaoPlanejada).toMatchObject({
      tipo: "valor",
      numerador: 180,
      denominador: 540,
    })
    expect(indicadores.cancelamentos).toEqual({
      total: 2,
      porMotivo: [{ motivo: "Imprevisto", quantidade: 2 }],
    })
    expect(indicadores.distribuicaoPorServico).toContainEqual({
      servicoId: "avaliacao",
      situacao: "concluido",
      quantidade: 1,
    })
  })

  test("mostra sem dados quando não há denominador", () => {
    const indicadores = calcularIndicadores({
      agora: naClinica(2026, 10, 30, 8),
      periodo,
      expedientes: [],
      consultas: [consulta("agendado", 11), consulta("falta", 15)],
    })

    expect(indicadores.taxaFaltas.tipo).toBe("sem_dados")
    expect(indicadores.ocupacaoPlanejada.tipo).toBe("sem_dados")
  })

  test("desativar profissional lista as consultas futuras sem apagá-las", () => {
    const futuras: Agendamento = {
      id: "futura",
      pacienteId: "paciente-1",
      profissionalId: "profissional-1",
      servicoId: "avaliacao",
      inicio: naClinica(2026, 10, 31, 9),
      fim: naClinica(2026, 10, 31, 10),
      situacao: "agendado",
      presencaConfirmada: false,
      motivoCancelamento: null,
    }
    const passada: Agendamento = {
      ...futuras,
      id: "passada",
      inicio: naClinica(2026, 10, 29, 9),
      fim: naClinica(2026, 10, 29, 10),
    }
    const cancelada: Agendamento = { ...futuras, id: "cancelada", situacao: "cancelado" }
    const todas = [futuras, passada, cancelada]

    const afetadas = consultasAfetadasPorDesativacao(todas, "profissional-1", naClinica(2026, 10, 30, 12))

    expect(afetadas.map((consulta) => consulta.id)).toEqual(["futura"])
    expect(todas).toHaveLength(3)
  })

  test("ocupação recorta consulta que atravessa o período e soma os profissionais", () => {
    const periodoCurto = {
      inicio: naClinica(2026, 10, 30, 10),
      fim: naClinica(2026, 10, 30, 11),
    }
    const indicadores = calcularIndicadores({
      agora: naClinica(2026, 10, 30, 12),
      periodo: periodoCurto,
      expedientes: [
        { profissionalId: "profissional-1", expediente: [periodoCurto], bloqueios: [] },
        { profissionalId: "profissional-2", expediente: [periodoCurto], bloqueios: [] },
      ],
      consultas: [
        consulta("agendado", 9, {
          inicio: naClinica(2026, 10, 30, 9, 30),
          fim: naClinica(2026, 10, 30, 10, 30),
        }),
        consulta("agendado", 10, { profissionalId: "profissional-2" }),
        consulta("cancelado", 10),
        consulta("agendado", 9, { fim: naClinica(2026, 10, 30, 10) }),
        consulta("agendado", 11),
      ],
    })

    expect(indicadores.consultasPrevistas.agendado).toBe(1)
    expect(indicadores.ocupacaoPlanejada).toEqual({
      tipo: "valor",
      numerador: 90,
      denominador: 120,
      valor: 0.75,
    })
  })
})
