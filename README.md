# Testes automatizados da Biblioteca

## Ciclo de testes — apresentação de 25/11/2026

A plataforma escolhida é a **Biblioteca**, um sistema web com login, catálogo de
livros, filtros por autor e disponibilidade, consulta de detalhes, empréstimos e
devoluções. Existem perfis de administrador e leitor.

Os **12 casos E2E** da apresentação estão em
[`tests/apresentacao/biblioteca.spec.ts`](tests/apresentacao/biblioteca.spec.ts).
Os cinco primeiros formaram a etapa inicial e os sete seguintes completaram a suíte.

### Objetivos e planejamento

Validar o acesso do leitor, a busca no catálogo e as regras de disponibilidade
dos empréstimos. O escopo inicial cobre dois cenários de autenticação, um de
filtro e dois de empréstimo, incluindo resultados esperados de sucesso e erro.
Cadastro de usuários, permissões de administrador e devoluções ficam fora desta
primeira etapa.

| Caso | Pré-condição e passos | Resultado esperado |
|---|---|---|
| CT-01 — Login válido | Abrir `/login`; informar `leitor@biblioteca.com` / `Leitor@123`; clicar em Entrar. | Abrir `/livros`, mostrar o catálogo e `Leitor Padrão (leitor)`. |
| CT-02 — Senha incorreta | Abrir `/login`; informar o mesmo e-mail com `SenhaIncorreta@123`; clicar em Entrar. | Permanecer no login, exibir `E-mail ou senha inválidos` e não criar sessão. |
| CT-03 — Filtro por autor | Preparar dois livros de autores diferentes; autenticar o leitor; buscar parte do autor em letras minúsculas. | Exibir somente o livro correspondente e excluir o autor de controle. |
| CT-04 — Empréstimo disponível | Preparar um livro com um exemplar; autenticar o leitor; abrir o detalhe e clicar em Emprestar. | Retornar 201, mostrar sucesso, atualizar para `Indisponível` / `0 de 1` e registrar o empréstimo em Meus empréstimos. |
| CT-05 — Livro indisponível | Preparar um livro sem exemplares; autenticar o leitor; abrir o detalhe e clicar em Emprestar. | Retornar 409, mostrar `Livro indisponível`, manter `0 de 0` e não criar empréstimo. |

O ciclo simulado segue: **análise dos requisitos → planejamento → elaboração dos
casos → preparação do ambiente → automação e execução → análise dos resultados**.
Na preparação, a API local fornece os usuários do seed; os testes criam livros
com ISBNs aleatórios. As ações verificadas acontecem no Chromium, Firefox e WebKit e as respostas
são reais, sem mocks. Cada teste tem uma sessão de navegador independente.

O setup autentica pela API nos casos CT-03 a CT-05 para concentrar esses testes no
catálogo e nos empréstimos. CT-01 e CT-02 usam a própria tela de login. O teardown
remove apenas os livros e empréstimos criados pelo teste, inclusive quando uma
asserção falha, apagando primeiro o empréstimo e depois o livro.

### Executar os testes nos três navegadores e abrir o relatório

Após instalar o projeto e a API conforme a seção **Como executar**, use:

```powershell
npm.cmd run test:apresentacao
npx playwright show-report
```

Para acompanhar as ações no navegador durante a apresentação:

```powershell
npm.cmd run test:apresentacao -- --headed
```

A configuração [`playwright.apresentacao.config.ts`](playwright.apresentacao.config.ts)
executa os mesmos 12 casos em cada navegador, totalizando **36 execuções** com
um worker e sem retentativas. Para rodar em apenas um navegador, acrescente
`--project=chromium`, `--project=firefox` ou `--project=webkit` após `--` no comando npm.
A API inicia na porta **3001**. A execução é sequencial porque
os testes compartilham o leitor, cujo limite é de três empréstimos ativos.
Se já houver uma API nessa porta, ela será reutilizada; mantenha esse leitor
abaixo do limite para o CT-04. Prints e traces de falhas ficam anexados ao
relatório HTML em `playwright-report/`.

A evidência exigida é um print da página aberta por `npx playwright show-report`,
com os totais e os casos visíveis. Os erros esperados dos CT-02 e CT-05
devem resultar em testes **aprovados**, pois confirmam o comportamento previsto.
Se algum caso reprovar, comparar esperado e obtido, investigar a causa e registrar
o defeito com passos e evidência quando houver um bug confirmado.

### Resultados e evidência da etapa inicial

Execução em **24/11/2026**, no Chromium: **5 aprovados, 0 reprovados, 0 ignorados**,
em **2,7 segundos**, sem retentativas. A verificação TypeScript
(`npm.cmd run typecheck`) também passou. Nenhum bug foi identificado nos cinco
cenários executados; esse resultado se limita ao escopo inicial.

O [print do relatório](evidencias/Captura%20de%20tela%202026-11-24%20192447.png) foi capturado da página
servida por `npx playwright show-report --host 127.0.0.1 --port 9323` após essa
execução. Uma nova execução atualiza o relatório HTML; gere um novo print se os
resultados mudarem.

![Relatório Playwright com os 12 casos aprovados](evidencias/Captura%20de%20tela%202026-11-24%20192447.png)

### Sete casos adicionais da suíte

1. CT-06 — Login sem preencher e-mail e senha.
2. CT-07 — Logout e limpeza da sessão.
3. CT-08 — Acesso ao catálogo sem autenticação.
4. CT-09 — Filtro de disponibilidade.
5. CT-10 — Busca por autor inexistente.
6. CT-11 — Abertura e conferência dos detalhes de um livro pelo catálogo.
7. CT-12 — Devolução e restauração da disponibilidade do exemplar.

### Roteiro de cinco minutos para o grupo

- **Pessoa 1 — 0:00 a 1:20:** apresentar a Biblioteca, o objetivo e a matriz de casos.
- **Pessoa 2 — 1:20 a 3:40:** explicar um teste, o setup e o teardown; executar a suíte.
- **Pessoa 3 — 3:40 a 5:00:** abrir o relatório, mostrar o print e discutir resultados e bugs confirmados.

## Atividade anterior: setup e teardown

Atividade de setup e teardown com Playwright: preparo dos dados pela API,
validação na interface e limpeza ao final dos testes, usando a
[API da Biblioteca](https://github.com/Brencosta/api-testing-playwright).
O projeto também inclui os cenários anteriores de testes de API.

## Como executar

Com Node.js 20 ou superior instalado, use os comandos abaixo para clonar o projeto
e executar os testes da apresentação.

```powershell
git clone https://github.com/ArthurJoseV/Simulacao-pratica.git
cd Simulacao-pratica
npm ci
git clone --branch main --single-branch https://github.com/Brencosta/api-testing-playwright.git biblioteca-api
npm ci --prefix biblioteca-api
npx playwright install chromium firefox webkit
npm run test:apresentacao
```

Se já estiver na pasta do projeto, pule o primeiro clone e o `cd`.
Se a pasta `biblioteca-api` já existir, pule o clone da API.
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

O GitHub Actions também baixa a API, instala as dependências e executa os testes
da apresentação nos três navegadores com `npm run test:apresentacao`.
O fluxo está em [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml)
e roda em pushes e pull requests para `main` ou `master`. O relatório HTML fica
disponível nos artefatos da execução.

## Entrega

Repositório da atividade:
[ArthurJoseV/Simulacao-pratica](https://github.com/ArthurJoseV/Simulacao-pratica).

A entrega deve incluir os testes da Biblioteca, a configuração do Playwright, os
arquivos `package.json` e `package-lock.json`, este README e o workflow. O
repositório deve estar **público** para a avaliação.

Texto para enviar no Moodle:

> Repositório: https://github.com/ArthurJoseV/Simulacao-pratica
>
> Simulação do ciclo de testes da Biblioteca com Playwright. Esta etapa contém
> 12 casos automatizados em três navegadores, planejamento e captura do relatório de execução.

A pasta da API é clonada separadamente durante a instalação. Ela, as dependências
e os relatórios gerados são ignorados pelo `.gitignore`.
