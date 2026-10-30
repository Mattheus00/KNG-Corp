import { expect, test } from "@playwright/test"

test.describe("Jornadas e permissões do SGC (MVP)", () => {
  test("a landing identifica a demonstração e aponta políticas", async ({ page }) => {
    await page.goto("/")
    await expect(
      page.getByRole("heading", { name: "Gestão completa para clínicas odontológicas" }),
    ).toBeVisible()
    await expect(page.getByText("Gratuito durante a fase de demonstração").first()).toBeVisible()
    await expect(page.getByRole("link", { name: "Privacidade" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Termos" })).toBeVisible()
  })

  test("a clínica de exemplo abre e o paciente não entra no painel do gestor", async ({ page }) => {
    await page.goto("/c/aurora")
    await expect(page.getByRole("heading", { name: /Aurora/i })).toBeVisible()

    await page.goto("/c/aurora/paciente")
    await expect(page.getByRole("heading", { name: "Olá, Mariana Costa" })).toBeVisible()

    await page.goto("/c/aurora/gestor")
    await expect(
      page.getByRole("heading", { name: "Troque de perfil para abrir esta área" }),
    ).toBeVisible()
  })

  test("as rotas antigas redirecionam para a clínica de exemplo", async ({ page }) => {
    await page.goto("/recepcao")
    await expect(page).toHaveURL(/\/c\/aurora\/recepcao$/)
  })

  test("alternar o perfil abre recepção, dentista e gestor", async ({ page }) => {
    test.setTimeout(90_000)
    await page.goto("/c/aurora/recepcao")
    await page.getByLabel("Alternar perfil demonstrativo").selectOption({ label: "Recepção — Lucas Ferreira" })
    await expect(page.getByRole("heading", { name: "Recepção" })).toBeVisible()

    await page.goto("/c/aurora/dentista")
    await page
      .getByLabel("Alternar perfil demonstrativo")
      .selectOption({ label: "Dentista (Dra. Helena) — Dra. Helena Martins" })
    await expect(page.getByRole("heading", { name: "Dra. Helena Martins" })).toBeVisible()

    await page.goto("/c/aurora/gestor")
    await page.getByLabel("Alternar perfil demonstrativo").selectOption({ label: "Gestor — Roberto Vasconcelos" })
    await expect(page.getByRole("heading", { name: "Gestão da Clínica" })).toBeVisible()
    await expect(page.getByText("Ocupação planejada").first()).toBeVisible()
  })
})
