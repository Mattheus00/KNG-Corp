import "server-only"

import { cookies } from "next/headers"

export const NOME_COOKIE_SESSAO_DEMO = "sgc_sessao_id"
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
