export const PAPEIS = ["paciente", "recepcao", "dentista", "gestor"] as const

export type Papel = (typeof PAPEIS)[number]

export type Ator = {
  id: string
  papeis: readonly Papel[]
  profissionalId: string | null
}

export function papelDoCadastroPublico(): Papel {
  return "paciente"
}
