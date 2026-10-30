import { describe, expect, test, vi } from "vitest"

vi.mock("server-only", () => ({}))

import {
  alternarContaDemonstrativa,
  alterarStatusFuncionarioSessao,
  cadastrarContaPacientePublico,
  convidarFuncionarioSessao,
  executarAgendamentoSessao,
  executarCancelamentoSessao,
  executarConfirmacaoPresencaSessao,
  executarMudancaSituacaoSessao,
  listarAgendamentosVisiveis,
  obterCenarioSessao,
  obterPainelGestorSessao,
  restaurarCenarioSessao,
} from "../src/data"

describe("cenário demonstrativo isolado por sessão", () => {
  test("isola alterações entre duas sessões de visitantes distintos e permite restaurar", async () => {
    const sessaoVisitanteA = "teste-sessao-a"
    const sessaoVisitanteB = "teste-sessao-b"

    restaurarCenarioSessao(sessaoVisitanteA)
    restaurarCenarioSessao(sessaoVisitanteB)

    const antesB = listarAgendamentosVisiveis(sessaoVisitanteB).length

    const cancelamentoA = await executarCancelamentoSessao(sessaoVisitanteA, {
      agendamentoId: "66666666-6666-4666-8666-666666666606",
      motivo: "Teste de isolamento de sessão",
    })
    expect(cancelamentoA.ok).toBe(true)

    const consultaEmB = listarAgendamentosVisiveis(sessaoVisitanteB).find(
      (c) => c.id === "66666666-6666-4666-8666-666666666606",
    )
    expect(consultaEmB?.situacao).toBe("agendado")
    expect(listarAgendamentosVisiveis(sessaoVisitanteB)).toHaveLength(antesB)

    restaurarCenarioSessao(sessaoVisitanteA)
    const restauradaEmA = listarAgendamentosVisiveis(sessaoVisitanteA).find(
      (c) => c.id === "66666666-6666-4666-8666-666666666606",
    )
    expect(restauradaEmA?.situacao).toBe("agendado")
  })

  test("cadastro público cria somente paciente e exige aceite dos termos", () => {
    const sessao = "teste-cadastro-publico"
    restaurarCenarioSessao(sessao)

    const semTermos = cadastrarContaPacientePublico(sessao, {
      nome: "Visitante Teste",
      email: "visitante@exemplo.invalid",
      telefone: "(11) 98888-7777",
      aceitouTermos: false,
    })
    expect(semTermos.ok).toBe(false)

    const comTermos = cadastrarContaPacientePublico(sessao, {
      nome: "Visitante Teste",
      email: "visitante@exemplo.invalid",
      telefone: "(11) 98888-7777",
      aceitouTermos: true,
    })
    expect(comTermos.ok).toBe(true)
    expect(obterCenarioSessao(sessao).atorAtual.papeis).toEqual(["paciente"])
  })

  test("fluxo completo entre recepção, dentista e gestor atualiza indicadores e trata desativação", async () => {
    const sessao = "teste-jornada-completa"
    restaurarCenarioSessao(sessao)

    // 1. Recepção confirma presença e registra chegada da consulta 605
    alternarContaDemonstrativa(sessao, "22222222-2222-4222-8222-222222222201")
    const conf = await executarConfirmacaoPresencaSessao(
      sessao,
      "66666666-6666-4666-8666-666666666605",
    )
    expect(conf.ok).toBe(true)

    const chegada = await executarMudancaSituacaoSessao(sessao, {
      agendamentoId: "66666666-6666-4666-8666-666666666605",
      situacao: "chegou",
    })
    expect(chegada.ok).toBe(true)

    // 2. Dentista (Dra. Helena) conclui atendimento da consulta 604 (que já estava em 'chegou')
    alternarContaDemonstrativa(sessao, "22222222-2222-4222-8222-222222222202")
    const inicioAtend = await executarMudancaSituacaoSessao(sessao, {
      agendamentoId: "66666666-6666-4666-8666-666666666604",
      situacao: "em_atendimento",
    })
    expect(inicioAtend.ok).toBe(true)

    const fimAtend = await executarMudancaSituacaoSessao(sessao, {
      agendamentoId: "66666666-6666-4666-8666-666666666604",
      situacao: "concluido",
    })
    expect(fimAtend.ok).toBe(true)

    // 3. Gestor consulta painel de indicadores e testa desativação de profissional com consulta futura
    alternarContaDemonstrativa(sessao, "22222222-2222-4222-8222-222222222204")
    const painel = obterPainelGestorSessao(sessao, { diasPeriodo: 7 })
    expect(painel.ok).toBe(true)
    if (painel.ok) {
      expect(painel.valor.indicadores.atendimentosConcluidos).toBeGreaterThanOrEqual(2)
    }

    const conviteInvalido = convidarFuncionarioSessao(sessao, {
      nome: "Tentativa Paciente",
      email: "invalido@exemplo.invalid",
      papeis: ["paciente"],
    })
    expect(conviteInvalido.ok).toBe(false)

    // Desativar Dra. Helena (que tem consulta futura amanhã 606) deve listar a consulta afetada sem apagá-la
    const desativacao = alterarStatusFuncionarioSessao(sessao, {
      funcionarioId: "22222222-2222-4222-8222-222222222202",
      ativo: false,
    })
    expect(desativacao.ok).toBe(true)
    if (desativacao.ok) {
      expect(
        desativacao.valor.consultasFuturasAfetadas.some(
          (c) => c.id === "66666666-6666-4666-8666-666666666606",
        ),
      ).toBe(true)
    }

    // Profissional desativado não pode receber novo agendamento
    const agendarEmInativo = await executarAgendamentoSessao(sessao, {
      pacienteId: "11111111-1111-4111-8111-111111111101",
      profissionalId: "33333333-3333-4333-8333-333333333301",
      servicoId: "44444444-4444-4444-8444-444444444401",
      inicio: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    })
    expect(agendarEmInativo.ok).toBe(false)
  })
})
