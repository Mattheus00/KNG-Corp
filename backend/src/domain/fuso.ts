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

// Converte um horário de parede da clínica em instante. O ajuste usa o fuso
// informado duas vezes para permanecer válido mesmo se a regra de horário de verão mudar.
export function instanteNoFuso(relogio: RelogioLocal, fuso = FUSO_CLINICA): Date {
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

  return new Date(utc)
}

function lerParte(partes: Intl.DateTimeFormatPart[], tipo: Intl.DateTimeFormatPartTypes): number {
  const valor = partes.find((parte) => parte.type === tipo)?.value
  if (valor === undefined) {
    throw new Error(`Não foi possível ler a parte "${tipo}" do horário da clínica.`)
  }
  return Number(valor)
}
