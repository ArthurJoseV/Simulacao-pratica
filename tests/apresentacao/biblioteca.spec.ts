import { test, expect } from '@playwright/test';
import { criarDadosLivro } from '../helpers/biblioteca';
import { login, loginNoNavegador, criarlivro, apagarlivro, buscaremprestimoativo, apagaremprestimo } from '../support/api-helpers';
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

  test('CT- 006: Login sem preencher e-mail e senha', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL('/login');
    await expect(page.getByTestId('mensagem-erro')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('usuario'))).toBeNull();
  });
/**
 // Teste bugando pois retorna o token do usuário anterior, mesmo após o logout.
  test('CT- 007: Logout e limpeza da sessão', async ({ page, request }) => {
    await loginNoNavegador(page, request, leitor.email, leitor.senha);
    await page.goto('/livros');
    await expect(page.getByTestId('usuario-logado')).toBeVisible();

    await page.getByTestId('botao-sair').click();

    await expect(page).toHaveURL('/login');
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('usuario'))).toBeNull();
  });
*/
    test('CT- 007: Logout e limpeza da sessão', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(leitor.email);
    await page.getByTestId('login-senha').fill(leitor.senha);
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL('/livros');
    await expect(page.getByTestId('usuario-logado')).toBeVisible();

    await page.getByTestId('botao-sair').click();

    await expect(page).toHaveURL('/login');
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('usuario'))).toBeNull();
  });

  test('CT- 008: Acesso ao catálogo sem autenticação', async ({ page }) => {
    await page.goto('/livros');

    await expect(page).toHaveURL('/login');
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
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

  test('CT - 009: Filtro de disponibilidade', async ({ page, request }) => {
    // Cria um segundo livro com quantidade 0 para testar a separação entre disponíveis e indisponíveis
    const livroIndisponivelId = await criarlivro(request, tokenAdmin, {
      ...criarDadosLivro(),
      titulo: 'Livro Esgotado',
      autor: `Autora da Apresentação ${dadosLivro.isbn}`,
      quantidade: 0,
    });
    livrosCriados.push(livroIndisponivelId);

    await page.goto('/livros');
    await page.getByTestId('filtro-autor').fill(dadosLivro.isbn);
    await page.getByTestId('filtro-disponivel').selectOption('true');
    await page.getByTestId('filtro-aplicar').click();

    await expect(page.getByTestId(`livro-linha-${livroId}`)).toBeVisible();
    await expect(page.getByTestId(`livro-linha-${livroIndisponivelId}`)).toHaveCount(0);
  });

  test('CT - 010: Busca por autor inexistente', async ({ page }) => {
    await page.goto('/livros');
    await page.getByTestId('filtro-autor').fill(`AutorInexistente_${Date.now()}`);
    await page.getByTestId('filtro-aplicar').click();

    await expect(page.getByTestId('livros-corpo-tabela').getByRole('row')).toHaveCount(0);
    await expect(page.getByTestId('livros-vazio')).toBeVisible();
  });

  test('CT - 011: Abertura e conferência dos detalhes de um livro pelo catálogo', async ({ page }) => {
    await page.goto('/livros');

    // Filtra para encontrar rapidamente o livro criado no beforeEach
    await page.getByTestId('filtro-autor').fill(dadosLivro.isbn);
    await page.getByTestId('filtro-aplicar').click();
    await page.getByTestId(`livro-link-${livroId}`).click();

    await expect(page).toHaveURL(`/livros/${livroId}`);
    await expect(page.getByTestId('livro-titulo')).toHaveText(dadosLivro.titulo);
    await expect(page.getByTestId('livro-autor')).toHaveText(dadosLivro.autor);
    await expect(page.getByTestId('livro-isbn')).toHaveText(dadosLivro.isbn);
    await expect(page.getByTestId('livro-ano')).toHaveText(String(dadosLivro.anoPublicacao));
    await expect(page.getByTestId('livro-disponibilidade')).toHaveText('Disponível');
    await expect(page.getByTestId('livro-quantidade-disponivel')).toHaveText('1 de 1');
  });

  test('CT - 012: Devolução e restauração da disponibilidade do exemplar', async ({ page, request }) => {
    // Realiza o empréstimo via API para focar o teste na tela de devolução
    const tokenLeitor = await login(request, leitor.email, leitor.senha);
    const respEmprestimo = await request.post('/api/emprestimos', {
      headers: { Authorization: `Bearer ${tokenLeitor}` },
      data: { livroId },
    });
    expect(respEmprestimo.status()).toBe(201);
    const emprestimo = await respEmprestimo.json();

    await page.goto('/meus-emprestimos');
    await expect(page.getByTestId(`emprestimo-livro-${emprestimo.id}`)).toHaveText(dadosLivro.titulo);
    await expect(page.getByTestId(`emprestimo-status-${emprestimo.id}`)).toHaveText('Ativo');

    await page.getByTestId(`botao-devolver-${emprestimo.id}`).click();

    await expect(page.getByTestId('mensagem-sucesso')).toBeVisible();
    await expect(page.getByTestId(`emprestimo-status-${emprestimo.id}`)).toHaveText('Devolvido');

    // Confere na página do livro se o exemplar voltou a ficar disponível
    await page.goto(`/livros/${livroId}`);
    await expect(page.getByTestId('livro-disponibilidade')).toHaveText('Disponível');
    await expect(page.getByTestId('livro-quantidade-disponivel')).toHaveText('1 de 1');
  });
});
