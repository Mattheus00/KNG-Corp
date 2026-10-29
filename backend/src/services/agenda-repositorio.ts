import type { Agendamento, RegistroHistorico } from "../domain"

// Resultado com ok: false e exceção não persistem escrita parcial. O simulador de
// testes desfaz o rascunho nesses dois casos. No PostgreSQL, a mesma transação
// precisa da exclusão GiST sobre profissional e intervalo. O esquema ainda não
// existe: o isolamento da demonstração altera RLS e autenticação.
export type VistaAgenda = {
  listarPorProfissional(profissionalId: string): readonly Agendamento[]
  obter(id: string): Agendamento | null
  inserir(consulta: Agendamento, historico: RegistroHistorico): void
  substituir(consulta: Agendamento, historico: RegistroHistorico): void
}

export type AgendaRepositorio = {
  transacao<T>(operacao: (vista: VistaAgenda) => T): Promise<T>
}
