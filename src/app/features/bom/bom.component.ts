import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import { Bom, OpcaoCategoria } from '../../core/models';
import { paginar, totalPaginas, normalizar } from '../../core/paginacao';

@Component({
  selector: 'app-bom',
  imports: [CommonModule, FormsModule],
  templateUrl: './bom.component.html',
  styleUrl: './bom.component.css'
})
export class BomComponent implements OnInit {
  boms: Bom[] = [];
  unidadesBom: OpcaoCategoria[] = [];
  loading = false;
  error = '';

  // ===== Campos digitados no 1º card de filtros =====
  filtroTexto = '';
  filtroUnidade = '';
  filtroStatus: '' | '0' | '1' = '';

  // ===== Filtros efetivamente aplicados ao clicar em "Filtrar" =====
  filtroAplicadoTexto = '';
  filtroAplicadoUnidade = '';
  filtroAplicadoStatus: '' | '0' | '1' = '';

  pagina = 1;
  tamanho = 10;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.load();
    this.api.getOpcoesCategoria('unidades-bom').subscribe({
      next: d => { this.unidadesBom = d; }
    });
  }

  load() {
    this.loading = true;
    this.api.getBoms().subscribe({
      next: d => {
        this.boms = d;
        this.loading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar as BOMs cadastradas.';
        this.loading = false;
      }
    });
  }

  get filtrados(): Bom[] {
    const termo = normalizar(this.filtroAplicadoTexto);
    const unid = this.filtroAplicadoUnidade;
    const st = this.filtroAplicadoStatus;

    return this.boms.filter(b => {
      if (termo) {
        const achouPai =
          normalizar(b.produtoPaiCodigo).includes(termo) ||
          normalizar(b.produtoPaiDescricao).includes(termo) ||
          normalizar(b.unidadeMedidaBomNome).includes(termo);
        const achouFilho = (b.itens || []).some(
          i => normalizar(i.produtoFilhoCodigo).includes(termo) || normalizar(i.produtoFilhoDescricao).includes(termo)
        );
        if (!achouPai && !achouFilho) return false;
      }
      if (unid && b.unidadeMedidaBomId !== unid) return false;
      if (st === '0' && !b.ativo) return false;
      if (st === '1' && b.ativo) return false;
      return true;
    });
  }

  get paginados(): Bom[] { return paginar(this.filtrados, this.pagina, this.tamanho); }
  get totalPaginas(): number { return totalPaginas(this.filtrados.length, this.tamanho); }

  aplicarFiltro() {
    this.filtroAplicadoTexto = this.filtroTexto;
    this.filtroAplicadoUnidade = this.filtroUnidade;
    this.filtroAplicadoStatus = this.filtroStatus;
    this.pagina = 1;
  }

  limparFiltro() {
    this.filtroTexto = '';
    this.filtroUnidade = '';
    this.filtroStatus = '';
    this.filtroAplicadoTexto = '';
    this.filtroAplicadoUnidade = '';
    this.filtroAplicadoStatus = '';
    this.pagina = 1;
  }

  onTamanhoChange() { this.pagina = 1; }

  irPagina(p: number) { if (p >= 1 && p <= this.totalPaginas) this.pagina = p; }

  novaBom() { this.router.navigate(['/bom/novo']); }

  editar(b: Bom) { this.router.navigate(['/bom', b.id, 'editar']); }

  alternarAtivo(b: Bom) {
    this.error = '';
    const novo = !b.ativo;
    this.api.alterarStatusBom(b.id, novo).subscribe({
      next: () => {
        b.ativo = novo;
        this.boms = [...this.boms];
      },
      error: e => { this.error = mensagemErro(e, 'Erro ao alterar o status da BOM.'); }
    });
  }

  excluir(b: Bom) {
    if (!confirm(`Excluir a BOM do produto "${b.produtoPaiCodigo} - ${b.produtoPaiDescricao}"?`)) return;
    this.api.deleteBom(b.id).subscribe({
      next: () => this.load(),
      error: e => { this.error = mensagemErro(e, 'Erro ao excluir a BOM.'); }
    });
  }
}
