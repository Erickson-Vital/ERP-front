/**
 * Utilitários de paginação/filtro no lado do cliente.
 *
 * O backend já devolve as listas completas para a maioria dos cadastros;
 * a paginação e o filtro são aplicados em memória para manter as telas
 * leves e responsivas sem novas chamadas HTTP.
 */

/** Pagina um array já filtrado. `pagina` é 1-based. */
export function paginar<T>(lista: T[], pagina: number, tamanho: number): T[] {
  const ini = (Math.max(1, pagina) - 1) * tamanho;
  return lista.slice(ini, ini + tamanho);
}

/** Total de páginas para uma lista de N itens. */
export function totalPaginas(totalItens: number, tamanho: number): number {
  if (tamanho <= 0) return 1;
  return Math.max(1, Math.ceil(totalItens / tamanho));
}

/**
 * Filtra uma lista por um termo livre em uma ou mais propriedades de texto.
 * Comparação case-insensitive e sem acentos.
 */
export function filtrarPor<T>(lista: T[], termo: string, seletores: ((item: T) => string | null | undefined)[]): T[] {
  const t = normalizar(termo);
  if (!t) return lista;
  return lista.filter(item =>
    seletores.some(sel => normalizar(sel(item)).includes(t))
  );
}

/** Remove acentos e converte para minúsculas. */
export function normalizar(valor: string | null | undefined): string {
  if (valor === null || valor === undefined) return '';
  return valor
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
