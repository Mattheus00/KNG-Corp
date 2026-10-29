import { describe, expect, test } from "vitest"
import { podeAlterarSituacao, podeAtribuirPapel, podeLerAgendamento } from "../src/auth"
import { papelDoCadastroPublico, transicaoPermitida, type Ator } from "../src/domain"

const paciente: Ator = { id: "paciente-1", papeis: ["paciente"], profissionalId: null }
const recepcao: Ator = { id: "recepcao-1", papeis: ["recepcao"], profissionalId: null }
const dentista: Ator = { id: "dentista-1", papeis: ["dentista"], profissionalId: "profissional-1" }
const gestor: Ator = { id: "gestor-1", papeis: ["gestor"], profissionalId: null }

const consulta = {
  pacienteId: "paciente-1",
  profissionalId: "profissional-1",
  situacao: "agendado" as const,
}

describe("papéis e transições", () => {
  test("cadastro público cria somente paciente", () => {
    expect(papelDoCadastroPublico()).toBe("paciente")
    expect(podeAtribuirPapel(gestor, "paciente")).toBe(false)
  })

  test("recepção não concede papel de gestor", () => {
    expect(podeAtribuirPapel(recepcao, "gestor")).toBe(false)
    expect(podeAtribuirPapel(gestor, "dentista")).toBe(true)
  })

  test("paciente não lê nem altera consulta de outra pessoa", () => {
    const alheia = { ...consulta, pacienteId: "paciente-2" }

    expect(podeLerAgendamento(paciente, alheia)).toBe(false)
    expect(podeAlterarSituacao(paciente, alheia, "cancelado")).toMatchObject({
      ok: false,
      erro: { codigo: "sem_permissao" },
    })
  })

  test("dentista não inicia o atendimento antes da chegada e gestor não conduz o atendimento", () => {
    expect(transicaoPermitida("agendado", "em_atendimento", dentista.papeis)).toBe(false)
    expect(podeAlterarSituacao(dentista, consulta, "em_atendimento")).toMatchObject({
      ok: false,
      erro: { codigo: "transicao_invalida" },
    })
    expect(podeAlterarSituacao(gestor, { ...consulta, situacao: "chegou" }, "em_atendimento")).toMatchObject({
      ok: false,
      erro: { codigo: "sem_permissao" },
    })
  })

  test("dentista lê a própria agenda e a recepção lê a operação", () => {
    expect(podeLerAgendamento(dentista, consulta)).toBe(true)
    expect(podeLerAgendamento(dentista, { ...consulta, profissionalId: "outro" })).toBe(false)
    expect(podeLerAgendamento(recepcao, { ...consulta, pacienteId: "paciente-2" })).toBe(true)
  })
})
