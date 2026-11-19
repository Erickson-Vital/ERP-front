# ERP - Front-end (Angular 21)

Front-end do ERP. A API (.NET) fica em outro repositório.

## Rodando local

Pré-requisitos: Node 20+ e a API rodando em `http://localhost:5136`.

```bash
npm install
npm start        # ou run-web.bat no Windows
```

Acesse http://localhost:4200. Em desenvolvimento as chamadas para `/api` são
repassadas para a API pelo `proxy.conf.json`. Não precisa de variável nenhuma.

## Deploy (Vercel)

Uma variável de ambiente:

| Variável  | Exemplo                       |
|-----------|-------------------------------|
| `API_URL` | `https://api.seudominio.com`  |

O resto já está no `vercel.json` (comando de build, pasta de saída, rotas e
cabeçalhos de segurança). Depois de mudar a variável, faça um **Redeploy**: o
endereço é gravado no build.

Na API, libere o domínio do front no CORS:
`Cors__Origins__0=https://seu-front.vercel.app`

## Como o front fala com a API

Front e API ficam em domínios diferentes. O navegador chama a API direto, e a
sessão vai como token no cabeçalho `Authorization: Bearer`, não como cookie.

No build, `scripts/set-env.mjs` lê `API_URL` e gera
`src/environments/environment.prod.ts` e `src/index.prod.html`. Esses dois
arquivos ficam fora do git. O script recusa endereço vazio, `http://` (fora de
localhost), endereço com usuário/senha e endereço com caminho.

## Segurança

- **Content-Security-Policy**: o navegador só executa scripts do próprio site
  e só se conecta à API configurada. Isso limita muito o estrago de um XSS.
- **Cabeçalhos** (`vercel.json`): proteção contra o site ser embutido em
  iframe de terceiros (clickjacking), `nosniff`, HSTS, Referrer-Policy e
  Permissions-Policy.
- **Token só para a API**: o interceptor nunca envia o token para outro domínio.
- **Sessão expirada**: se a API responde 401, a sessão é limpa e o usuário
  volta para o login.
- **Redirect do login**: só aceita caminhos internos (`/clientes`). URLs
  externas são ignoradas.
- **Sem source maps** no build de produção.

Lembrete: esconder um menu na tela não é segurança. Quem garante o acesso é a
API, que valida o token e as permissões em toda requisição.
