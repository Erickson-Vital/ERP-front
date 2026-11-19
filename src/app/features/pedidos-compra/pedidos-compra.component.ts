import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PedidoCompra, ItemPedido, Produto, Fornecedor } from '../../core/models';
import { filtrarPor, paginar, totalPaginas } from '../../core/paginacao';

@Component({
  selector: 'app-pedidos-compra',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos-compra.component.html',
  styleUrl: './pedidos-compra.component.css'
})
export class PedidosCompraComponent implements OnInit {
  pedidos: PedidoCompra[] = [];
  fornecedores: Fornecedor[] = [];
  produtos: Produto[] = [];
  loading = false;
  error = '';
  sucesso = '';
  painel = false;

  // Filtro e paginação
  filtro = '';
  filtroStatus = 0;
  pagina = 1;
  tamanho = 10;
  get filtrados(): PedidoCompra[] {
    let base = this.pedidos;
    if (this.filtroStatus > 0) base = base.filter(p => p.status === this.filtroStatus);
    return filtrarPor(base, this.filtro, [p => p.numero, p => p.fornecedorNome]);
  }
  get paginados(): PedidoCompra[] { return paginar(this.filtrados, this.pagina, this.tamanho); }
  get totalPaginas(): number { return totalPaginas(this.filtrados.length, this.tamanho); }

  fornecedorId = '';
  itens: ItemPedido[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
    this.api.getFornecedores().subscribe(d => this.fornecedores = d);
    this.api.getProdutos().subscribe(d => this.produtos = d);
  }

  load() {
    this.loading = true;
    this.api.getPedidosCompra().subscribe({
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
    this.fornecedorId = '';
    this.itens = [{ produtoId: '', unidadeMedidaId: '', quantidade: 1, precoUnitario: 0, desconto: 0 }];
  }

  adicionarItem() { this.itens.push({ produtoId: '', unidadeMedidaId: '', quantidade: 1, precoUnitario: 0, desconto: 0 }); }
  removerItem(i: number) { this.itens.splice(i, 1); }

  onProdutoChange(item: ItemPedido) {
    const p = this.produtos.find(x => x.id === item.produtoId);
    if (p) {
      item.precoUnitario = p.precoCustoMedio;
      item.unidadeMedidaId = p.unidadeMedidaId;
    }
  }

  subtotal(item: ItemPedido): number { return (item.quantidade * item.precoUnitario) - item.desconto; }
  total(): number { return this.itens.reduce((acc, i) => acc + this.subtotal(i), 0); }

  salvar() {
    this.error = '';
    if (!this.fornecedorId) { this.error = 'Selecione um fornecedor.'; return; }
    const itensValidos = this.itens.filter(i => i.produtoId && i.quantidade > 0);
    if (itensValidos.length === 0) { this.error = 'Adicione ao menos um item válido.'; return; }

    this.api.createPedidoCompra({ fornecedorId: this.fornecedorId, itens: itensValidos }).subscribe({
      next: () => { this.sucesso = 'Pedido de compra criado.'; this.painel = false; this.load(); },
      error: (e) => { this.error = e?.error ?? 'Erro ao salvar pedido.'; }
    });
  }

  receber(p: PedidoCompra) {
    this.api.receberPedidoCompra(p.id).subscribe({
      next: () => { this.sucesso = 'Pedido recebido.'; this.load(); },
      error: (e) => { this.error = e?.error ?? 'Erro ao receber.'; }
    });
  }

  cancelar(p: PedidoCompra) {
    if (!confirm(`Cancelar pedido ${p.numero}?`)) return;
    this.api.cancelarPedidoCompra(p.id).subscribe({
      next: () => { this.sucesso = 'Pedido cancelado.'; this.load(); },
      error: (e) => { this.error = e?.error ?? 'Erro ao cancelar.'; }
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
}
