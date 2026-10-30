import { chromium } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"

// Laboratório local, sem telemetria de visitantes. Executar após o build de produção.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"
const diretorio = new URL("../test-results/redesign/", import.meta.url)
await mkdir(diretorio, { recursive: true })
const navegador = await chromium.launch({ headless: true })
const rotas = [
  { caminho: "/", perfil: null, nome: "home" },
  { caminho: "/c/aurora/paciente", perfil: "Paciente — Mariana Costa", nome: "paciente" },
  { caminho: "/c/aurora/recepcao", perfil: "Recepção — Lucas Ferreira", nome: "recepcao" },
  { caminho: "/c/aurora/gestor", perfil: "Gestor — Roberto Vasconcelos", nome: "gestor" },
]
const medicoes = []
try {
  for (const rota of rotas) {
    const preparo = await navegador.newContext()
    const paginaPreparo = await preparo.newPage()
    if (rota.perfil) {
      await paginaPreparo.goto(`${baseURL}/c/aurora`)
      await paginaPreparo.getByLabel("Alternar perfil demonstrativo").selectOption({ label: rota.perfil })
      if (!rota.perfil.startsWith("Paciente")) await paginaPreparo.waitForURL(`**${rota.caminho}`)
    }
    const estado = await preparo.storageState()
    await preparo.close()

    for (const movel of [false, true]) {
      for (let execucao = 1; execucao <= 3; execucao++) {
        const contexto = await navegador.newContext({ storageState: estado, viewport: { width: movel ? 375 : 1440, height: movel ? 812 : 1000 }, reducedMotion: "no-preference" })
        const pagina = await contexto.newPage()
        const erros = []
        pagina.on("pageerror", (erro) => erros.push(erro.message))
        const cdp = await contexto.newCDPSession(pagina)
        await cdp.send("Network.enable")
        await cdp.send("Network.setCacheDisabled", { cacheDisabled: true })
        if (movel) {
          await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 })
          await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750, connectionType: "cellular4g" })
        }
        await pagina.addInitScript(() => {
          window.__metricasSGC = { lcp: 0, cls: 0 }
          new PerformanceObserver((lista) => {
            for (const entrada of lista.getEntries()) window.__metricasSGC.lcp = entrada.startTime
          }).observe({ type: "largest-contentful-paint", buffered: true })
          let inicioJanela = 0
          let ultimaMudanca = 0
          let janela = 0
          new PerformanceObserver((lista) => {
            for (const entrada of lista.getEntries()) {
              if (entrada.hadRecentInput) continue
              if (entrada.startTime - ultimaMudanca > 1000 || entrada.startTime - inicioJanela > 5000) {
                inicioJanela = entrada.startTime
                janela = 0
              }
              janela += entrada.value
              ultimaMudanca = entrada.startTime
              window.__metricasSGC.cls = Math.max(window.__metricasSGC.cls, janela)
            }
          }).observe({ type: "layout-shift", buffered: true })
        })
        const resposta = await pagina.goto(`${baseURL}${rota.caminho}`, { waitUntil: "networkidle" })
        await pagina.evaluate(() => document.fonts.ready)
        // O observador de LCP pode entregar a primeira amostra após networkidle.
        await pagina.waitForFunction(() => window.__metricasSGC.lcp > 0, null, { timeout: 5000 }).catch(() => {})
        const valores = await pagina.evaluate(() => {
          const recursos = performance.getEntriesByType("resource")
          const navegacao = performance.getEntriesByType("navigation")[0]
          const bytes = (regex) => recursos.filter((item) => regex.test(item.name)).reduce((soma, item) => soma + item.encodedBodySize, 0)
          return {
            ...window.__metricasSGC,
            lcp: window.__metricasSGC.lcp || null,
            fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null,
            totalBytes: navegacao.transferSize + recursos.reduce((soma, item) => soma + item.transferSize, 0),
            jsBytes: bytes(/\.js(?:\?|$)/), cssBytes: bytes(/\.css(?:\?|$)/),
            fontesBytes: bytes(/\.woff2?(?:\?|$)/), imagensBytes: bytes(/\.(?:webp|png|jpe?g|avif)(?:\?|$)/),
            rolagemHorizontal: document.documentElement.scrollWidth > innerWidth + 1,
          }
        })
        medicoes.push({ rota: rota.caminho, dispositivo: movel ? "móvel" : "desktop", execucao, status: resposta.status(), erros, ...valores })
        if (execucao === 1) await pagina.screenshot({ path: new URL(`${rota.nome}-${movel ? "mobile" : "desktop"}.png`, diretorio).pathname.replace(/^\/(\w:)/, "$1"), fullPage: true })
        await contexto.close()
      }
      console.log(`Medido: ${rota.caminho} · ${movel ? "móvel, CPU 4×, 1,6 Mbps" : "desktop, sem limitação"}`)
    }
  }
  await writeFile(new URL("performance.json", diretorio), JSON.stringify({ navegador: navegador.version(), data: new Date().toISOString(), baseURL, medicoes }, null, 2))
} finally {
  await navegador.close()
}
