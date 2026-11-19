import { environment } from '../../environments/environment';

/** Base de todas as rotas da API. Em dev: '/api' (proxy). Em produção: 'https://<API_URL>/api'. */
export const API = `${environment.apiUrl}/api`;

/** True só para requisições destinadas à nossa API (nunca para terceiros). */
export function ehRequisicaoDaApi(url: string): boolean {
  return url === API || url.startsWith(API + '/');
}
