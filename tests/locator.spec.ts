import { test, expect, type Page } from '@playwright/test';

async function loginNoLocatorLab(page: Page) {
  await page.goto('https://locatorlab-testes.vercel.app/login');
  await page.getByPlaceholder('voce@exemplo.com').fill('aluno@locatorlab.dev');
  await page.getByPlaceholder('Sua senha').fill('Aluno@123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test('login validado com sucesso', async ({ page }) => {
  await loginNoLocatorLab(page);
});

test('upload de arquivo', async ({ page }) => {
  await loginNoLocatorLab(page);
  await page.goto('https://locatorlab-testes.vercel.app/profile');

  const arquivo = page.locator('input[type="file"]');
  await arquivo.setInputFiles({
    name: 'teste.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9n0AAAAASUVORK5CYII=', 'base64'),
  });
  await expect(arquivo).toHaveValue(/teste\.png$/);
});
