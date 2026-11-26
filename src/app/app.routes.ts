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
    path: 'fornecedores/novo',
    canActivate: guard,
    data: { menu: 'fornecedores' },
    loadComponent: () => import('./features/fornecedores/fornecedor-form.component').then(m => m.FornecedorFormComponent)
  },
  {
    path: 'fornecedores/:id/editar',
    canActivate: guard,
    data: { menu: 'fornecedores' },
    loadComponent: () => import('./features/fornecedores/fornecedor-form.component').then(m => m.FornecedorFormComponent)
  },
  {
    path: 'produtos',
    canActivate: guard,
    data: { menu: 'produtos' },
    loadComponent: () => import('./features/produtos/produtos.component').then(m => m.ProdutosComponent)
  },
  {
    path: 'produtos/novo',
    canActivate: guard,
    data: { menu: 'produtos' },
    loadComponent: () => import('./features/produtos/produto-form.component').then(m => m.ProdutoFormComponent)
  },
  {
    path: 'produtos/:id/editar',
    canActivate: guard,
    data: { menu: 'produtos' },
    loadComponent: () => import('./features/produtos/produto-form.component').then(m => m.ProdutoFormComponent)
  },
  {
    path: 'roteiro',
    canActivate: guard,
    data: { menu: 'roteiro' },
    loadComponent: () => import('./features/roteiro/roteiros.component').then(m => m.RoteirosComponent)
  },
  {
    path: 'roteiro/novo',
    canActivate: guard,
    data: { menu: 'roteiro' },
    loadComponent: () => import('./features/roteiro/roteiro-form.component').then(m => m.RoteiroFormComponent)
  },
  {
    path: 'roteiro/recursos',
    canActivate: guard,
    data: { menu: 'roteiro' },
    loadComponent: () => import('./features/roteiro/recursos.component').then(m => m.RecursosComponent)
  },
  {
    path: 'roteiro/recursos/novo',
    canActivate: guard,
    data: { menu: 'roteiro' },
    loadComponent: () => import('./features/roteiro/recurso-form.component').then(m => m.RecursoFormComponent)
  },
  {
    path: 'roteiro/recursos/:id/editar',
    canActivate: guard,
    data: { menu: 'roteiro' },
    loadComponent: () => import('./features/roteiro/recurso-form.component').then(m => m.RecursoFormComponent)
  },
  {
    path: 'roteiro/:id/editar',
    canActivate: guard,
    data: { menu: 'roteiro' },
    loadComponent: () => import('./features/roteiro/roteiro-form.component').then(m => m.RoteiroFormComponent)
  },
  { path: 'processos', redirectTo: 'roteiro', pathMatch: 'full' },
  {
    path: 'bom',
    canActivate: guard,
    data: { menu: 'bom' },
    loadComponent: () => import('./features/bom/bom.component').then(m => m.BomComponent)
  },
  {
    path: 'bom/novo',
    canActivate: guard,
    data: { menu: 'bom' },
    loadComponent: () => import('./features/bom/bom-form.component').then(m => m.BomFormComponent)
  },
  {
    path: 'bom/:id/editar',
    canActivate: guard,
    data: { menu: 'bom' },
    loadComponent: () => import('./features/bom/bom-form.component').then(m => m.BomFormComponent)
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
