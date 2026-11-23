export const admin = { email: 'admin@biblioteca.com', senha: 'Admin@123' };

export function novoLivro(qtd = 1){
    return {
        titulo: "Collen Hoover",
        autor: "jair messias",
        isbn: String(Date.now()),
        anoPublicacao: 2020,
        quantidade: qtd
    }
}

