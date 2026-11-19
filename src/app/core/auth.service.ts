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
      if (raw) this.sessao = JSON.parse(raw);
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
