import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  OpcaoCategoria, Cliente, ClienteCreate, Fornecedor, FornecedorCreate,
  Produto, ProdutoCreate, UnidadeMedida, FamiliaProduto, Armazem,
  EstoqueProduto, MovimentacaoCreate, MovimentacaoEstoque,
  PedidoVenda, PedidoVendaCreate, PedidoCompra, PedidoCompraCreate, ItemPedido,
  Sessao, Usuario, UsuarioCreate, UsuarioUpdate, Auditoria, VerificacaoEstoque,
  Processo, ProcessoCreate, ProdutoComposicao, ProdutoProcesso, ComposicaoKit,
  BomResumo, KitOpcao, PaginaResult, EstoqueEmergencia, DefinirEmergencia,
  ContaBancaria, ContaBancariaCreate, ContaFinanceira, ContaFinanceiraCreate,
  BaixaCreate, Cobranca, CobrancaCreate, Conciliacao, ConciliacaoCreate, Dashboard
} from './models';

import { API } from './api-url';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // Clientes
  getClientes(): Observable<Cliente[]> { return this.http.get<Cliente[]>(`${API}/clientes`); }
  getCliente(id: string): Observable<Cliente> { return this.http.get<Cliente>(`${API}/clientes/${id}`); }
  createCliente(dto: ClienteCreate): Observable<Cliente> { return this.http.post<Cliente>(`${API}/clientes`, dto); }
  updateCliente(id: string, dto: ClienteCreate): Observable<void> { return this.http.put<void>(`${API}/clientes/${id}`, dto); }
  alterarStatusCliente(id: string, desativado: number): Observable<Cliente> {
    return this.http.patch<Cliente>(`${API}/clientes/${id}/status`, { desativado });
  }
  deleteCliente(id: string): Observable<void> { return this.http.delete<void>(`${API}/clientes/${id}`); }

  // Fornecedores
  getFornecedores(): Observable<Fornecedor[]> { return this.http.get<Fornecedor[]>(`${API}/fornecedores`); }
  getFornecedor(id: string): Observable<Fornecedor> { return this.http.get<Fornecedor>(`${API}/fornecedores/${id}`); }
  createFornecedor(dto: FornecedorCreate): Observable<Fornecedor> { return this.http.post<Fornecedor>(`${API}/fornecedores`, dto); }
  updateFornecedor(id: string, dto: FornecedorCreate): Observable<void> { return this.http.put<void>(`${API}/fornecedores/${id}`, dto); }
  alterarStatusFornecedor(id: string, desativado: number): Observable<Fornecedor> {
    return this.http.patch<Fornecedor>(`${API}/fornecedores/${id}/status`, { desativado });
  }
  deleteFornecedor(id: string): Observable<void> { return this.http.delete<void>(`${API}/fornecedores/${id}`); }

  // Tabelas Dedicadas de Categorias / Opções (Engrenagens)
  getOpcoesCategoria(rota: string): Observable<OpcaoCategoria[]> {
    return this.http.get<OpcaoCategoria[]>(`${API}/categorias/${rota}`);
  }
  addOpcaoCategoria(rota: string, nome: string): Observable<OpcaoCategoria> {
    return this.http.post<OpcaoCategoria>(`${API}/categorias/${rota}`, { nome });
  }
  updateOpcaoCategoria(rota: string, id: string, nome: string): Observable<OpcaoCategoria> {
    return this.http.put<OpcaoCategoria>(`${API}/categorias/${rota}/${id}`, { nome });
  }
  deleteOpcaoCategoria(rota: string, id: string): Observable<void> {
    return this.http.delete<void>(`${API}/categorias/${rota}/${id}`);
  }

  // Produtos
  getProdutos(): Observable<Produto[]> { return this.http.get<Produto[]>(`${API}/produtos`); }
  getProduto(id: string): Observable<Produto> { return this.http.get<Produto>(`${API}/produtos/${id}`); }
  createProduto(dto: ProdutoCreate): Observable<Produto> { return this.http.post<Produto>(`${API}/produtos`, dto); }
  updateProduto(id: string, dto: ProdutoCreate): Observable<void> { return this.http.put<void>(`${API}/produtos/${id}`, dto); }
  deleteProduto(id: string): Observable<void> { return this.http.delete<void>(`${API}/produtos/${id}`); }

  alterarStatusProduto(id: string, ativo: boolean): Observable<void> {
    return this.http.patch<void>(`${API}/produtos/${id}/status`, { ativo });
  }

  // ---------- BOM (Bill of Materials) ----------
  getBom(): Observable<BomResumo[]> { return this.http.get<BomResumo[]>(`${API}/bom`); }
  getKits(): Observable<KitOpcao[]> { return this.http.get<KitOpcao[]>(`${API}/bom/kits`); }
  getBomDetalhe(produtoId: string): Observable<ComposicaoKit> {
    return this.http.get<ComposicaoKit>(`${API}/bom/${produtoId}`);
  }
  addComponente(produtoId: string, dto: { componenteId: string; quantidade: number }): Observable<ProdutoComposicao> {
    return this.http.post<ProdutoComposicao>(`${API}/bom/${produtoId}/componentes`, dto);
  }
  updateComponente(produtoId: string, composicaoId: string, dto: { componenteId: string; quantidade: number }): Observable<void> {
    return this.http.put<void>(`${API}/bom/${produtoId}/componentes/${composicaoId}`, dto);
  }
  removeComponente(produtoId: string, composicaoId: string): Observable<void> {
    return this.http.delete<void>(`${API}/bom/${produtoId}/componentes/${composicaoId}`);
  }
  addProcessoKit(produtoId: string, dto: { processoId: string; horas: number }): Observable<ProdutoProcesso> {
    return this.http.post<ProdutoProcesso>(`${API}/bom/${produtoId}/processos`, dto);
  }
  updateProcessoKit(produtoId: string, produtoProcessoId: string, dto: { processoId: string; horas: number }): Observable<void> {
    return this.http.put<void>(`${API}/bom/${produtoId}/processos/${produtoProcessoId}`, dto);
  }
  removeProcessoKit(produtoId: string, produtoProcessoId: string): Observable<void> {
    return this.http.delete<void>(`${API}/bom/${produtoId}/processos/${produtoProcessoId}`);
  }

  // Processos produtivos
  getProcessos(): Observable<Processo[]> { return this.http.get<Processo[]>(`${API}/processos`); }
  createProcesso(dto: ProcessoCreate): Observable<Processo> { return this.http.post<Processo>(`${API}/processos`, dto); }
  updateProcesso(id: string, dto: ProcessoCreate): Observable<void> { return this.http.put<void>(`${API}/processos/${id}`, dto); }
  deleteProcesso(id: string): Observable<void> { return this.http.delete<void>(`${API}/processos/${id}`); }

  // Cadastros de apoio
  getUnidadesMedida(): Observable<UnidadeMedida[]> { return this.http.get<UnidadeMedida[]>(`${API}/unidades-medida`); }
  createUnidadeMedida(dto: any): Observable<UnidadeMedida> { return this.http.post<UnidadeMedida>(`${API}/unidades-medida`, dto); }

  getFamiliasProduto(): Observable<FamiliaProduto[]> { return this.http.get<FamiliaProduto[]>(`${API}/familias-produto`); }
  createFamiliaProduto(dto: any): Observable<FamiliaProduto> { return this.http.post<FamiliaProduto>(`${API}/familias-produto`, dto); }

  getArmazens(): Observable<Armazem[]> { return this.http.get<Armazem[]>(`${API}/armazens`); }
  createArmazem(dto: any): Observable<Armazem> { return this.http.post<Armazem>(`${API}/armazens`, dto); }
  updateArmazem(id: string, dto: any): Observable<void> { return this.http.put<void>(`${API}/armazens/${id}`, dto); }
  deleteArmazem(id: string): Observable<void> { return this.http.delete<void>(`${API}/armazens/${id}`); }

  // Estoque
  getEstoques(): Observable<EstoqueProduto[]> { return this.http.get<EstoqueProduto[]>(`${API}/estoque`); }
  movimentar(dto: MovimentacaoCreate): Observable<EstoqueProduto> { return this.http.post<EstoqueProduto>(`${API}/estoque/movimentar`, dto); }
  consultarEstoque(filtros: {
    termo?: string; armazemId?: string | null; emergencia?: boolean; ativos?: boolean; pagina?: number; tamanho?: number;
  }): Observable<PaginaResult<EstoqueProduto>> {
    const p = new URLSearchParams();
    if (filtros.termo) p.set('termo', filtros.termo);
    if (filtros.armazemId) p.set('armazemId', filtros.armazemId);
    if (filtros.emergencia) p.set('emergencia', 'true');
    if (filtros.ativos) p.set('ativos', 'true');
    p.set('pagina', String(filtros.pagina ?? 1));
    p.set('tamanho', String(filtros.tamanho ?? 10));
    return this.http.get<PaginaResult<EstoqueProduto>>(`${API}/estoque/consulta?${p.toString()}`);
  }
  getEstoqueEmergencia(armazemId?: string | null): Observable<EstoqueEmergencia[]> {
    const q = armazemId ? `?armazemId=${armazemId}` : '';
    return this.http.get<EstoqueEmergencia[]>(`${API}/estoque/emergencia${q}`);
  }
  definirEmergencia(dto: DefinirEmergencia): Observable<void> {
    return this.http.post<void>(`${API}/estoque/emergencia`, dto);
  }

  // Pedidos de Venda
  getPedidosVenda(): Observable<PedidoVenda[]> { return this.http.get<PedidoVenda[]>(`${API}/pedidosvenda`); }
  getPedidoVenda(id: string): Observable<PedidoVenda> { return this.http.get<PedidoVenda>(`${API}/pedidosvenda/${id}`); }
  createPedidoVenda(dto: PedidoVendaCreate): Observable<PedidoVenda> { return this.http.post<PedidoVenda>(`${API}/pedidosvenda`, dto); }
  faturarPedidoVenda(id: string): Observable<void> { return this.http.post<void>(`${API}/pedidosvenda/${id}/faturar`, {}); }
  cancelarPedidoVenda(id: string): Observable<void> { return this.http.post<void>(`${API}/pedidosvenda/${id}/cancelar`, {}); }

  // Pedidos de Compra
  getPedidosCompra(): Observable<PedidoCompra[]> { return this.http.get<PedidoCompra[]>(`${API}/pedidoscompra`); }
  getPedidoCompra(id: string): Observable<PedidoCompra> { return this.http.get<PedidoCompra>(`${API}/pedidoscompra/${id}`); }
  createPedidoCompra(dto: PedidoCompraCreate): Observable<PedidoCompra> { return this.http.post<PedidoCompra>(`${API}/pedidoscompra`, dto); }
  receberPedidoCompra(id: string): Observable<void> { return this.http.post<void>(`${API}/pedidoscompra/${id}/receber`, {}); }
  cancelarPedidoCompra(id: string): Observable<void> { return this.http.post<void>(`${API}/pedidoscompra/${id}/cancelar`, {}); }

  // Verificação de estoque (alerta na tela de pedido de venda)
  verificarEstoque(itens: ItemPedido[]): Observable<VerificacaoEstoque[]> {
    return this.http.post<VerificacaoEstoque[]>(`${API}/pedidosvenda/verificar-estoque`, itens);
  }
  getHistoricoEstoque(take = 100): Observable<MovimentacaoEstoque[]> {
    return this.http.get<MovimentacaoEstoque[]>(`${API}/estoque/historico?take=${take}`);
  }

  // ---------- Autenticação / Segurança ----------
  login(login: string, senha: string): Observable<Sessao> {
    return this.http.post<Sessao>(`${API}/auth/login`, { login, senha });
  }
  logout(): Observable<void> { return this.http.post<void>(`${API}/auth/logout`, {}); }

  getUsuarios(): Observable<Usuario[]> { return this.http.get<Usuario[]>(`${API}/usuarios`); }
  createUsuario(dto: UsuarioCreate): Observable<Usuario> { return this.http.post<Usuario>(`${API}/usuarios`, dto); }
  updateUsuario(id: string, dto: UsuarioUpdate): Observable<Usuario> { return this.http.put<Usuario>(`${API}/usuarios/${id}`, dto); }
  deleteUsuario(id: string): Observable<void> { return this.http.delete<void>(`${API}/usuarios/${id}`); }

  getAuditoria(take = 200, menu?: string): Observable<Auditoria[]> {
    const q = menu ? `?take=${take}&menu=${encodeURIComponent(menu)}` : `?take=${take}`;
    return this.http.get<Auditoria[]>(`${API}/auditoria${q}`);
  }

  // ---------- Financeiro ----------
  getContasFinanceiras(): Observable<ContaFinanceira[]> { return this.http.get<ContaFinanceira[]>(`${API}/financeiro/contas`); }
  getContaFinanceira(id: string): Observable<ContaFinanceira> { return this.http.get<ContaFinanceira>(`${API}/financeiro/contas/${id}`); }
  createContaFinanceira(dto: ContaFinanceiraCreate): Observable<ContaFinanceira> { return this.http.post<ContaFinanceira>(`${API}/financeiro/contas`, dto); }
  cancelarContaFinanceira(id: string): Observable<void> { return this.http.post<void>(`${API}/financeiro/contas/${id}/cancelar`, {}); }
  baixarConta(id: string, dto: BaixaCreate): Observable<ContaFinanceira> { return this.http.post<ContaFinanceira>(`${API}/financeiro/contas/${id}/baixar`, dto); }

  getContasBancarias(): Observable<ContaBancaria[]> { return this.http.get<ContaBancaria[]>(`${API}/financeiro/bancos`); }
  createContaBancaria(dto: ContaBancariaCreate): Observable<ContaBancaria> { return this.http.post<ContaBancaria>(`${API}/financeiro/bancos`, dto); }
  deleteContaBancaria(id: string): Observable<void> { return this.http.delete<void>(`${API}/financeiro/bancos/${id}`); }

  getCobrancas(): Observable<Cobranca[]> { return this.http.get<Cobranca[]>(`${API}/financeiro/cobrancas`); }
  gerarCobranca(dto: CobrancaCreate): Observable<Cobranca> { return this.http.post<Cobranca>(`${API}/financeiro/cobrancas`, dto); }

  getConciliacoes(): Observable<Conciliacao[]> { return this.http.get<Conciliacao[]>(`${API}/financeiro/conciliacoes`); }
  criarConciliacao(dto: ConciliacaoCreate): Observable<Conciliacao> { return this.http.post<Conciliacao>(`${API}/financeiro/conciliacoes`, dto); }
  fecharConciliacao(id: string): Observable<void> { return this.http.post<void>(`${API}/financeiro/conciliacoes/${id}/fechar`, {}); }

  // ---------- Dashboard ----------
  getDashboard(): Observable<Dashboard> { return this.http.get<Dashboard>(`${API}/dashboard`); }
}
