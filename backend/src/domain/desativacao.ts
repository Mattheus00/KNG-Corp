import type { Agendamento } from "./agendamento"

// Lista o que precisa ser remarcado. Não cancela nem apaga o histórico.
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
