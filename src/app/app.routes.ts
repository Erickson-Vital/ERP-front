import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth.guard';

const guard = [AuthGuard];

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'painel',
    canActivate: guard,
    data: { menu: 'painel' },
    loadComponent: () => import('./features/painel/painel.component').then(m => m.PainelComponent)
  },
  {
    path: 'clientes',
    canActivate: guard,
    data: { menu: 'clientes' },
    loadComponent: () => import('./features/clientes/clientes.component').then(m => m.ClientesComponent)
  },
  {
    path: 'clientes/novo',
    canActivate: guard,
    data: { menu: 'clientes' },
    loadComponent: () => import('./features/clientes/cliente-form.component').then(m => m.ClienteFormComponent)
  },
  {
    path: 'clientes/:id/editar',
    canActivate: guard,
    data: { menu: 'clientes' },
    loadComponent: () => import('./features/clientes/cliente-form.component').then(m => m.ClienteFormComponent)
  },
  {
    path: 'fornecedores',
    canActivate: guard,
    data: { menu: 'fornecedores' },
    loadComponent: () => import('./features/fornecedores/fornecedores.component').then(m => m.FornecedoresComponent)
  },
  {
    path: 'produtos',
    canActivate: guard,
    data: { menu: 'produtos' },
    loadComponent: () => import('./features/produtos/produtos.component').then(m => m.ProdutosComponent)
  },
  {
    path: 'processos',
    canActivate: guard,
    data: { menu: 'processos' },
    loadComponent: () => import('./features/processos/processos.component').then(m => m.ProcessosComponent)
  },
  {
    path: 'bom',
    canActivate: guard,
    data: { menu: 'bom' },
    loadComponent: () => import('./features/bom/bom.component').then(m => m.BomComponent)
  },
  {
    path: 'gestao-estoque',
    canActivate: guard,
    data: { menu: 'gestao-estoque' },
    loadComponent: () => import('./features/gestao-estoque/gestao-estoque.component').then(m => m.GestaoEstoqueComponent)
  },
  {
    path: 'estoque',
    canActivate: guard,
    data: { menu: 'estoque' },
    loadComponent: () => import('./features/estoque/estoque.component').then(m => m.EstoqueComponent)
  },
  {
    path: 'pedidos-venda',
    canActivate: guard,
    data: { menu: 'pedidos-venda' },
    loadComponent: () => import('./features/pedidos-venda/pedidos-venda.component').then(m => m.PedidosVendaComponent)
  },
  {
    path: 'pedidos-compra',
    canActivate: guard,
    data: { menu: 'pedidos-compra' },
    loadComponent: () => import('./features/pedidos-compra/pedidos-compra.component').then(m => m.PedidosCompraComponent)
  },
  {
    path: 'financeiro',
    canActivate: guard,
    data: { menu: 'financeiro' },
    loadComponent: () => import('./features/financeiro/financeiro.component').then(m => m.FinanceiroComponent)
  },
  {
    path: 'usuarios',
    canActivate: guard,
    data: { menu: 'usuarios' },
    loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent)
  },
  {
    path: 'auditoria',
    canActivate: guard,
    data: { menu: 'auditoria' },
    loadComponent: () => import('./features/auditoria/auditoria.component').then(m => m.AuditoriaComponent)
  },
  { path: '', redirectTo: 'painel', pathMatch: 'full' },
  { path: '**', redirectTo: 'painel' }
];
