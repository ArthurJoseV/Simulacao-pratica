import { test, expect } from "@playwright/test";
import { login, cadastrarLivro, apagarLivro } from "../support/api-helpers";
import { admin } from "../support/dados";

let token: string;
let livroId: number;

test.beforeEach(async ({ request }) => {
    token = await login(request, admin.email, admin.senha);
    livroId = await cadastrarLivro(request, token);
});

test.afterEach(async ({ request }) => {
    if (livroId) {
        await apagarLivro(request, token, livroId);
    }
});
