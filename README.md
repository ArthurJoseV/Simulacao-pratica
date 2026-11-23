# Setup e teardown da Biblioteca

Atividade de setup e teardown com Playwright: preparo dos dados pela API,
validação na interface e limpeza ao final dos testes, usando a
[API da Biblioteca](https://github.com/Brencosta/api-testing-playwright).
O projeto também inclui os cenários anteriores de testes de API.

## Como executar

Com Node.js 20 ou superior instalado, execute na pasta deste projeto:

```powershell
npm ci
git clone --branch main --single-branch https://github.com/Brencosta/api-testing-playwright.git biblioteca-api
npm ci --prefix biblioteca-api
npx playwright install chromium
npm test
```

Se a pasta `biblioteca-api` já existir, pule o comando `git clone`.
O Playwright inicia a API automaticamente na porta **3001**, com os dados do seed.
Se a API já estiver rodando nessa porta, ela será reutilizada na execução local.
Os testes de API dispensam navegador; os testes de listagem e empréstimo em
`tests/e2e/` usam o Chromium instalado pelo comando acima.

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

Esses cenários estão em [`tests/livros.spec.ts`](tests/livros.spec.ts). Todos validam o
status HTTP e campos do corpo da resposta. Os logins também verificam o status e o
token retornado antes das requisições autenticadas.

As funções em [`tests/helpers/biblioteca.ts`](tests/helpers/biblioteca.ts) centralizam
o login por perfil, a criação de dados de livro e a validação do formato dos erros.
Cada chamada da função de dados gera um ISBN aleatório de 13 dígitos.

O cadastro envia todos os campos obrigatórios do livro e compara os dados recebidos
com os enviados. A exclusão fica em um bloco `finally`, para limpar o livro criado
mesmo se uma validação posterior falhar. O `DELETE` deve retornar **204 sem corpo**;
em seguida, um `GET` confirma **404** com o erro `Livro não encontrado`.

## Setup, ação na interface e teardown

Os dois testes E2E usam `beforeEach` para preparar os dados e `afterEach` para
limpá-los, inclusive quando uma validação do teste falha. As funções de API estão
em [`tests/support/api-helpers.ts`](tests/support/api-helpers.ts), e os usuários e
dados dos livros estão em [`tests/support/dados.ts`](tests/support/dados.ts).

### Livro criado pela API aparece na listagem

Em [`tests/e2e/listarEmprestimo.spec.ts`](tests/e2e/listarEmprestimo.spec.ts), o setup
autentica o administrador, cria um livro com dois exemplares e autentica o leitor
no navegador. O teste abre `/livros` e verifica título, autor e disponibilidade
na linha do ID recebido da API. O teardown exclui o livro criado.

Para executar esse cenário no PowerShell:

```powershell
npm.cmd test -- listarEmprestimo
```

### Leitor empresta um livro pela interface

Em [`tests/e2e/emprestimo.spec.ts`](tests/e2e/emprestimo.spec.ts), o setup cria um livro
com um exemplar e autentica o leitor no navegador. O teste abre o detalhe desse
livro, confirma que está disponível e clica em **Emprestar**. Depois, verifica a
mensagem `Empréstimo realizado com sucesso` e a situação `Indisponível`.

Para executar esse cenário no PowerShell:

```powershell
npm.cmd test -- e2e/emprestimo
```

O teardown consulta a API para descobrir o ID do empréstimo ativo daquele livro,
usando o token do administrador. Se encontrar o empréstimo, exclui-o; depois,
exclui o livro. A ordem é **empréstimo → livro**, pois um livro com empréstimo ativo
não pode ser excluído e retorna **409**. Os IDs vêm das respostas da API, sem
presumir um número fixo.

### Por que a limpeza é necessária

Nos testes E2E, os ISBNs são fixos e diferentes entre os cenários: a listagem usa
`9780000000001`, e o empréstimo usa `9780000000002`. Sem o teardown, o livro fica
cadastrado; uma nova execução contra a mesma API tenta repetir o ISBN e recebe
**409 — ISBN já cadastrado**. Com a limpeza, o cenário pode ser executado novamente
sem deixar os recursos criados. Esse gerador de dados dos E2E é diferente do
gerador de ISBN aleatório usado nos testes de API anteriores.

Para repetir um cenário com ISBN fixo, execute as repetições em sequência, com
`--workers=1`, evitando criar o mesmo ISBN simultaneamente.

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

Repositório da atividade:
[ArthurJoseV/setup-e-teardown](https://github.com/ArthurJoseV/setup-e-teardown).

A entrega deve incluir os testes da Biblioteca, a configuração do Playwright, os
arquivos `package.json` e `package-lock.json`, este README e o workflow. O
repositório deve estar **público** para a avaliação.

Texto para enviar no Moodle:

> Repositório: https://github.com/ArthurJoseV/setup-e-teardown
>
> Sem teardown, os dados criados permanecem na API e podem causar falhas nas
> próximas execuções, como conflito de ISBN.

A pasta da API é clonada separadamente durante a instalação. Ela, as dependências
e os relatórios gerados são ignorados pelo `.gitignore`.
