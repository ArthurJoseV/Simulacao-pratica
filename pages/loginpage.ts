import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly campousuario: Locator;
  readonly camposenha: Locator;
  readonly botaoentrar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.campousuario = page.getByPlaceholder('Username');
    this.camposenha = page.getByPlaceholder('Password');
    this.botaoentrar = page.getByRole('button', { name: 'login' });
  }

  async abrir(): Promise<void> {
    await this.page.goto('https://www.saucedemo.com/');
  }

  async login(usuario: string, senha: string): Promise<void> {
    await this.campousuario.fill(usuario);
    await this.camposenha.fill(senha);
    await this.botaoentrar.click();
  }
}
