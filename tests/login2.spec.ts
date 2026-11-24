import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/loginpage';

test("login validado com sucesso", async ({page}) => {
    const Login = new LoginPage(page);
    await Login.abrir();
    await Login.login("standard_user", "secret_sauce");
    await expect(page).toHaveURL("https://www.saucedemo.com/inventory.html")
})
test("login invalido", async ({page}) => {
    const Login = new LoginPage(page);
    await Login.abrir();
    await Login.login("standard_user", "senhaerrada");
    await expect(page).toHaveURL("https://www.saucedemo.com/")
})
