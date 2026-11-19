# ERP - Front-end (Angular 18)

Front-end do ERP. A API (back-end .NET) fica em outro repositório.

## Rodando local

Pré-requisitos: Node 18+ e a API rodando em `http://localhost:5136`.

```bash
npm install
npm start        # ou run-web.bat no Windows
```

Acesse http://localhost:4200. Em desenvolvimento, as chamadas para `/api` são
redirecionadas para a API via `proxy.conf.json`.

## Build

```bash
npm run build
```

Saída em `dist/erp-web/`. Em produção, sirva esses arquivos (Nginx, Vercel, etc.)
e faça o proxy de `/api` para a URL da API, ou ajuste a constante `API` em
`src/app/core/api.service.ts`. Lembre de liberar a origem do front no CORS da API
(`Cors:Origins` no `appsettings.json`).
