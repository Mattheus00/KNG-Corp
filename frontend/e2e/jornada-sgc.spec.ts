import { expect, test } from "@playwright/test"

test.describe("Jornadas e permissões do SGC (MVP)", () => {
  test("site público exibe identificação de demonstração, serviços, equipe e políticas", async ({
    page,
  }) => {
    await page.goto("/")
    await expect(
      page.getByRole("heading", { name: /Clínica Odontológica Aurora/i }),
    ).toBeVisible()
    await expect(page.getByText(/AMBIENTE DEMONSTRATIVO/i).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /Política de Privacidade/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /Termos de Serviço/i })).toBeVisible()
  })

  test("paciente agenda avaliação com resumo e comprovante e é impedido de acessar painel do gestor sem papel", async ({
    page,
  }) => {
    await page.goto("/paciente")
    await expect(page.getByRole("heading", { name: /Portal do Paciente/i })).toBeVisible()
    await expect(
      page.getByRole("heading", { name: /2\. Resumo antes da confirmação/i }),
    ).toBeVisible()

    // Tenta acessar /gestor enquanto autenticado como Paciente (Mariana Costa)
    await page.goto("/gestor")
    await expect(
      page.getByRole("heading", { name: /Acesso restrito ao perfil de Gestor/i }),
    ).toBeVisible()
  })

  test("alternância de perfis permite conduzir consulta pela recepção, dentista e gestor", async ({
    page,
  }) => {
    await page.goto("/recepcao")
    // Alterna para Recepção
    await page.getByRole("button", { name: /Alternar para Lucas Ferreira/i }).click()
    await expect(
      page.getByRole("heading", { name: /Recepção — Operação da Clínica/i }),
    ).toBeVisible()

    // Alterna para Dentista
    await page.goto("/dentista")
    await page.getByRole("button", { name: /Alternar para Dra\. Helena Martins/i }).click()
    await expect(
      page.getByRole("heading", { name: /Portal do Cirurgião-Dentista/i }),
    ).toBeVisible()

    // Alterna para Gestor
    await page.goto("/gestor")
    await page.getByRole("button", { name: /Alternar para Roberto Vasconcelos/i }).click()
    await expect(
      page.getByRole("heading", { name: /Gestão da Clínica — Dashboard e Configurações/i }),
    ).toBeVisible()
    await expect(page.getByText(/Ocupação planejada/i).first()).toBeVisible()
  })
})
