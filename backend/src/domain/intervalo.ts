export type Intervalo = {
  inicio: Date
  fim: Date
}

export function intervalosSobrepoem(esquerda: Intervalo, direita: Intervalo): boolean {
  return esquerda.inicio < direita.fim && direita.inicio < esquerda.fim
}

export function minutosDoIntervalo(intervalo: Intervalo): number {
  return (intervalo.fim.getTime() - intervalo.inicio.getTime()) / 60_000
}

export function unirIntervalos(intervalos: readonly Intervalo[]): Intervalo[] {
  const ordenados = intervalos
    .filter((intervalo) => intervalo.inicio < intervalo.fim)
    .slice()
    .sort(
      (esquerda, direita) =>
        esquerda.inicio.getTime() - direita.inicio.getTime() ||
        esquerda.fim.getTime() - direita.fim.getTime(),
    )

  const unidos: Intervalo[] = []
  for (const atual of ordenados) {
    const ultimo = unidos.at(-1)
    if (!ultimo || atual.inicio > ultimo.fim) {
      unidos.push({ inicio: new Date(atual.inicio), fim: new Date(atual.fim) })
      continue
    }
    if (atual.fim > ultimo.fim) {
      ultimo.fim = new Date(atual.fim)
    }
  }
  return unidos
}

export function subtrairIntervalos(
  bases: readonly Intervalo[],
  recortes: readonly Intervalo[],
): Intervalo[] {
  let livres = unirIntervalos(bases)

  for (const recorte of recortes) {
    if (recorte.inicio >= recorte.fim) continue
    const proximos: Intervalo[] = []
    for (const livre of livres) {
      if (!intervalosSobrepoem(livre, recorte)) {
        proximos.push(livre)
        continue
      }
      if (livre.inicio < recorte.inicio) {
        proximos.push({ inicio: new Date(livre.inicio), fim: new Date(recorte.inicio) })
      }
      if (livre.fim > recorte.fim) {
        proximos.push({ inicio: new Date(recorte.fim), fim: new Date(livre.fim) })
      }
    }
    livres = proximos
  }

  return livres
}

export function intersecao(esquerda: Intervalo, direita: Intervalo): Intervalo | null {
  const inicioMs = Math.max(esquerda.inicio.getTime(), direita.inicio.getTime())
  const fimMs = Math.min(esquerda.fim.getTime(), direita.fim.getTime())
  if (inicioMs >= fimMs) return null
  return { inicio: new Date(inicioMs), fim: new Date(fimMs) }
}
