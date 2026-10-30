import { expect, test, type Page } from "@playwright/test"

async function semRolagemHorizontal(page: Page) {
  const dimensoes = await page.evaluate(() => ({
    conteudo: document.documentElement.scrollWidth,
    janela: window.innerWidth,
  }))
  expect(dimensoes.conteudo).toBeLessThanOrEqual(dimensoes.janela + 1)
}

const perfis = [
  { opcao: "Paciente — Mariana Costa", titulo: "Olá, Mariana Costa", secoes: [/Minhas Consultas/, /Meus Dados/, /^Nova consulta$/] },
  { opcao: "Recepção — Lucas Ferreira", titulo: "Recepção", secoes: [/Novo Agendamento/, /^Pacientes/, /^Agenda/] },
  { opcao: "Dentista (Dra. Helena) — Dra. Helena Martins", titulo: "Dra. Helena Martins", secoes: [/^Na recepção$/, /^Concluídas$/, /^Todas$/, /^Paciente$/] },
  { opcao: "Gestor — Roberto Vasconcelos", titulo: "Gestão da Clínica", secoes: [/^Equipe/, /^Serviços/, /^Expediente/, /^Indicadores$/] },
] as const

for (const largura of [320, 375, 768, 1024, 1440]) {
  test(`as páginas e os quatro perfis cabem em ${largura}px`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width: largura, height: 900 })
    const erros: string[] = []
    page.on("pageerror", (erro) => erros.push(erro.message))

    for (const rota of ["/", "/cadastro", "/privacidade", "/termos", "/c/aurora", "/c/aurora/acesso"]) {
      await page.goto(rota)
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
      await semRolagemHorizontal(page)
    }

    for (const perfil of perfis) {
      await page.getByLabel("Alternar perfil demonstrativo").selectOption({ label: perfil.opcao })
      await expect(page.getByRole("heading", { name: perfil.titulo, exact: true })).toBeVisible()
      await semRolagemHorizontal(page)
      for (const secao of perfil.secoes) {
        await page.locator(".module-tabs").getByRole("button", { name: secao }).click()
        await semRolagemHorizontal(page)
      }
    }
    expect(erros).toEqual([])
  })
}

test("o menu móvel funciona pelo teclado e devolve o foco ao fechar", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/c/aurora")
  const menu = page.getByRole("button", { name: "Menu", exact: true })
  await menu.focus()
  await page.keyboard.press("Enter")
  await expect(menu).toHaveAttribute("aria-expanded", "true")
  await page.keyboard.press("Tab")
  await page.keyboard.press("Escape")
  await expect(menu).toHaveAttribute("aria-expanded", "false")
  await expect(menu).toBeFocused()
  await menu.click()
  await page.getByRole("navigation", { name: "Módulos do sistema" }).getByRole("link", { name: "Paciente", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Olá, Mariana Costa" })).toBeVisible()
  await expect(menu).toHaveAttribute("aria-expanded", "false")
})

test("o paciente reserva pelo celular e a consulta permanece após recarregar", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/c/aurora/paciente")
  await page.getByRole("button", { name: "Nova consulta", exact: true }).click()
  const data = new Date()
  data.setUTCDate(data.getUTCDate() + 8)
  if (data.getUTCDay() === 0) data.setUTCDate(data.getUTCDate() + 1)
  await page.getByLabel("Escolher outra data no calendário").fill(data.toISOString().slice(0, 10))
  const horario = page.locator(".booking-form").getByRole("button", { name: /^\d{2}:\d{2}$/ }).first()
  await expect(horario).toBeVisible()
  await horario.click()
  await page.getByRole("button", { name: "Confirmar Agendamento", exact: true }).click()
  await expect(page.getByRole("status")).toHaveText("Reserva confirmada com sucesso.")
  await page.getByRole("button", { name: "Ver em Minhas Consultas" }).click()
  await expect(page.getByRole("heading", { name: /Próximas Consultas \(2\)/i })).toBeVisible()
  await page.reload()
  await page.locator(".module-tabs").getByRole("button", { name: /Minhas Consultas/ }).click()
  await expect(page.getByRole("heading", { name: /Próximas Consultas \(2\)/i })).toBeVisible()
})

test("o filtro do gestor mantém a clínica criada na navegação", async ({ page }) => {
  await page.goto("/cadastro")
  await page.getByLabel("Nome da clínica", { exact: true }).fill("Clínica Horizonte Demo")
  await page.getByLabel("Endereço da clínica", { exact: true }).fill("horizonte-demo")
  await page.getByLabel("Seu nome", { exact: true }).fill("Gestor Fictício")
  await page.getByLabel("Seu e-mail", { exact: true }).fill("gestor@example.test")
  await page.getByRole("button", { name: "Criar clínica", exact: true }).click()
  await expect(page).toHaveURL(/\/c\/horizonte-demo\/gestor$/)
  await page.getByLabel("Janela do período").selectOption("14")
  await expect(page).toHaveURL(/\/c\/horizonte-demo\/gestor\?dias=14$/)
  await expect(page.getByText("Clínica Horizonte Demo", { exact: true }).first()).toBeVisible()
})

test("a fonte é local e a landing respeita movimento reduzido", async ({ page }) => {
  const fontes: string[] = []
  page.on("request", (requisicao) => {
    if (requisicao.resourceType() === "font") fontes.push(requisicao.url())
  })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await page.evaluate(() => document.fonts.ready)
  expect(fontes.length).toBeGreaterThan(0)
  const origem = new URL(page.url()).origin
  expect(fontes.every((fonte) => new URL(fonte).origin === origem)).toBe(true)
  await expect(page.locator(".hero-title")).toHaveCSS("animation-name", "none")
  await page.locator(".demo-cta").scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
  await expect(page.locator(".demo-cta")).toBeVisible()
})

test("a landing revela as seções ao rolar com movimento habilitado", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.goto("/", { waitUntil: "networkidle" })
  await expect(page.locator(".hero-title")).toHaveCSS("animation-name", "chegada-titulo")
  await page.evaluate(() => document.querySelector(".demo-cta")?.scrollIntoView({ behavior: "instant" }))
  await expect.poll(() => page.locator(".demo-cta").evaluate((elemento) => elemento.getAnimations().length)).toBeGreaterThan(0)
  await expect(page.locator(".demo-cta")).toBeVisible()
})
