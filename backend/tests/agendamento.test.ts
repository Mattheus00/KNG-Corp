import { describe, expect, test } from "vitest"
import type { Ator } from "../src/domain"
import { agendar, alterarSituacao, confirmarPresenca, remarcar } from "../src/services"
import { criarAgendaMemoria } from "./suporte/agenda-memoria"
import { expedienteDoDia, naClinica } from "./suporte/relogio"

const recepcao: Ator = { id: "recepcao-1", papeis: ["recepcao"], profissionalId: null }
const paciente: Ator = { id: "paciente-1", papeis: ["paciente"], profissionalId: null }
const outroPaciente: Ator = { id: "paciente-2", papeis: ["paciente"], profissionalId: null }
const dentista: Ator = { id: "dentista-1", papeis: ["dentista"], profissionalId: "profissional-1" }

const agora = naClinica(2026, 10, 30, 8)
const expediente = [expedienteDoDia(2026, 10, 30)]
const profissionalId = "profissional-1"
const outroProfissional = "profissional-2"

function comandoAgendar(ator: Ator, pacienteId: string, hora: number, profissional = profissionalId) {
  return {
    ator,
    pacienteId,
    profissionalId: profissional,
    servicoId: "avaliacao",
    inicio: naClinica(2026, 10, 30, hora),
    duracaoMinutos: 60,
    agora,
    profissionalHabilitado: true,
    expediente,
    bloqueios: [],
  }
}

describe("agendamento", () => {
  test("duas reservas simultâneas do mesmo horário deixam uma só consulta", async () => {
    const agenda = criarAgendaMemoria()

    const [primeira, segunda] = await Promise.all([
      agendar(agenda, comandoAgendar(recepcao, "paciente-1", 9)),
      agendar(agenda, comandoAgendar(recepcao, "paciente-2", 9)),
    ])

    const resultados = [primeira, segunda]
    expect(resultados.filter((resultado) => resultado.ok)).toHaveLength(1)
    expect(resultados.filter((resultado) => !resultado.ok && resultado.erro.codigo === "conflito_horario")).toHaveLength(1)
    expect(agenda.listar()).toHaveLength(1)
  })

  test("outro profissional pode ser reservado no mesmo horário", async () => {
    const agenda = criarAgendaMemoria()

    const primeira = await agendar(agenda, comandoAgendar(recepcao, "paciente-1", 9))
    const segunda = await agendar(agenda, comandoAgendar(recepcao, "paciente-2", 9, outroProfissional))

    expect(primeira.ok).toBe(true)
    expect(segunda.ok).toBe(true)
  })

  test("remarcação que não cabe preserva a consulta original", async () => {
    const agenda = criarAgendaMemoria()
    const criada = await agendar(agenda, comandoAgendar(paciente, paciente.id, 9))
    if (!criada.ok) throw new Error(criada.erro.mensagem)
    await agendar(agenda, comandoAgendar(recepcao, "paciente-2", 11))

    const remarcacao = await remarcar(agenda, {
      ator: paciente,
      agendamentoId: criada.valor.id,
      inicio: naClinica(2026, 10, 30, 11),
      duracaoMinutos: 60,
      agora,
      profissionalHabilitado: true,
      expediente,
      bloqueios: [],
    })

    expect(remarcacao).toMatchObject({ ok: false, erro: { codigo: "conflito_horario" } })
    expect(agenda.listar().find((consulta) => consulta.id === criada.valor.id)?.inicio.toISOString()).toBe(
      naClinica(2026, 10, 30, 9).toISOString(),
    )
    expect(agenda.listarHistorico(criada.valor.id).map((registro) => registro.acao)).toEqual(["agendar"])
  })

  test("cancelamento libera o horário e guarda o motivo e a situação anterior", async () => {
    const agenda = criarAgendaMemoria()
    const criada = await agendar(agenda, comandoAgendar(paciente, paciente.id, 9))
    if (!criada.ok) throw new Error(criada.erro.mensagem)

    const semMotivo = await alterarSituacao(agenda, {
      ator: paciente,
      agendamentoId: criada.valor.id,
      situacao: "cancelado",
      motivo: "   ",
      agora,
      })
    expect(semMotivo).toMatchObject({ ok: false, erro: { codigo: "motivo_obrigatorio" } })

    const cancelada = await alterarSituacao(agenda, {
      ator: paciente,
      agendamentoId: criada.valor.id,
      situacao: "cancelado",
      motivo: "Não poderei comparecer",
      agora,
    })
    expect(cancelada.ok).toBe(true)

    const historico = agenda.listarHistorico(criada.valor.id)
    expect(historico.at(-1)).toMatchObject({
      acao: "alterar_situacao",
      situacaoAnterior: "agendado",
      situacaoNova: "cancelado",
      motivo: "Não poderei comparecer",
      autorId: paciente.id,
    })

    const nova = await agendar(agenda, comandoAgendar(recepcao, "paciente-2", 9))
    expect(nova.ok).toBe(true)
  })

  test("paciente não agenda nem remarca consulta de outra pessoa", async () => {
    const agenda = criarAgendaMemoria()
    const criada = await agendar(agenda, comandoAgendar(recepcao, paciente.id, 9))
    if (!criada.ok) throw new Error(criada.erro.mensagem)

    const agendaAlheia = await agendar(agenda, comandoAgendar(outroPaciente, paciente.id, 15))
    expect(agendaAlheia).toMatchObject({ ok: false, erro: { codigo: "sem_permissao" } })

    const remarcacao = await remarcar(agenda, {
      ator: outroPaciente,
      agendamentoId: criada.valor.id,
      inicio: naClinica(2026, 10, 30, 15),
      duracaoMinutos: 60,
      agora,
      profissionalHabilitado: true,
      expediente,
      bloqueios: [],
    })

    expect(remarcacao).toMatchObject({ ok: false, erro: { codigo: "sem_permissao" } })
  })

  test("confirmação de presença não muda a situação, e o dentista só conclui depois da chegada", async () => {
    const agenda = criarAgendaMemoria()
    const criada = await agendar(agenda, comandoAgendar(recepcao, paciente.id, 9))
    if (!criada.ok) throw new Error(criada.erro.mensagem)

    const presenca = await confirmarPresenca(agenda, {
      ator: recepcao,
      agendamentoId: criada.valor.id,
      agora,
    })
    expect(presenca.ok && presenca.valor.situacao).toBe("agendado")
    expect(presenca.ok && presenca.valor.presencaConfirmada).toBe(true)

    const inicioDireto = await alterarSituacao(agenda, {
      ator: dentista,
      agendamentoId: criada.valor.id,
      situacao: "em_atendimento",
      motivo: null,
      agora,
    })
    expect(inicioDireto).toMatchObject({ ok: false, erro: { codigo: "transicao_invalida" } })

    const chegada = await alterarSituacao(agenda, {
      ator: recepcao,
      agendamentoId: criada.valor.id,
      situacao: "chegou",
      motivo: null,
      agora,
    })
    const atendimento = await alterarSituacao(agenda, {
      ator: dentista,
      agendamentoId: criada.valor.id,
      situacao: "em_atendimento",
      motivo: null,
      agora,
    })
    const conclusao = await alterarSituacao(agenda, {
      ator: dentista,
      agendamentoId: criada.valor.id,
      situacao: "concluido",
      motivo: null,
      agora,
    })

    expect(chegada.ok).toBe(true)
    expect(atendimento.ok).toBe(true)
    expect(conclusao.ok && conclusao.valor.situacao).toBe("concluido")
  })
})
