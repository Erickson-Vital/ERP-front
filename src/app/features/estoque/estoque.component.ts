import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import { EstoqueProduto, MovimentacaoCreate, Produto, Armazem, MovimentacaoEstoque } from '../../core/models';
import { filtrarPor, paginar, totalPaginas } from '../../core/paginacao';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estoque.component.html',
  styleUrl: './estoque.component.css'
})
export class EstoqueComponent implements OnInit {
  estoques: EstoqueProduto[] = [];
  produtos: Produto[] = [];
  armazens: Armazem[] = [];
  historico: MovimentacaoEstoque[] = [];
  loading = false;
  error = '';
  sucesso = '';
  mostrarHistorico = false;
  form: MovimentacaoCreate = { produtoId: '', armazemId: '', tipo: 1, quantidade: 1 };

  // Filtros e paginação - posição
  filtro = '';
  filtroArmazem = '';
  pagina = 1;
  tamanho = 10;
  get filtradosPosicao(): EstoqueProduto[] {
    let base = this.estoques;
    if (this.filtroArmazem) base = base.filter(e => e.armazemId === this.filtroArmazem);
    return filtrarPor(base, this.filtro, [e => e.produtoDescricao, e => e.produtoCodigo, e => e.armazemNome]);
  }
  get paginadosPosicao(): EstoqueProduto[] { return paginar(this.filtradosPosicao, this.pagina, this.tamanho); }
  get totalPaginas(): number { return totalPaginas(this.filtradosPosicao.length, this.tamanho); }

  // Filtros e paginação - histórico
  filtroHist = '';
  paginaHist = 1;
  get filtradosHist(): MovimentacaoEstoque[] {
    return filtrarPor(this.historico, this.filtroHist, [h => h.produtoDescricao, h => h.armazemNome, h => h.observacao]);
  }
  get paginadosHist(): MovimentacaoEstoque[] { return paginar(this.filtradosHist, this.paginaHist, this.tamanho); }
  get totalPaginasHist(): number { return totalPaginas(this.filtradosHist.length, this.tamanho); }

  onFiltro() { this.pagina = 1; }
  irPagina(p: number) { if (p >= 1 && p <= this.totalPaginas) this.pagina = p; }
  onFiltroHist() { this.paginaHist = 1; }
  irPaginaHist(p: number) { if (p >= 1 && p <= this.totalPaginasHist) this.paginaHist = p; }

  tipos = [
    { valor: 1, label: 'Entrada' },
    { valor: 2, label: 'Saída' },
    { valor: 3, label: 'Ajuste' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
    this.api.getProdutos().subscribe(d => this.produtos = d);
    this.api.getArmazens().subscribe(d => this.armazens = d);
  }

  load() {
    this.loading = true;
    this.api.getEstoques().subscribe({
      next: (d) => { this.estoques = d; this.loading = false; },
      error: () => { this.error = 'Erro ao carregar estoque.'; this.loading = false; }
    });
  }

  movimentar() {
    this.error = '';
    this.sucesso = '';
    if (!this.form.produtoId || !this.form.armazemId) {
      this.error = 'Selecione produto e armazém.';
      return;
    }
    this.api.movimentar(this.form).subscribe({
      next: () => {
        this.sucesso = 'Movimentação registrada com sucesso.';
        this.form = { produtoId: '', armazemId: '', tipo: 1, quantidade: 1 };
        this.load();
      },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao movimentar estoque.'); }
    });
  }

  verHistorico() {
    this.mostrarHistorico = true;
    this.api.getHistoricoEstoque(100).subscribe({
      next: (h) => { this.historico = h; },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao carregar histórico.'); }
    });
  }

  tipoHistorico(t: number): string {
    return t === 1 ? 'Entrada' : t === 2 ? 'Saída' : 'Ajuste';
  }
  tipoClass(t: number): string {
    return t === 1 ? 'badge-green' : t === 2 ? 'badge-red' : 'badge-blue';
  }

  tipoLabel(t: number): string {
    return this.tipos.find(x => x.valor === t)?.label ?? '—';
  }

  abaixoMinimo(e: EstoqueProduto): boolean {
    return e.quantidadeAtual < e.quantidadeMinima;
  }
}
