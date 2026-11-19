import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import { PedidoVenda, ItemPedido, Produto, Cliente, EstoqueProduto, VerificacaoEstoque } from '../../core/models';
import { filtrarPor, paginar, totalPaginas } from '../../core/paginacao';

@Component({
    selector: 'app-pedidos-venda',
    imports: [CommonModule, FormsModule],
    templateUrl: './pedidos-venda.component.html',
    styleUrl: './pedidos-venda.component.css'
})
export class PedidosVendaComponent implements OnInit {
  pedidos: PedidoVenda[] = [];
  clientes: Cliente[] = [];
  produtos: Produto[] = [];
  estoques: EstoqueProduto[] = [];
  loading = false;
  error = '';
  sucesso = '';
  painel = false;

  // Filtro e paginação
  filtro = '';
  filtroStatus = 0;
  pagina = 1;
  tamanho = 10;
  get filtrados(): PedidoVenda[] {
    let base = this.pedidos;
    if (this.filtroStatus > 0) base = base.filter(p => p.status === this.filtroStatus);
    return filtrarPor(base, this.filtro, [p => p.numero, p => p.clienteNome]);
  }
  get paginados(): PedidoVenda[] { return paginar(this.filtrados, this.pagina, this.tamanho); }
  get totalPaginas(): number { return totalPaginas(this.filtrados.length, this.tamanho); }

  clienteId = '';
  itens: ItemPedido[] = [];

  // Alerta de estoque
  verificacao: VerificacaoEstoque[] = [];
  temFaltaEstoque = false;

  temFaltaVerificacao(): boolean {
    return this.verificacao.some(v => !v.suficiente);
  }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
    this.api.getClientes().subscribe(d => this.clientes = d);
    this.api.getProdutos().subscribe(d => this.produtos = d);
    this.api.getEstoques().subscribe(d => this.estoques = d);
  }

  load() {
    this.loading = true;
    this.api.getPedidosVenda().subscribe({
      next: (d) => { this.pedidos = d; this.loading = false; },
      error: () => { this.error = 'Erro ao carregar pedidos.'; this.loading = false; }
    });
  }

  onFiltro() { this.pagina = 1; }
  irPagina(p: number) { if (p >= 1 && p <= this.totalPaginas) this.pagina = p; }

  novo() {
    this.painel = true;
    this.error = '';
    this.sucesso = '';
    this.clienteId = '';
    this.itens = [{ produtoId: '', unidadeMedidaId: '', quantidade: 1, precoUnitario: 0, desconto: 0 }];
    this.verificacao = [];
    this.temFaltaEstoque = false;
  }

  adicionarItem() {
    this.itens.push({ produtoId: '', unidadeMedidaId: '', quantidade: 1, precoUnitario: 0, desconto: 0 });
  }

  removerItem(i: number) {
    this.itens.splice(i, 1);
    this.verificar();
  }

  onProdutoChange(item: ItemPedido) {
    const p = this.produtos.find(x => x.id === item.produtoId);
    if (p) {
      item.precoUnitario = p.precoVendaPadrao;
      item.unidadeMedidaId = p.unidadeMedidaId;
    }
    this.verificar();
  }

  /** Estoque disponível de um produto (soma de todos os armazéns). Para kits, retorna null. */
  disponivel(produtoId: string): number {
    if (!produtoId) return 0;
    return this.estoques.filter(e => e.produtoId === produtoId)
      .reduce((acc, e) => acc + e.quantidadeAtual, 0);
  }

  produto(produtoId: string): Produto | undefined {
    return this.produtos.find(p => p.id === produtoId);
  }

  ehKit(produtoId: string): boolean {
    return this.produto(produtoId)?.tipo === 4;
  }

  /** Verificação (resultado do backend) de um produto específico. */
  verificacaoDe(produtoId: string): VerificacaoEstoque | undefined {
    return this.verificacao.find(v => v.produtoId === produtoId);
  }

  /** Quantidade total pedida para um produto (somando linhas repetidas). */
  solicitado(produtoId: string): number {
    return this.itens.filter(i => i.produtoId === produtoId)
      .reduce((acc, i) => acc + Number(i.quantidade || 0), 0);
  }

  faltaNaLinha(item: ItemPedido): boolean {
    if (!item.produtoId) return false;

    // Para kits, usa a verificação do backend (baseada nos componentes)
    const v = this.verificacaoDe(item.produtoId);
    if (v) return !v.suficiente;

    if (this.ehKit(item.produtoId)) return false;
    return this.solicitado(item.produtoId) > this.disponivel(item.produtoId);
  }

  /** Consulta o backend e atualiza o alerta de estoque. */
  verificar() {
    const validos = this.itens.filter(i => i.produtoId && Number(i.quantidade) > 0);
    if (validos.length === 0) {
      this.verificacao = [];
      this.temFaltaEstoque = false;
      return;
    }
    this.api.verificarEstoque(validos).subscribe({
      next: (v) => {
        this.verificacao = v;
        this.temFaltaEstoque = v.some(x => !x.suficiente);
      },
      error: () => {
        // Fallback: usa o estoque carregado localmente
        this.verificacao = [];
        this.temFaltaEstoque = this.itens.some(i => this.faltaNaLinha(i));
      }
    });
  }

  subtotal(item: ItemPedido): number {
    return (item.quantidade * item.precoUnitario) - item.desconto;
  }

  total(): number {
    return this.itens.reduce((acc, i) => acc + this.subtotal(i), 0);
  }

  salvar() {
    this.error = '';
    this.sucesso = '';
    if (!this.clienteId) { this.error = 'Selecione um cliente.'; return; }
    const itensValidos = this.itens.filter(i => i.produtoId && i.quantidade > 0);
    if (itensValidos.length === 0) { this.error = 'Adicione ao menos um item válido.'; return; }

    // Alerta: confirma se o usuário quer prosseguir mesmo sem estoque
    const faltas = this.itens.filter(i => this.faltaNaLinha(i));
    if (faltas.length > 0) {
      const nomes = faltas.map(i => {
        const v = this.verificacaoDe(i.produtoId);
        if (v?.ehKit) {
          const comps = v.componentes.filter(c => !c.suficiente)
            .map(c => `${c.descricao} (precisa ${c.quantidadeNecessaria}, tem ${c.quantidadeDisponivel})`)
            .join(', ');
          return `Kit ${v.produtoDescricao}: ${comps}`;
        }
        return `${this.produtoNome(i.produtoId)}: pedido ${this.solicitado(i.produtoId)}, disponível ${this.disponivel(i.produtoId)}`;
      }).join('\n');
      const continuar = confirm(
        `⚠️ ATENÇÃO: estoque insuficiente!\n\n${nomes}\n\nO pedido pode ser criado, mas NÃO poderá ser faturado até que o estoque seja reposto.\n\nDeseja continuar?`
      );
      if (!continuar) return;
    }

    this.api.createPedidoVenda({ clienteId: this.clienteId, itens: itensValidos }).subscribe({
      next: () => {
        this.sucesso = 'Pedido de venda criado.';
        this.painel = false;
        this.load();
      },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao salvar pedido.'); }
    });
  }

  faturar(p: PedidoVenda) {
    this.api.faturarPedidoVenda(p.id).subscribe({
      next: () => { this.sucesso = 'Pedido faturado.'; this.load(); this.api.getEstoques().subscribe(d => this.estoques = d); },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao faturar.'); }
    });
  }

  cancelar(p: PedidoVenda) {
    if (!confirm(`Cancelar pedido ${p.numero}?`)) return;
    this.api.cancelarPedidoVenda(p.id).subscribe({
      next: () => { this.sucesso = 'Pedido cancelado.'; this.load(); },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao cancelar.'); }
    });
  }

  statusLabel(s: number): string {
    const map: any = { 1: 'Rascunho', 2: 'Aberto', 3: 'Faturado', 4: 'Recebido', 5: 'Cancelado' };
    return map[s] ?? '—';
  }

  statusClass(s: number): string {
    const map: any = { 1: 'badge-gray', 2: 'badge-blue', 3: 'badge-green', 4: 'badge-green', 5: 'badge-red' };
    return map[s] ?? 'badge-gray';
  }

  produtoNome(id: string): string {
    return this.produtos.find(p => p.id === id)?.descricao ?? '';
  }
}
