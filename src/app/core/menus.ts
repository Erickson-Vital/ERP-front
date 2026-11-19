/** Definição dos menus do sistema (alinhada com Erp.Domain.Common.Menus no backend). */
export interface MenuItem {
  codigo: string;
  label: string;
  route: string;
  icon: string;
  grupo: string;
}

export const MENUS: MenuItem[] = [
  { codigo: 'painel', label: 'Painel', route: '/painel', icon: '📊', grupo: 'Geral' },

  { codigo: 'clientes', label: 'Clientes', route: '/clientes', icon: '👥', grupo: 'Cadastros' },
  { codigo: 'fornecedores', label: 'Fornecedores', route: '/fornecedores', icon: '🏭', grupo: 'Cadastros' },
  { codigo: 'produtos', label: 'Produtos', route: '/produtos', icon: '📦', grupo: 'Cadastros' },
  { codigo: 'processos', label: 'Processos', route: '/processos', icon: '⚙️', grupo: 'Cadastros' },
  { codigo: 'bom', label: 'BOM (Estrutura de Kits)', route: '/bom', icon: '🧩', grupo: 'Cadastros' },

  { codigo: 'gestao-estoque', label: 'Gestão do Estoque', route: '/gestao-estoque', icon: '🏭', grupo: 'Operação' },
  { codigo: 'estoque', label: 'Estoque', route: '/estoque', icon: '🏬', grupo: 'Operação' },
  { codigo: 'pedidos-venda', label: 'Pedidos de Venda', route: '/pedidos-venda', icon: '🧾', grupo: 'Operação' },
  { codigo: 'pedidos-compra', label: 'Pedidos de Compra', route: '/pedidos-compra', icon: '🛒', grupo: 'Operação' },

  { codigo: 'financeiro', label: 'Financeiro', route: '/financeiro', icon: '💰', grupo: 'Financeiro' },

  { codigo: 'usuarios', label: 'Usuários e Acessos', route: '/usuarios', icon: '🔐', grupo: 'Administração' },
  { codigo: 'auditoria', label: 'Auditoria', route: '/auditoria', icon: '📜', grupo: 'Administração' }
];

export function menuPorCodigo(codigo: string): MenuItem | undefined {
  return MENUS.find(m => m.codigo === codigo);
}
