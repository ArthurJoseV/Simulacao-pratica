
import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { novoLivro } from './dados';

function autorizacao(token: string) {
    return { Authorization: `Bearer ${token}` };
}

export async function login(
    request: APIRequestContext,
    email: string,
    senha: string
): Promise<string> {
    const resposta = await request.post('/api/auth/login', {
        data: { email, senha }
    });

    expect(resposta.status()).toBe(200);

    const dados = await resposta.json();
    return dados.token;
}

export async function cadastrarLivro(
    request: APIRequestContext,
    token: string,
    dados = novoLivro()
): Promise<number> {
    const resposta = await request.post('/api/livros', {
        headers: autorizacao(token),
        data: dados,
    });

    expect(resposta.status()).toBe(201);

    const dadosResposta = await resposta.json();
    return dadosResposta.id;
}

// teardown
export async function apagarLivro(
    request: APIRequestContext,
    token: string,
    id: number
): Promise<void> {
    const resposta = await request.delete(`/api/livros/${id}`, {
        headers: autorizacao(token)
    });

    expect([200, 204]).toContain(resposta.status());
}
