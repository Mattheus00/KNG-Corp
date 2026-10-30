import { NextResponse, type NextRequest } from "next/server"

const NOME_COOKIE_SESSAO_DEMO = "sgc_sessao_id"
const PADRAO_SESSAO_VALIDA = /^demo-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function proxy(request: NextRequest) {
  const existente = request.cookies.get(NOME_COOKIE_SESSAO_DEMO)?.value
  if (existente && PADRAO_SESSAO_VALIDA.test(existente)) {
    return NextResponse.next()
  }

  const novoSessaoId = `demo-${crypto.randomUUID()}`
  const requestHeaders = new Headers(request.headers)
  request.cookies.set(NOME_COOKIE_SESSAO_DEMO, novoSessaoId)
  const cookieHeader = request.cookies
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ")
  requestHeaders.set("cookie", cookieHeader)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.cookies.set(NOME_COOKIE_SESSAO_DEMO, novoSessaoId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  })

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
}
