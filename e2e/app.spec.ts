import { test, expect, type Page } from '@playwright/test'

// Playwright creates a fresh browser context per test, so IndexedDB is isolated automatically.

async function setupName(page: Page, name = 'Atleta') {
  await page.goto('/')
  // Wait briefly for the app and useLiveQuery to settle
  await page.waitForTimeout(500)
  const prompt = page.getByText('Bem-vindo ao Treina')
  if (await prompt.isVisible().catch(() => false)) {
    await page.fill('input[placeholder="Seu nome"]', name)
    await page.click('button:has-text("Começar")')
    await expect(prompt).not.toBeVisible({ timeout: 5000 })
  }
}

// ─── Name prompt ───────────────────────────────────────────────────────────────

test('shows name prompt on first open', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(500)
  await expect(page.getByText('Bem-vindo ao Treina')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Começar' })).toBeDisabled()
})

test('Começar is enabled once name is typed', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(500)
  await page.fill('input[placeholder="Seu nome"]', 'X')
  await expect(page.getByRole('button', { name: 'Começar' })).toBeEnabled()
})

test('name prompt hides after submit and shows greeting', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(500)
  await page.fill('input[placeholder="Seu nome"]', 'João')
  await page.click('button:has-text("Começar")')
  await expect(page.getByText('Bem-vindo ao Treina')).not.toBeVisible({ timeout: 5000 })
  await expect(page.getByText('Olá, João')).toBeVisible()
})

test('name prompt does not reappear after reload', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(500)
  await page.fill('input[placeholder="Seu nome"]', 'Maria')
  await page.click('button:has-text("Começar")')
  await expect(page.getByText('Bem-vindo ao Treina')).not.toBeVisible({ timeout: 5000 })
  await page.reload()
  await page.waitForTimeout(500)
  await expect(page.getByText('Bem-vindo ao Treina')).not.toBeVisible()
  await expect(page.getByText('Olá, Maria')).toBeVisible()
})

// ─── Home page ─────────────────────────────────────────────────────────────────

test('home shows stats banner after name setup', async ({ page }) => {
  await setupName(page)
  await expect(page.getByText('check-ins')).toBeVisible()
  await expect(page.getByText('dias ativos')).toBeVisible()
  await expect(page.getByText('Treinos Ativos')).toBeVisible()
})

// ─── Create workout ────────────────────────────────────────────────────────────

test('FAB navigates to new workout page', async ({ page }) => {
  await setupName(page)
  await page.locator('button.rounded-full.bg-\\[\\#FF0D5F\\]').click()
  await expect(page).toHaveURL(/\/workout\/new/)
})

test('can create a workout and see it in the active list', async ({ page }) => {
  await setupName(page)
  await page.locator('button.rounded-full.bg-\\[\\#FF0D5F\\]').click()
  await page.locator('input').first().fill('Treino Peito')
  await page.click('button:has-text("Criar treino")')
  await expect(page).toHaveURL('http://localhost:5175/')
  await expect(page.getByText('Treino Peito').first()).toBeVisible()
})

// ─── Workout detail ─────────────────────────────────────────────────────────────

test('workout detail shows exercise count and Finalizar button', async ({ page }) => {
  await setupName(page)
  await page.locator('button.rounded-full.bg-\\[\\#FF0D5F\\]').click()
  await page.locator('input').first().fill('Treino Costas')
  await page.click('button:has-text("Criar treino")')
  await page.getByText('Treino Costas').first().click()
  await expect(page).toHaveURL(/\/workout\/[^/]+$/)
  await expect(page.getByText(/exercícios/).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Finalizar/i })).toBeVisible()
})

test('empty workout auto-saves and shows Salvar treino sheet', async ({ page }) => {
  await setupName(page)
  await page.locator('button.rounded-full.bg-\\[\\#FF0D5F\\]').click()
  await page.locator('input').first().fill('Treino Vazio')
  await page.click('button:has-text("Criar treino")')
  await page.getByText('Treino Vazio').first().click()
  // 0 exercises → allDone immediately → Finalizar is primary
  await page.click('button:has-text("Finalizar")')
  await expect(page.getByRole('button', { name: 'Salvar treino' })).toBeVisible()
  await page.click('button:has-text("Salvar treino")')
  await expect(page).toHaveURL('http://localhost:5175/')
})

// ─── Calendar ──────────────────────────────────────────────────────────────────

test('calendar renders and supports month navigation', async ({ page }) => {
  await setupName(page)
  await page.goto('/calendar')
  await expect(page.getByText('Calendário')).toBeVisible()

  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const hasMonth = async () => {
    for (const m of months) {
      if (await page.getByText(m, { exact: false }).isVisible().catch(() => false)) return true
    }
    return false
  }

  expect(await hasMonth()).toBe(true)
  // Navigate back
  await page.locator('header ~ div button').first().click()
  expect(await hasMonth()).toBe(true)
})

// ─── Settings ──────────────────────────────────────────────────────────────────

test('settings page reflects current name', async ({ page }) => {
  await setupName(page, 'Original')
  await page.goto('/settings')
  await expect(page.locator('input[placeholder*="autor"]')).toHaveValue('Original', { timeout: 5000 })
})

test('settings saves new name', async ({ page }) => {
  await setupName(page, 'Old')
  await page.goto('/settings')
  const input = page.locator('input[placeholder*="autor"]')
  await input.clear()
  await input.fill('New Name')
  await page.click('button:has-text("Salvar")')
  await expect(page.getByText('Salvo')).toBeVisible()
})

// ─── Long-press context menu ───────────────────────────────────────────────────

test('long-press shows context menu with all actions', async ({ page }) => {
  await setupName(page)
  await page.locator('button.rounded-full.bg-\\[\\#FF0D5F\\]').click()
  await page.locator('input').first().fill('Treino LP')
  await page.click('button:has-text("Criar treino")')
  await expect(page.getByText('Treino LP').first()).toBeVisible()

  // Long-press on WorkoutListItem (p-3), not the SuggestedWorkout card (p-4)
  const card = page.locator('button.rounded-2xl.p-3').first()
  const box = await card.boundingBox()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(700)
  await page.mouse.up()

  await expect(page.getByText('Clonar treino')).toBeVisible({ timeout: 3000 })
  await expect(page.getByText('Exportar .treino')).toBeVisible()
  await expect(page.getByText('Deletar treino')).toBeVisible()
  await expect(page.getByText('Marcar como inativo')).toBeVisible()
})

test('clone creates editable copy and navigates to edit', async ({ page }) => {
  await setupName(page)
  await page.locator('button.rounded-full.bg-\\[\\#FF0D5F\\]').click()
  await page.locator('input').first().fill('Original')
  await page.click('button:has-text("Criar treino")')

  const card = page.locator('button.rounded-2xl.p-3').first()
  const box = await card.boundingBox()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(700)
  await page.mouse.up()

  await page.click('text=Clonar treino')
  await expect(page).toHaveURL(/\/workout\/.+\/edit/)
  await expect(page.locator('input').first()).toHaveValue('Original (cópia)')
})
