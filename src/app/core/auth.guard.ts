import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

/** Bloqueia rotas para quem não está logado ou não tem acesso ao menu da rota. */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.auth.autenticado) {
      this.router.navigate(['/login'], { queryParams: { redirect: state.url } });
      return false;
    }
    const menu = route.data?.['menu'] as string | undefined;
    if (menu && !this.auth.temAcesso(menu)) {
      // Sem acesso ao menu: manda para a primeira tela permitida
      this.router.navigate([this.rotaInicial()]);
      return false;
    }
    return true;
  }

  /** Primeira rota que o usuário pode acessar. */
  private rotaInicial(): string {
    const s = this.auth.sessaoAtual;
    if (!s) return '/login';
    const ordem = ['painel', 'estoque', 'pedidos-venda', 'pedidos-compra', 'clientes', 'fornecedores', 'produtos', 'financeiro', 'usuarios', 'auditoria'];
    for (const m of ordem) {
      if (s.isAdmin || s.menus.indexOf(m) >= 0) return '/' + m;
    }
    return '/login';
  }
}
