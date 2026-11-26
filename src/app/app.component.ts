import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';

import { AuthService } from './core/auth.service';
import { ApiService } from './core/api.service';
import { MENUS, MenuItem } from './core/menus';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'ERP';
  menu: MenuItem[] = [];
  grupos: { nome: string; itens: MenuItem[] }[] = [];
  ehLogin = false;
  usuarioNome = '';
  usuarioLogin = '';
  isAdmin = false;
  submenusAbertos: Record<string, boolean> = { roteiro: true };

  constructor(private auth: AuthService, private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.ehLogin = this.router.url.startsWith('/login');
      this.sincronizarSubmenusPelaRota();
      this.atualizarMenu();
    });
    this.ehLogin = this.router.url.startsWith('/login');
    this.sincronizarSubmenusPelaRota();
    this.atualizarMenu();
  }

  private sincronizarSubmenusPelaRota() {
    const url = this.router.url || '';
    for (const m of MENUS) {
      if (m.filhos?.length && url.startsWith(m.route)) {
        this.submenusAbertos[m.codigo] = true;
      }
    }
  }

  alternarSubmenu(codigo: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.submenusAbertos[codigo] = !this.submenusAbertos[codigo];
  }

  submenuEstaAberto(codigo: string): boolean {
    return !!this.submenusAbertos[codigo];
  }

  itemPaiAtivo(item: MenuItem): boolean {
    const url = (this.router.url || '').split('?')[0];
    if (!item.filhos?.length) {
      return url === item.route || url.startsWith(item.route + '/');
    }
    const emFilho = item.filhos.some(f => url === f.route || url.startsWith(f.route + '/'));
    if (emFilho) return false;
    return url === item.route || url.startsWith(item.route + '/');
  }

  private atualizarMenu() {
    const s = this.auth.sessaoAtual;
    if (!s) {
      this.menu = [];
      this.grupos = [];
      return;
    }
    this.usuarioNome = s.nome;
    this.usuarioLogin = s.login;
    this.isAdmin = s.isAdmin;

    // Só exibe os menus que o usuário tem acesso (ADMIN vê todos; aceita 'processos' legado como 'roteiro')
    this.menu = MENUS.filter(
      m => s.isAdmin || s.menus.indexOf(m.codigo) >= 0 || (m.codigo === 'roteiro' && s.menus.indexOf('processos') >= 0)
    );

    const nomes: string[] = [];
    for (const m of this.menu) {
      if (nomes.indexOf(m.grupo) < 0) nomes.push(m.grupo);
    }
    this.grupos = nomes.map(n => ({ nome: n, itens: this.menu.filter(m => m.grupo === n) }));
  }

  sair() {
    this.api.logout().subscribe({ next: () => {}, error: () => {} });
    this.auth.limpar();
    this.router.navigate(['/login']);
  }
}
