import { instanteNoFuso, type Intervalo, type RelogioLocal } from "../../src/domain"

export function naClinica(ano: number, mes: number, dia: number, hora: number, minuto = 0): Date {
  const relogio: RelogioLocal = { ano, mes, dia, hora, minuto }
  return instanteNoFuso(relogio)
}

export function expedienteDoDia(ano: number, mes: number, dia: number, abertura = 8, fechamento = 18): Intervalo {
  return {
    inicio: naClinica(ano, mes, dia, abertura),
    fim: naClinica(ano, mes, dia, fechamento),
  }
}
