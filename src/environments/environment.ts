// Desenvolvimento: apiUrl vazio = mesmo endereço do front.
// O `ng serve` repassa /api para http://localhost:5136 via proxy.conf.json.
//
// Em produção este arquivo é trocado por environment.prod.ts, gerado no build
// por scripts/set-env.mjs a partir da variável API_URL.
export const environment = { production: false, apiUrl: '' };
