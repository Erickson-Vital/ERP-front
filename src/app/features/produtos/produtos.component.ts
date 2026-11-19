import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import { Produto, ProdutoCreate, UnidadeMedida, FamiliaProduto } from '../../core/models';

@Component({
    selector: 'app-produtos',
    imports: [CommonModule, FormsModule],
    templateUrl: './produtos.component.html',
    styleUrl: './produtos.component.css'
})
export class ProdutosComponent implements OnInit {
  produtos: Produto[] = [];
  unidades: UnidadeMedida[] = [];
  familias: FamiliaProduto[] = [];
  loading = false;
  error = '';
  editando: Produto | null = null;
  form: ProdutoCreate = this.blankForm();

  // Filtros e paginação
  filtro = '';
  pagina = 1;
  tamanho = 10;
  get paginados(): Produto[] {
    const base = this.produtos.filter(p => {
      if (!this.filtro.trim()) return true;
      const t = this.filtro.trim().toLowerCase();
      return (p.codigo || '').toLowerCase().includes(t) ||
             (p.descricao || '').toLowerCase().includes(t) ||
             (p.familiaProdutoNome || '').toLowerCase().includes(t);
    });
    const ini = (this.pagina - 1) * this.tamanho;
    return base.slice(ini, ini + this.tamanho);
  }
  get totalFiltrados(): number {
    return this.produtos.filter(p => {
      if (!this.filtro.trim()) return true;
      const t = this.filtro.trim().toLowerCase();
      return (p.codigo || '').toLowerCase().includes(t) ||
             (p.descricao || '').toLowerCase().includes(t) ||
             (p.familiaProdutoNome || '').toLowerCase().includes(t);
    }).length;
  }
  get totalPaginas(): number { return Math.max(1, Math.ceil(this.totalFiltrados / this.tamanho)); }

  tipos = [
    { valor: 1, label: 'Produto' },
    { valor: 2, label: 'Serviço' },
    { valor: 3, label: 'Matéria-prima' },
    { valor: 4, label: 'Kit (composto)' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
    this.api.getUnidadesMedida().subscribe(d => this.unidades = d);
    this.api.getFamiliasProduto().subscribe(d => this.familias = d);
  }

  load() {
    this.loading = true;
    this.api.getProdutos().subscribe({
      next: (d) => { this.produtos = d; this.loading = false; },
      error: () => { this.error = 'Erro ao carregar produtos.'; this.loading = false; }
    });
  }

  onFiltro() { this.pagina = 1; }
  irPagina(p: number) {
    if (p < 1 || p > this.totalPaginas) return;
    this.pagina = p;
  }

  blankForm(): ProdutoCreate {
    return { codigo: '', descricao: '', tipo: 1, precoVendaPadrao: 0, precoCustoMedio: 0,
      ativo: true, unidadeMedidaId: null, familiaProdutoId: null };
  }

  novo() { this.editando = null; this.form = this.blankForm(); this.error = ''; }

  editar(p: Produto) {
    this.editando = p;
    this.error = '';
    this.form = {
      codigo: p.codigo, codigoBarras: p.codigoBarras, descricao: p.descricao, tipo: p.tipo,
      ncm: p.ncm, cest: p.cest, cfop: p.cfop, precoVendaPadrao: p.precoVendaPadrao,
      precoCustoMedio: p.precoCustoMedio, ativo: p.ativo, unidadeMedidaId: p.unidadeMedidaId,
      familiaProdutoId: p.familiaProdutoId
    };
  }

  salvar() {
    this.error = '';
    if (!this.form.codigo || !this.form.descricao) {
      this.error = 'Código e Descrição são obrigatórios.';
      return;
    }
    if (!this.form.unidadeMedidaId || !this.form.familiaProdutoId) {
      this.error = 'Selecione a Unidade de Medida e a Família do produto.';
      return;
    }

    const payload: ProdutoCreate = {
      ...this.form,
      ativo: this.form.ativo,
      unidadeMedidaId: this.form.unidadeMedidaId || null,
      familiaProdutoId: this.form.familiaProdutoId || null
    };

    if (this.editando) {
      this.api.updateProduto(this.editando.id, payload).subscribe({
        next: () => { this.editando = null; this.load(); },
        error: (e) => { this.error = mensagemErro(e, 'Erro ao salvar produto.'); }
      });
    } else {
      this.api.createProduto(payload).subscribe({
        next: () => { this.editando = null; this.load(); },
        error: (e) => { this.error = mensagemErro(e, 'Erro ao salvar produto.'); }
      });
    }
  }

  excluir(p: Produto) {
    if (!confirm(`Excluir produto "${p.descricao}"?`)) return;
    this.api.deleteProduto(p.id).subscribe({
      next: () => this.load(),
      error: (e) => { this.error = mensagemErro(e, 'Erro ao excluir.'); }
    });
  }

  /** Alterna o status ativo/inativo de um produto. */
  alternarAtivo(p: Produto) {
    this.error = '';
    const novo = !p.ativo;
    this.api.alterarStatusProduto(p.id, novo).subscribe({
      next: () => {
        p.ativo = novo;
      },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao alterar o status do produto.'); }
    });
  }

  tipoLabel(t: number): string {
    return this.tipos.find(x => x.valor === t)?.label ?? '—';
  }
}
