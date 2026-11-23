import { test, expect } from '@playwright/test';
import { admin } from '../support/dados';

const rota = '/api/auth/login';

test.describe('Login', () => {
  test("login com sucesso", async({ request }) => {
    const resposta = await request.post(rota,{ data: admin });
    expect(resposta.status()).toBe(200);

  });


});
