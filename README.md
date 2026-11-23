# Testes de API da Biblioteca

Atividade de testes com o `APIRequestContext` do Playwright usando a
[API da Biblioteca](https://github.com/Brencosta/api-testing-playwright).

## Como executar

Com Node.js 20 ou superior instalado, execute na pasta deste projeto:

```powershell
npm ci
git clone https://github.com/Brencosta/api-testing-playwright.git
npm ci --prefix api-testing-playwright
npm test
```

Se a pasta `api-testing-playwright` já existir, pule o comando `git clone`.
O Playwright inicia a API automaticamente na porta **3001**, com os dados do seed.
Se a API já estiver rodando nessa porta, ela será reutilizada na execução local.
Não é necessário instalar navegadores para estes testes.

O comando `npm test` verifica primeiro todos os arquivos TypeScript de `tests/`,
inclusive os arquivos de suporte que ainda não são importados pelos cenários.
Para executar somente essa verificação, use `npm run typecheck`.

## Cenários da atividade

- [x] Consulta do livro 1: status 200, título `Dom Casmurro` e disponível.
- [x] Cadastro com token de administrador: status 201, dados enviados e `id` positivo,
  seguido da exclusão do livro criado.
- [x] Cadastro sem token: status 401 e erro `Token não informado`.
- [x] Empréstimo do livro 4 como leitor: status 409 e erro `Livro indisponível`.
- [x] Cenário extra do README da API: cadastro com token de leitor retorna status 403
  e erro `Acesso negado: ação permitida apenas para o perfil admin`.

Os cenários estão em [`tests/livros.spec.ts`](tests/livros.spec.ts). Todos validam o
status HTTP e campos do corpo da resposta. Os logins também verificam o status e o
token retornado antes das requisições autenticadas.

As funções em [`tests/helpers/biblioteca.ts`](tests/helpers/biblioteca.ts) centralizam
o login por perfil, a criação de dados de livro e a validação do formato dos erros.
Cada chamada da função de dados gera um ISBN aleatório de 13 dígitos.

O cadastro envia todos os campos obrigatórios do livro e compara os dados recebidos
com os enviados. A exclusão fica em um bloco `finally`, para limpar o livro criado
mesmo se uma validação posterior falhar. O `DELETE` deve retornar **204 sem corpo**;
em seguida, um `GET` confirma **404** com o erro `Livro não encontrado`.

## Relatório e integração contínua

Para abrir o relatório após a execução:

```powershell
npx playwright show-report
```

O GitHub Actions também baixa a API, instala as dependências e executa os testes.
O fluxo está em [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml)
e roda em pushes e pull requests para `main` ou `master`. O relatório HTML fica
disponível nos artefatos da execução.

## Entrega

Publique este projeto em um repositório **público** no GitHub e envie o link do
repositório no Moodle. Inclua os testes, a configuração do Playwright, os arquivos
`package.json` e `package-lock.json`, este README e o workflow.

A pasta da API é clonada separadamente durante a instalação. Ela, as dependências
e os relatórios gerados são ignorados pelo `.gitignore`.
