import { NextResponse, type NextRequest } from "next/server"

const NOME_COOKIE_SESSAO_DEMO = "sgc_sessao_id"
const PADRAO_SESSAO_VALIDA = /^demo-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const NOME_COOKIE_CLINICA = "sgc_clinica_slug"

export function proxy(request: NextRequest) {
  const slug = /^\/c\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/|$)/.exec(request.nextUrl.pathname)?.[1]
  if (slug) request.cookies.set(NOME_COOKIE_CLINICA, slug)

  const existente = request.cookies.get(NOME_COOKIE_SESSAO_DEMO)?.value
  if (existente && PADRAO_SESSAO_VALIDA.test(existente)) {
    const resposta = NextResponse.next({
      request: { headers: cabecalhosComCookies(request) },
    })
    if (slug) definirCookieClinica(resposta, slug)
    return resposta
  }

  const novoSessaoId = `demo-${crypto.randomUUID()}`
  request.cookies.set(NOME_COOKIE_SESSAO_DEMO, novoSessaoId)

  const response = NextResponse.next({
    request: {
      headers: cabecalhosComCookies(request),
    },
  })

  response.cookies.set(NOME_COOKIE_SESSAO_DEMO, novoSessaoId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  })
  if (slug) definirCookieClinica(response, slug)

  return response
}

function cabecalhosComCookies(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const cookieHeader = request.cookies
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ")
  requestHeaders.set("cookie", cookieHeader)
  return requestHeaders
}

function definirCookieClinica(response: NextResponse, slug: string) {
  response.cookies.set(NOME_COOKIE_CLINICA, slug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
}
