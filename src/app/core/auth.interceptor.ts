import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { API, ehRequisicaoDaApi } from './api-url';

const ROTA_LOGIN = `${API}/auth/login`;

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // O token só vai para a nossa API. Qualquer outra URL (CDN, serviço de
    // terceiros) nunca recebe o cabeçalho Authorization.
    const daApi = ehRequisicaoDaApi(req.url);
    const ehLogin = req.url === ROTA_LOGIN;

    const token = this.auth.token;
    if (token && daApi && !ehLogin) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }

    return next.handle(req).pipe(
      catchError((e: unknown) => {
        // Sessão expirada/inválida (ex.: API reiniciou): limpa e volta ao login,
        // em vez de deixar a tela quebrada com um token morto guardado.
        if (e instanceof HttpErrorResponse && e.status === 401 && daApi && !ehLogin && this.auth.autenticado) {
          this.auth.limpar();
          const atual = this.router.url;
          this.router.navigate(['/login'], {
            queryParams: atual && !atual.startsWith('/login') ? { redirect: atual } : {}
          });
        }
        return throwError(() => e);
      })
    );
  }
}
