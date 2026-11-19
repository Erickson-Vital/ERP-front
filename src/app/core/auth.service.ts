import { Injectable } from '@angular/core';
import { Sessao } from './models';

const CHAVE = 'erp_sessao';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private sessao: Sessao | null = null;

  constructor() {
    this.restaurar();
  }

  /** Salva a sessão no localStorage (persiste ao recarregar a página). */
  salvarSessao(s: Sessao) {
    this.sessao = s;
    try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch {}
  }

  restaurar() {
    try {
      const raw = localStorage.getItem(CHAVE);
      const s = raw ? JSON.parse(raw) : null;
      // Descarta valor corrompido/adulterado em vez de quebrar a aplicação.
      // (isAdmin/menus aqui só decidem o que a tela mostra; quem garante o
      // acesso de verdade é a API, que valida o token em toda requisição.)
      const valida = s && typeof s.token === 'string' && s.token.length > 0
        && Array.isArray(s.menus) && typeof s.isAdmin === 'boolean';
      this.sessao = valida ? s : null;
      if (!valida && raw) localStorage.removeItem(CHAVE);
    } catch { this.sessao = null; }
  }

  limpar() {
    this.sessao = null;
    try { localStorage.removeItem(CHAVE); } catch {}
  }

  get token(): string | null { return this.sessao?.token ?? null; }
  get sessaoAtual(): Sessao | null { return this.sessao; }
  get autenticado(): boolean { return !!this.sessao?.token; }
  get isAdmin(): boolean { return !!this.sessao?.isAdmin; }

  /** Verifica se o usuário logado tem acesso a um menu (ADMIN acessa tudo). */
  temAcesso(menu: string): boolean {
    if (!this.sessao) return false;
    if (this.sessao.isAdmin) return true;
    return this.sessao.menus.indexOf(menu) >= 0;
  }
}
