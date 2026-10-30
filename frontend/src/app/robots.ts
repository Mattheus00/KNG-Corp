import type { MetadataRoute } from "next"

const URL_BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

// Não bloqueia os recursos necessários à compreensão das páginas públicas;
// páginas privadas (/paciente, /recepcao, /dentista, /gestor, /acesso) usam diretiva noindex.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${URL_BASE}/sitemap.xml`,
  }
}
