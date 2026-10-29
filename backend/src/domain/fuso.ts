import { falha, sucesso, type Resultado } from "./resultado"

export const FUSO_CLINICA = "America/Sao_Paulo"

export type RelogioLocal = {
  ano: number
  mes: number
  dia: number
  hora: number
  minuto: number
}

export function relogioNoFuso(instante: Date, fuso = FUSO_CLINICA): RelogioLocal {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instante)

  return {
    ano: lerParte(partes, "year"),
    mes: lerParte(partes, "month"),
    dia: lerParte(partes, "day"),
    hora: lerParte(partes, "hour"),
    minuto: lerParte(partes, "minute"),
  }
}

// Converte um horário de parede em instante e só aceita o resultado se ele
// representar exatamente essa data civil. America/Sao_Paulo não tem horário de verão
// desde 2019; um horário que não exista no fuso é recusado, sem escolher um lado.
export function instanteNoFuso(relogio: RelogioLocal, fuso = FUSO_CLINICA): Resultado<Date> {
  if (!relogioCivilValido(relogio)) {
    return falha("entrada_invalida", "A data informada não existe no calendário.")
  }

  let utc = Date.UTC(relogio.ano, relogio.mes - 1, relogio.dia, relogio.hora, relogio.minuto)
  const desejado = utc

  for (let tentativa = 0; tentativa < 2; tentativa += 1) {
    const observado = relogioNoFuso(new Date(utc), fuso)
    const observadoComoUtc = Date.UTC(
      observado.ano,
      observado.mes - 1,
      observado.dia,
      observado.hora,
      observado.minuto,
    )
    utc += desejado - observadoComoUtc
  }

  const instante = new Date(utc)
  if (Number.isNaN(instante.getTime())) {
    return falha("entrada_invalida", "Não foi possível converter o horário da clínica.")
  }

  const conferido = relogioNoFuso(instante, fuso)
  if (!mesmoRelogio(conferido, relogio)) {
    return falha("entrada_invalida", "Esse horário não existe no fuso da clínica.")
  }

  return sucesso(instante)
}

function relogioCivilValido(relogio: RelogioLocal): boolean {
  return (
    inteiroNaFaixa(relogio.ano, 1, 9999) &&
    inteiroNaFaixa(relogio.mes, 1, 12) &&
    inteiroNaFaixa(relogio.dia, 1, diasNoMes(relogio.ano, relogio.mes)) &&
    inteiroNaFaixa(relogio.hora, 0, 23) &&
    inteiroNaFaixa(relogio.minuto, 0, 59)
  )
}

function inteiroNaFaixa(valor: number, minimo: number, maximo: number): boolean {
  return Number.isInteger(valor) && valor >= minimo && valor <= maximo
}

function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate()
}

function mesmoRelogio(obtido: RelogioLocal, esperado: RelogioLocal): boolean {
  return (
    obtido.ano === esperado.ano &&
    obtido.mes === esperado.mes &&
    obtido.dia === esperado.dia &&
    obtido.hora === esperado.hora &&
    obtido.minuto === esperado.minuto
  )
}

function lerParte(partes: Intl.DateTimeFormatPart[], tipo: Intl.DateTimeFormatPartTypes): number {
  const valor = partes.find((parte) => parte.type === tipo)?.value
  if (valor === undefined) {
    throw new Error(`Não foi possível ler a parte "${tipo}" do horário da clínica.`)
  }
  return Number(valor)
}
