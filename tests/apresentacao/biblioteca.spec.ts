import { test, expect } from '@playwright/test';
import { criarDadosLivro } from '../helpers/biblioteca';
import {login, loginNoNavegador,criarlivro,apagarlivro, buscaremprestimoativo, apagaremprestimo} from '../support/api-helpers';
import { admin, leitor } from '../support/dados';

test.describe('Autenticação', () => {
  test('CT- 001 Login com credenciais válidas', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(leitor.email);
    await page.getByTestId('login-senha').fill(leitor.senha);
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL('/livros');
    await expect(page.getByTestId('livros-titulo-pagina')).toHaveText('Livros');
    await expect(page.getByTestId('usuario-logado')).toHaveText('Leitor Padrão (leitor)');
    await expect(page.getByTestId('livros-tabela')).toBeVisible();
  });

  test('CT- 002: Rejeitar login com senha incorreta', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(leitor.email);
    await page.getByTestId('login-senha').fill('SenhaIncorreta@123');
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('mensagem-erro')).toBeVisible();
    await expect(page.getByTestId('mensagem-erro')).toHaveText('E-mail ou senha inválidos');
    await expect(page).toHaveURL('/login');
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('usuario'))).toBeNull();
  });
});

test.describe('Catálogo e empréstimos', () => {
  let tokenAdmin: string;
  let livroId: number;
  let dadosLivro: ReturnType<typeof criarDadosLivro>;
  let livrosCriados: number[];

  test.beforeEach(async ({ request, page }) => {
    livrosCriados = [];
    tokenAdmin = await login(request, admin.email, admin.senha);
    dadosLivro = criarDadosLivro();
    dadosLivro.titulo = 'Livro da apresentação';
    dadosLivro.autor = `Autora da Apresentação ${dadosLivro.isbn}`;
    dadosLivro.quantidade = 1;
    livroId = await criarlivro(request, tokenAdmin, dadosLivro);
    livrosCriados.push(livroId);
    await loginNoNavegador(page, request, leitor.email, leitor.senha);
  });

  test.afterEach(async ({ request }) => {
    for (const id of livrosCriados) {
      const emprestimoId = await buscaremprestimoativo(request, tokenAdmin, id);
      if (emprestimoId !== undefined) {
        await apagaremprestimo(request, tokenAdmin, emprestimoId);
      }
      await apagarlivro(request, tokenAdmin, id);
    }
  });

  test('CT - 003: Filtrar livros', async ({ page, request }) => {
    // O livro de controle prova que o filtro também exclui outros autores.
    const livroControleId = await criarlivro(request, tokenAdmin, {
      ...criarDadosLivro(),
      autor: 'Escritor de Controle',
    });
    livrosCriados.push(livroControleId);

    await page.goto('/livros');
    await expect(page.getByTestId(`livro-linha-${livroId}`)).toBeVisible();
    await expect(page.getByTestId(`livro-linha-${livroControleId}`)).toBeVisible();

    await page.getByTestId('filtro-autor').fill(`apresentação ${dadosLivro.isbn}`);
    await page.getByTestId('filtro-aplicar').click();

    await expect(page.getByTestId('livros-corpo-tabela').getByRole('row')).toHaveCount(1);
    await expect(page.getByTestId(`livro-titulo-${livroId}`)).toHaveText(dadosLivro.titulo);
    await expect(page.getByTestId(`livro-autor-${livroId}`)).toHaveText(dadosLivro.autor);
    await expect(page.getByTestId(`livro-linha-${livroControleId}`)).toHaveCount(0);
    await expect(page.getByTestId('livros-vazio')).toBeHidden();
  });

  test('CT - 004: Emprestar o último exemplar disponível', async ({ page }) => {
    await page.goto(`/livros/${livroId}`);
    await expect(page.getByTestId('livro-disponibilidade')).toHaveText('Disponível');
    await expect(page.getByTestId('livro-quantidade-disponivel')).toHaveText('1 de 1');

    const respostaEmprestimo = page.waitForResponse(
      (resposta) => new URL(resposta.url()).pathname === '/api/emprestimos'
        && resposta.request().method() === 'POST',
    );
    await page.getByTestId('botao-emprestar').click();
    const resposta = await respostaEmprestimo;
    expect(resposta.status()).toBe(201);
    const emprestimo = await resposta.json();
    expect(emprestimo).toMatchObject({ id: expect.any(Number), livroId, status: 'ativo' });

    await expect(page.getByTestId('mensagem-sucesso')).toBeVisible();
    await expect(page.getByTestId('mensagem-sucesso')).toHaveText('Empréstimo realizado com sucesso');
    await expect(page.getByTestId('livro-disponibilidade')).toHaveText('Indisponível');
    await expect(page.getByTestId('livro-quantidade-disponivel')).toHaveText('0 de 1');

    await page.getByTestId('nav-meus-emprestimos').click();
    await expect(page.getByTestId(`emprestimo-livro-${emprestimo.id}`)).toHaveText(dadosLivro.titulo);
    await expect(page.getByTestId(`emprestimo-status-${emprestimo.id}`)).toHaveText('Ativo');
  });

  test('CT - 005: Impedir empréstimo de livro sem exemplares', async ({ page, request }) => {
    // Prepara a indisponibilidade pela API; a tentativa de empréstimo ocorre na tela.
    const atualizacao = await request.patch(`/api/livros/${livroId}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      data: { quantidade: 0 },
    });
    expect(atualizacao.status()).toBe(200);

    await page.goto(`/livros/${livroId}`);
    await expect(page.getByTestId('livro-disponibilidade')).toHaveText('Indisponível');
    await expect(page.getByTestId('livro-quantidade-disponivel')).toHaveText('0 de 0');

    const respostaEmprestimo = page.waitForResponse(
      (resposta) => new URL(resposta.url()).pathname === '/api/emprestimos'
        && resposta.request().method() === 'POST',
    );
    await page.getByTestId('botao-emprestar').click();
    expect((await respostaEmprestimo).status()).toBe(409);

    await expect(page.getByTestId('mensagem-erro')).toBeVisible();
    await expect(page.getByTestId('mensagem-erro')).toHaveText('Livro indisponível');
    await expect(page.getByTestId('mensagem-sucesso')).toBeHidden();
    await expect(page.getByTestId('livro-disponibilidade')).toHaveText('Indisponível');
    await expect(page.getByTestId('livro-quantidade-disponivel')).toHaveText('0 de 0');
    expect(await buscaremprestimoativo(request, tokenAdmin, livroId)).toBeUndefined();
  });
});
