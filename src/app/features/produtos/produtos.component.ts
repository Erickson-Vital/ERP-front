import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import { Produto, UnidadeMedida, FamiliaProduto } from '../../core/models';
import { paginar, totalPaginas, normalizar } from '../../core/paginacao';

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

  // ===== Campos digitados no 1º card de filtros =====
  filtroTexto = '';
  filtroFamilia = '';
  filtroTipo = '';
  filtroStatus: '' | '0' | '1' = '';

  // ===== Filtros efetivamente aplicados ao clicar em "Filtrar" =====
  filtroAplicadoTexto = '';
  filtroAplicadoFamilia = '';
  filtroAplicadoTipo = '';
  filtroAplicadoStatus: '' | '0' | '1' = '';

  pagina = 1;
  tamanho = 10;

  tipos = [
    { valor: 1, label: 'Produto' },
    { valor: 2, label: 'Serviço' },
    { valor: 3, label: 'Matéria-prima' },
    { valor: 4, label: 'Kit (composto)' }
  ];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.load();
    this.api.getUnidadesMedida().subscribe({ next: d => this.unidades = d });
    this.api.getFamiliasProduto().subscribe({ next: d => this.familias = d });
  }

  load() {
    this.loading = true;
    this.api.getProdutos().subscribe({
      next: (d) => { this.produtos = d; this.loading = false; },
      error: () => { this.error = 'Erro ao carregar produtos.'; this.loading = false; }
    });
  }

  get filtrados(): Produto[] {
    const termo = normalizar(this.filtroAplicadoTexto);
    const fam = this.filtroAplicadoFamilia;
    const tipo = this.filtroAplicadoTipo;
    const st = this.filtroAplicadoStatus;

    return this.produtos.filter(p => {
      if (termo) {
        const achou =
          normalizar(p.codigo).includes(termo) ||
          normalizar(p.codigoBarras).includes(termo) ||
          normalizar(p.descricao).includes(termo) ||
          normalizar(p.descricaoComplementar).includes(termo) ||
          normalizar(p.familiaProdutoNome).includes(termo) ||
          normalizar(p.ncm).includes(termo);
        if (!achou) return false;
      }
      if (fam && p.familiaProdutoId !== fam) return false;
      if (tipo && String(p.tipo) !== tipo) return false;
      if (st === '0' && !p.ativo) return false;
      if (st === '1' && p.ativo) return false;
      return true;
    });
  }

  get paginados(): Produto[] { return paginar(this.filtrados, this.pagina, this.tamanho); }
  get totalPaginas(): number { return totalPaginas(this.filtrados.length, this.tamanho); }

  aplicarFiltro() {
    this.filtroAplicadoTexto = this.filtroTexto;
    this.filtroAplicadoFamilia = this.filtroFamilia;
    this.filtroAplicadoTipo = this.filtroTipo;
    this.filtroAplicadoStatus = this.filtroStatus;
    this.pagina = 1;
  }

  limparFiltro() {
    this.filtroTexto = '';
    this.filtroFamilia = '';
    this.filtroTipo = '';
    this.filtroStatus = '';
    this.filtroAplicadoTexto = '';
    this.filtroAplicadoFamilia = '';
    this.filtroAplicadoTipo = '';
    this.filtroAplicadoStatus = '';
    this.pagina = 1;
  }

  onTamanhoChange() { this.pagina = 1; }

  irPagina(p: number) { if (p >= 1 && p <= this.totalPaginas) this.pagina = p; }

  novoProduto() { this.router.navigate(['/produtos/novo']); }

  editar(p: Produto) { this.router.navigate(['/produtos', p.id, 'editar']); }

  alternarAtivo(p: Produto) {
    this.error = '';
    const novo = !p.ativo;
    this.api.alterarStatusProduto(p.id, novo).subscribe({
      next: () => { p.ativo = novo; this.produtos = [...this.produtos]; },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao alterar o status do produto.'); }
    });
  }

  excluir(p: Produto) {
    if (!confirm(`Excluir produto "${p.descricao}"?`)) return;
    this.api.deleteProduto(p.id).subscribe({
      next: () => this.load(),
      error: (e) => { this.error = mensagemErro(e, 'Erro ao excluir.'); }
    });
  }

  tipoLabel(t: number): string {
    return this.tipos.find(x => x.valor === t)?.label ?? '—';
  }
}
