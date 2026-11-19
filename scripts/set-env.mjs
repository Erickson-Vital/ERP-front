// Roda antes do build de produção (npm run build).
//
// Lê API_URL (variável de ambiente da Vercel) e gera:
//   - src/environments/environment.prod.ts  -> endereço da API usado pelo front
//   - src/index.prod.html                   -> index.html com a Content-Security-Policy
//
// Os dois arquivos são gerados a cada build e ficam fora do git.
// Para testar localmente: API_URL=http://localhost:5136 npm run build

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

function falhar(msg) {
  console.error(`\n[set-env] ERRO: ${msg}\n`);
  process.exit(1);
}

const bruto = (process.env.API_URL ?? '').trim();
if (!bruto) {
  falhar(
    'API_URL não definida. Configure na Vercel (Settings > Environment Variables) ' +
    'com o endereço da API, ex.: https://api.seudominio.com'
  );
}

let url;
try {
  url = new URL(bruto);
} catch {
  falhar(`API_URL inválida: "${bruto}". Use o endereço completo, ex.: https://api.seudominio.com`);
}

const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);

// HTTPS obrigatório fora da máquina local: o token de sessão e as senhas
// trafegam nessas requisições.
if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
  falhar(`API_URL precisa usar https:// (recebido: ${url.protocol}//${url.host}).`);
}
if (url.username || url.password) {
  falhar('API_URL não pode conter usuário/senha.');
}
if ((url.pathname !== '/' && url.pathname !== '') || url.search || url.hash) {
  falhar('API_URL deve ser só o domínio, sem caminho. Ex.: https://api.seudominio.com (o /api é adicionado pelo front).');
}

// Só a origem (protocolo + domínio + porta). Isso também evita injeção de
// código ou de diretivas de CSP pelo valor da variável.
const origem = url.origin;

writeFileSync(
  join(raiz, 'src/environments/environment.prod.ts'),
  `// Gerado por scripts/set-env.mjs. Não edite: é sobrescrito a cada build.\n` +
  `export const environment = { production: true, apiUrl: ${JSON.stringify(origem)} };\n`
);

// Content-Security-Policy: o navegador só executa scripts do próprio site e
// só conversa com a API configurada. Limita muito o estrago de um XSS.
// style-src precisa de 'unsafe-inline' porque o Angular injeta o CSS dos
// componentes em tags <style>.
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' ${origem}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const index = readFileSync(join(raiz, 'src/index.html'), 'utf8');
const marcador = '<meta charset="utf-8">';
if (!index.includes(marcador)) falhar(`não achei "${marcador}" em src/index.html`);

writeFileSync(
  join(raiz, 'src/index.prod.html'),
  index.replace(marcador, `${marcador}\n  <meta http-equiv="Content-Security-Policy" content="${csp}">`)
);

console.log(`[set-env] API: ${origem}`);
