import type { Agendamento, RegistroHistorico } from "../domain"

// A implementação no PostgreSQL precisa impedir a sobreposição na mesma transação,
// com EXCLUDE USING gist sobre profissional e intervalo, nas consultas que ocupam a agenda.
// O esquema ainda não existe: o isolamento da demonstração altera RLS e autenticação.
export type VistaAgenda = {
  listarPorProfissional(profissionalId: string): readonly Agendamento[]
  obter(id: string): Agendamento | null
  inserir(consulta: Agendamento, historico: RegistroHistorico): void
  substituir(consulta: Agendamento, historico: RegistroHistorico): void
}

export type AgendaRepositorio = {
  transacao<T>(operacao: (vista: VistaAgenda) => T): Promise<T>
}
