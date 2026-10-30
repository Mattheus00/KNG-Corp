import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

function aurora(sessaoId: string) {
  return { sessaoId, clinicaSlug: "aurora" }
}

import { transicaoPermitida } from "../src/domain/situacao"
import {
  alterarStatusFuncionarioSessao,
  alternarContaDemonstrativa,
  executarAgendamentoSessao,
  executarConfirmacaoPresencaSessao,
  executarMudancaSituacaoSessao,
  instanteClinica,
  listarAgendamentosVisiveis,
  normalizarSessaoIdSeguro,
  obterCenarioSessao,
  obterPainelGestorSessao,
  restaurarCenarioSessao,
} from "../src/data/cenario-demo"
import {
  lerCadastroPacientePublico,
  lerConviteFuncionario,
  lerPedidoAlterarSituacao,
} from "../src/validation/esquemas"

const ID_PACIENTE_MARIANA = "11111111-1111-4111-8111-111111111101"
const ID_RECEPCAO_LUCAS = "22222222-2222-4222-8222-222222222201"
const ID_DENTISTA_HELENA = "22222222-2222-4222-8222-222222222202"
const ID_GESTOR_ROBERTO = "22222222-2222-4222-8222-222222222204"
const ID_PROF_HELENA = "33333333-3333-4333-8333-333333333301"
const ID_SERVICO_AVALIACAO = "44444444-4444-4444-8444-444444444401"

describe("Auditoria de Cibersegurança — Prevenção de Vulnerabilidades", () => {
  it("previne Prototype Pollution / TypeError ao consultar propriedades herdadas em transicaoPermitida", () => {
    expect(() =>
      transicaoPermitida("agendado", "toString" as never, ["recepcao"]),
    ).not.toThrow()
    expect(transicaoPermitida("agendado", "toString" as never, ["recepcao"])).toBe(false)
    expect(transicaoPermitida("__proto__" as never, "chegou", ["recepcao"])).toBe(false)
    expect(transicaoPermitida("constructor" as never, "chegou", ["recepcao"])).toBe(false)
  })

  it("higieniza IDs de sessão maliciosos ou de protótipo com fallback efêmero isolado", () => {
    const sessaoProto = normalizarSessaoIdSeguro("__proto__")
    const sessaoCurta = normalizarSessaoIdSeguro("ab")
    const sessaoInjetada = normalizarSessaoIdSeguro("sessao; drop table")

    expect(sessaoProto).toMatch(/^sessao-efemera-/)
    expect(sessaoCurta).toMatch(/^sessao-efemera-/)
    expect(sessaoInjetada).toMatch(/^sessao-efemera-/)
    // Cada ID malicioso recebe uma sessão efêmera única para impedir compartilhamento de estado
    expect(sessaoProto).not.toBe(sessaoInjetada)
    expect(normalizarSessaoIdSeguro("demo-12345678-abcd")).toBe("demo-12345678-abcd")
  })

  it("revoga imediatamente permissões quando um funcionário é desativado pelo gestor", async () => {
    const sessao = "sec-test-revogacao-01"
    restaurarCenarioSessao(aurora(sessao))

    // Gestor desativa o recepcionista Lucas
    alternarContaDemonstrativa(aurora(sessao), ID_GESTOR_ROBERTO)
    const desativacao = alterarStatusFuncionarioSessao(aurora(sessao), {
      funcionarioId: ID_RECEPCAO_LUCAS,
      ativo: false,
    })
    expect(desativacao.ok).toBe(true)

    // Tentativa de alternar para o funcionário desativado falha
    const tentativaTroca = alternarContaDemonstrativa(aurora(sessao), ID_RECEPCAO_LUCAS)
    expect(tentativaTroca.ok).toBe(false)
    if (!tentativaTroca.ok) {
      expect(tentativaTroca.erro.codigo).toBe("sem_permissao")
    }

    // Mesmo se a sessão estivesse autenticada como Lucas antes da desativação, garante bloqueio imediato
    const estado = obterCenarioSessao(aurora(sessao))!
    estado.atorAtual = {
      id: ID_RECEPCAO_LUCAS,
      papeis: ["recepcao"],
      profissionalId: null,
    }
    const confirmacaoBloqueada = await executarConfirmacaoPresencaSessao(aurora(sessao),
      "66666666-6666-4666-8666-666666666605",
    )
    expect(confirmacaoBloqueada.ok).toBe(false)
    if (!confirmacaoBloqueada.ok) {
      expect(confirmacaoBloqueada.erro.codigo).toBe("sem_permissao")
    }
    expect(listarAgendamentosVisiveis(aurora(sessao))).toEqual([])
  })

  it("impede abuso de reservas em rota pública limitando reservas ativas simultâneas (máx 3) e antecedência (180 dias)", async () => {
    const sessao = "sec-test-limite-reservas-01"
    restaurarCenarioSessao(aurora(sessao))
    alternarContaDemonstrativa(aurora(sessao), ID_PACIENTE_MARIANA)

    // Calcula uma segunda-feira futura próxima dentro da janela de 180 dias
    const base = new Date()
    const diasAteSegunda = ((8 - base.getUTCDay()) % 7) || 7
    const segundaFutura = new Date(base.getTime() + (diasAteSegunda + 7) * 86_400_000)
    const ano = segundaFutura.getUTCFullYear()
    const mes = segundaFutura.getUTCMonth() + 1
    const dia = segundaFutura.getUTCDate()

    // Mariana já tem 1 consulta futura ativa (66666666-6666-4666-8666-666666666606).
    // 2ª reserva ativa:
    const r2 = await executarAgendamentoSessao(aurora(sessao), {
      pacienteId: ID_PACIENTE_MARIANA,
      profissionalId: ID_PROF_HELENA,
      servicoId: ID_SERVICO_AVALIACAO,
      inicio: instanteClinica(ano, mes, dia, 9, 0).toISOString(),
    })
    expect(r2.ok).toBe(true)

    // 3ª reserva ativa:
    const r3 = await executarAgendamentoSessao(aurora(sessao), {
      pacienteId: ID_PACIENTE_MARIANA,
      profissionalId: ID_PROF_HELENA,
      servicoId: ID_SERVICO_AVALIACAO,
      inicio: instanteClinica(ano, mes, dia, 10, 0).toISOString(),
    })
    expect(r3.ok).toBe(true)

    // 4ª reserva ativa simultânea deve ser recusada (LIMITE_RESERVAS_ATIVAS_POR_PACIENTE = 3):
    const r4 = await executarAgendamentoSessao(aurora(sessao), {
      pacienteId: ID_PACIENTE_MARIANA,
      profissionalId: ID_PROF_HELENA,
      servicoId: ID_SERVICO_AVALIACAO,
      inicio: instanteClinica(ano, mes, dia, 11, 0).toISOString(),
    })
    expect(r4.ok).toBe(false)
    if (!r4.ok) {
      expect(r4.erro.codigo).toBe("sem_permissao")
    }

    // Reserva além de 180 dias no futuro também deve ser recusada:
    const muitoDistante = new Date(base.getTime() + 240 * 86_400_000)
    const rDistante = await executarAgendamentoSessao(aurora(sessao), {
      pacienteId: ID_PACIENTE_MARIANA,
      profissionalId: ID_PROF_HELENA,
      servicoId: ID_SERVICO_AVALIACAO,
      inicio: muitoDistante.toISOString(),
    })
    expect(rDistante.ok).toBe(false)
    if (!rDistante.ok) {
      expect(rDistante.erro.codigo).toBe("entrada_invalida")
    }
  })

  it("aplica minimização de dados (LGPD) ocultando UUIDs internos de funcionários no histórico visível ao paciente", () => {
    const sessao = "sec-test-lgpd-01"
    restaurarCenarioSessao(aurora(sessao))
    alternarContaDemonstrativa(aurora(sessao), ID_PACIENTE_MARIANA)

    const visiveisPaciente = listarAgendamentosVisiveis(aurora(sessao))
    expect(visiveisPaciente.length).toBeGreaterThan(0)
    for (const ag of visiveisPaciente) {
      expect(ag.pacienteId).toBe(ID_PACIENTE_MARIANA)
      for (const reg of ag.historico) {
        expect(reg.autorId).not.toBe(ID_RECEPCAO_LUCAS)
        expect(reg.autorId).not.toBe(ID_DENTISTA_HELENA)
        expect(reg.autorId).not.toBe(ID_GESTOR_ROBERTO)
        expect([ID_PACIENTE_MARIANA, "equipe-clinica"]).toContain(reg.autorId)
      }
    }
  })

  it("rejeita payloads inválidos ou superdimensionados nos esquemas Zod de entrada", () => {
    const situacaoInvalida = lerPedidoAlterarSituacao({
      agendamentoId: "66666666-6666-4666-8666-666666666601",
      situacao: "__proto__",
    })
    expect(situacaoInvalida.ok).toBe(false)

    const cadastroGigante = lerCadastroPacientePublico({
      nome: "A".repeat(500),
      email: "teste@exemplo.com",
      telefone: "11999999999",
      aceitouTermos: true,
    })
    expect(cadastroGigante.ok).toBe(false)

    const conviteSemPermissao = lerConviteFuncionario({
      nome: "Teste",
      email: "teste@sgc.com",
      papeis: ["superadmin_inexistente"],
    })
    expect(conviteSemPermissao.ok).toBe(false)
  })

  it("bloqueia acesso do paciente ou dentista puro ao painel analítico exclusivo do gestor", async () => {
    const sessao = "sec-test-rbac-gestor-01"
    restaurarCenarioSessao(aurora(sessao))

    alternarContaDemonstrativa(aurora(sessao), ID_PACIENTE_MARIANA)
    const resPaciente = obterPainelGestorSessao(aurora(sessao))
    expect(resPaciente.ok).toBe(false)

    alternarContaDemonstrativa(aurora(sessao), ID_DENTISTA_HELENA)
    const resDentista = obterPainelGestorSessao(aurora(sessao))
    expect(resDentista.ok).toBe(false)

    // Paciente tampouco consegue mudar situação para 'chegou' ou 'concluido'
    alternarContaDemonstrativa(aurora(sessao), ID_PACIENTE_MARIANA)
    const tentativaMudanca = await executarMudancaSituacaoSessao(aurora(sessao), {
      agendamentoId: "66666666-6666-4666-8666-666666666606",
      situacao: "concluido",
    })
    expect(tentativaMudanca.ok).toBe(false)
  })
})
