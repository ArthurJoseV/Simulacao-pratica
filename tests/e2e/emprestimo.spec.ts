import { test, expect } from '@playwright/test';
import {login,loginNoNavegador,criarlivro, apagarlivro, buscaremprestimoativo, apagaremprestimo} from '../support/api-helpers';
import { admin, leitor, novolivro } from '../support/dados';

let tokenAdmin: string;
let livroId: number | undefined;

test.beforeEach(async ({ request, page }) => {

  livroId = undefined;
  tokenAdmin = await login(request, admin.email, admin.senha);
  livroId = await criarlivro( request, tokenAdmin,
    novolivro(1, '9780000000002'),
  );

  await loginNoNavegador(page, request, leitor.email, leitor.senha);
});

test('leitor empresta um livro pela tela', async ({ page }) => {

  await page.goto(`/livros/${livroId}`);
  await expect(page.getByTestId('livro-disponibilidade')).toHaveText('Disponível');
  await page.getByTestId('botao-emprestar').click();
  await expect(page.getByTestId('mensagem-sucesso')).toBeVisible();
  await expect(page.getByTestId('mensagem-sucesso'))
    .toHaveText('Empréstimo realizado com sucesso');

  await expect(page.getByTestId('livro-disponibilidade'))
    .toHaveText('Indisponível');
});

test.afterEach(async ({ request }) => {
  if (livroId === undefined) return;
  const emprestimoId = await buscaremprestimoativo( request, tokenAdmin, livroId,);

  if (emprestimoId !== undefined) {
    await apagaremprestimo(request, tokenAdmin, emprestimoId);
  }
  await apagarlivro(request, tokenAdmin, livroId);
});