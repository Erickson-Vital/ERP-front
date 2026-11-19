import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { mensagemErro } from '../../core/error-util';

@Component({
    selector: 'app-login',
    imports: [FormsModule],
    template: `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-brand">
          <span class="login-icon">🏢</span>
          <h1>ERP</h1>
          <p>Sistema de Gestão</p>
        </div>
    
        @if (error) {
          <div class="alert alert-error">{{ error }}</div>
        }
    
        <form (ngSubmit)="entrar()">
          <div class="form-group">
            <label>Login</label>
            <input [(ngModel)]="login" name="login" autocomplete="username" placeholder="Seu usuário" autofocus />
          </div>
          <div class="form-group">
            <label>Senha</label>
            <input [(ngModel)]="senha" name="senha" type="password" autocomplete="current-password" placeholder="Sua senha" />
          </div>
          <button class="btn btn-block" type="submit" [disabled]="carregando">
            {{ carregando ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
      </div>
    </div>
    `,
    styles: [`
    .login-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e293b 0%, #1d4ed8 100%);
      padding: 20px;
    }
    .login-card {
      background: #fff;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .login-brand { text-align: center; margin-bottom: 28px; }
    .login-icon { font-size: 44px; }
    .login-brand h1 { margin: 8px 0 4px; font-size: 26px; color: #1e293b; }
    .login-brand p { margin: 0; color: #64748b; font-size: 13px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .form-group label { font-weight: 500; font-size: 13px; color: #475569; }
    .form-group input {
      padding: 11px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
    }
    .form-group input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
    }
    .btn-block { width: 100%; justify-content: center; padding: 12px; margin-top: 8px; }
  `]
})
export class LoginComponent {
  login = '';
  senha = '';
  carregando = false;
  error = '';

  constructor(private api: ApiService, private auth: AuthService, private router: Router, private route: ActivatedRoute) {}

  entrar() {
    this.error = '';
    if (!this.login || !this.senha) {
      this.error = 'Informe login e senha.';
      return;
    }

    this.carregando = true;
    this.api.login(this.login.trim(), this.senha).subscribe({
      next: (s) => {
        this.auth.salvarSessao(s);
        this.carregando = false;
        const redirect = this.redirectSeguro(this.route.snapshot.queryParams['redirect']);
        const destino = redirect ?? this.rotaInicial(s.isAdmin, s.menus);
        this.router.navigateByUrl(destino);
      },
      error: (e) => {
        this.carregando = false;
        this.error = mensagemErro(e, 'Não foi possível entrar.');
      }
    });
  }

  /**
   * Só aceita caminhos internos do próprio sistema (ex.: "/clientes").
   * Bloqueia URLs externas ("https://...", "//site.com", "/\site.com") e
   * "javascript:", para o link de login não virar ponte para phishing.
   */
  private redirectSeguro(valor: unknown): string | null {
    if (typeof valor !== 'string' || valor.length > 500) return null;
    if (!/^\/[A-Za-z0-9\-_/?=&%.]*$/.test(valor)) return null;
    if (valor.startsWith('//') || valor.startsWith('/login')) return null;
    return valor;
  }

  private rotaInicial(isAdmin: boolean, menus: string[]): string {
    const ordem = ['painel', 'estoque', 'pedidos-venda', 'pedidos-compra', 'clientes', 'fornecedores', 'produtos', 'financeiro', 'usuarios', 'auditoria'];
    for (const m of ordem) {
      if (isAdmin || menus.indexOf(m) >= 0) return '/' + m;
    }
    return '/painel';
  }
}
