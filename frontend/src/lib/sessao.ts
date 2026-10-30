import "server-only"

import { cookies } from "next/headers"

export const NOME_COOKIE_SESSAO_DEMO = "sgc_sessao_id"
export const NOME_COOKIE_CLINICA = "sgc_clinica_slug"
const PADRAO_SESSAO_VALIDA = /^[a-zA-Z0-9_-]{8,80}$/

export async function lerSessaoId(): Promise<string> {
  const jar = await cookies()
  const valor = jar.get(NOME_COOKIE_SESSAO_DEMO)?.value
  if (
    valor &&
    PADRAO_SESSAO_VALIDA.test(valor) &&
    valor !== "__proto__" &&
    valor !== "constructor" &&
    valor !== "prototype"
  ) {
    return valor
  }
  return `demo-${crypto.randomUUID()}`
}

export async function lerClinicaSlug(): Promise<string> {
  const jar = await cookies()
  const valor = jar.get(NOME_COOKIE_CLINICA)?.value
  if (valor && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(valor)) return valor
  return "aurora"
}
