import type { Agendamento } from "./agendamento"

// Lista consultas futuras que ainda precisam de remarcação. Não cancela, não
// transfere e não apaga o histórico. Atendimento já iniciado, cujo horário de
// início já passou, fica de fora: o tratamento operacional continua pendente.
export function consultasAfetadasPorDesativacao<T extends Pick<Agendamento, "profissionalId" | "inicio" | "situacao">>(
  consultas: readonly T[],
  profissionalId: string,
  agora: Date,
): T[] {
  return consultas.filter(
    (consulta) =>
      consulta.profissionalId === profissionalId &&
      consulta.inicio >= agora &&
      (consulta.situacao === "agendado" ||
        consulta.situacao === "chegou" ||
        consulta.situacao === "em_atendimento"),
  )
}
