import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrai uma mensagem de erro legível de uma resposta HTTP.
 * Lida com: string pura, ProblemDetails ({ detail, title }), validação ({ errors })
 * e Erro do servidor genérico.
 */
export function mensagemErro(e: any, padrao: string = 'Ocorreu um erro. Tente novamente.'): string {
  if (!e) return padrao;

  // HttpErrorResponse
  if (e instanceof HttpErrorResponse || e.error !== undefined) {
    const body = e.error;
    if (typeof body === 'string' && body.trim()) return body;
    if (body && typeof body === 'object') {
      if (body.detail) return body.detail;
      if (body.title && !body.errors) return body.title;
      if (body.errors) {
        const primeiro = Object.values(body.errors)[0];
        if (Array.isArray(primeiro) && primeiro.length) return primeiro[0] as string;
        if (typeof primeiro === 'string') return primeiro;
      }
      if (body.title) return body.title;
    }
    if (e.message) return e.message;
  }

  if (typeof e === 'string') return e;
  return padrao;
}
