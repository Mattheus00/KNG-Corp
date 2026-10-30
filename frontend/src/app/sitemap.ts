import type { MetadataRoute } from "next"

const URL_BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

// Sitemap contém apenas URLs públicas, canônicas e indexáveis (AGENTS.md seção 17).
export default function sitemap(): MetadataRoute.Sitemap {
  const ultimaModificacao = new Date("2026-10-30T12:00:00.000Z")
  return [
    {
      url: `${URL_BASE}/`,
      lastModified: ultimaModificacao,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${URL_BASE}/privacidade`,
      lastModified: ultimaModificacao,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${URL_BASE}/termos`,
      lastModified: ultimaModificacao,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ]
}
