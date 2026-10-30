import { describe, expect, test, vi } from "vitest"

vi.mock("server-only", () => ({}))

import {
  alternarContaDemonstrativa,
  cadastrarClinicaSessao,
  executarRemarcacaoSessao,
  LIMITE_CLINICAS_POR_SESSAO,
  listarAgendamentosVisiveis,
  listarClinicasSessao,
  obterCenarioSessao,
  restaurarCenarioSessao,
  SLUG_CLINICA_EXEMPLO,
} from "../src/data"

const sessao = "teste-multiclinica"

function escopo(clinicaSlug: string) {
  return { sessaoId: sessao, clinicaSlug }
}

describe("várias clínicas na mesma sessão", () => {
  test("a clínica nova não vê consultas nem pacientes da Aurora", () => {
    restaurarCenarioSessao(escopo(SLUG_CLINICA_EXEMPLO))
    const criada = cadastrarClinicaSessao(sessao, {
      nome: "Clínica Leste",
      slug: "leste",
      responsavelNome: "Ana Gestor",
      responsavelEmail: "ana.leste@exemplo.invalid",
    })
    expect(criada.ok).toBe(true)

    const aurora = obterCenarioSessao(escopo(SLUG_CLINICA_EXEMPLO))
    const leste = obterCenarioSessao(escopo("leste"))
    expect(aurora?.consultas.length).toBeGreaterThan(0)
    expect(leste?.consultas).toEqual([])
    expect(leste?.pacientes).toEqual([])
    expect(leste?.atorAtual.papeis).toEqual(["gestor"])
    expect(listarAgendamentosVisiveis(escopo("leste"))).toEqual([])
  })

  test("o gestor de outra clínica não remarca consulta da Aurora", async () => {
    restaurarCenarioSessao(escopo(SLUG_CLINICA_EXEMPLO))
    cadastrarClinicaSessao(sessao, {
      nome: "Clínica Oeste",
      slug: "oeste",
      responsavelNome: "Bruno Gestor",
      responsavelEmail: "bruno.oeste@exemplo.invalid",
    })
    const consultaAurora = listarAgendamentosVisiveis(escopo(SLUG_CLINICA_EXEMPLO))[0]
    expect(consultaAurora).toBeDefined()

    const remarcacao = await executarRemarcacaoSessao(escopo("oeste"), {
      agendamentoId: consultaAurora!.id,
      inicio: new Date(Date.now() + 86_400_000).toISOString(),
    })
    expect(remarcacao.ok).toBe(false)
    if (!remarcacao.ok) expect(remarcacao.erro.codigo).toBe("consulta_nao_encontrada")
  })

  test("recusa slug reservado, duplicado e o limite de clínicas", () => {
    restaurarCenarioSessao(escopo(SLUG_CLINICA_EXEMPLO))
    const reservado = cadastrarClinicaSessao(sessao, {
      nome: "Outra Aurora",
      slug: "aurora",
      responsavelNome: "Carlos Dono",
      responsavelEmail: "carlos@exemplo.invalid",
    })
    expect(reservado.ok).toBe(false)

    const cadastro = cadastrarClinicaSessao(sessao, {
      nome: "Clínica Norte",
      slug: "Cadastro",
      responsavelNome: "Diana Dono",
      responsavelEmail: "diana@exemplo.invalid",
    })
    expect(cadastro.ok).toBe(false)

    const primeira = cadastrarClinicaSessao(sessao, {
      nome: "Clínica Norte",
      slug: "norte",
      responsavelNome: "Diana Dono",
      responsavelEmail: "diana@exemplo.invalid",
    })
    expect(primeira.ok).toBe(true)
    const duplicada = cadastrarClinicaSessao(sessao, {
      nome: "Clínica Norte 2",
      slug: "norte",
      responsavelNome: "Diana Dono",
      responsavelEmail: "diana2@exemplo.invalid",
    })
    expect(duplicada.ok).toBe(false)

    const segunda = cadastrarClinicaSessao(sessao, {
      nome: "Clínica Sul",
      slug: "sul",
      responsavelNome: "Edu Dono",
      responsavelEmail: "edu@exemplo.invalid",
    })
    expect(segunda.ok).toBe(true)
    expect(listarClinicasSessao(sessao)).toHaveLength(LIMITE_CLINICAS_POR_SESSAO)

    const terceira = cadastrarClinicaSessao(sessao, {
      nome: "Clínica Centro",
      slug: "centro",
      responsavelNome: "Fabi Dono",
      responsavelEmail: "fabi@exemplo.invalid",
    })
    expect(terceira.ok).toBe(false)
  })

  test("a conta demonstrativa da Aurora não entra na clínica criada", () => {
    restaurarCenarioSessao(escopo(SLUG_CLINICA_EXEMPLO))
    cadastrarClinicaSessao(sessao, {
      nome: "Clínica Ilha",
      slug: "ilha",
      responsavelNome: "Gabi Dono",
      responsavelEmail: "gabi@exemplo.invalid",
    })
    const troca = alternarContaDemonstrativa(
      escopo("ilha"),
      "22222222-2222-4222-8222-222222222201",
    )
    expect(troca.ok).toBe(false)
    expect(obterCenarioSessao(escopo("ilha"))?.nomeAtorAtual).toBe("Gabi Dono")
  })
})
