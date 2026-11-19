import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/auth.service';
import { ApiService } from './core/api.service';
import { MENUS, MenuItem } from './core/menus';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
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

  constructor(private auth: AuthService, private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.ehLogin = this.router.url.startsWith('/login');
      this.atualizarMenu();
    });
    this.ehLogin = this.router.url.startsWith('/login');
    this.atualizarMenu();
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

    // Só exibe os menus que o usuário tem acesso (ADMIN vê todos)
    this.menu = MENUS.filter(m => s.isAdmin || s.menus.indexOf(m.codigo) >= 0);

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
