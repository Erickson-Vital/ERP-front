import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Fornecedor } from '../../core/models';
import { paginar, totalPaginas } from '../../core/paginacao';

@Component({
  selector: 'app-fornecedores',
  imports: [CommonModule, FormsModule],
  templateUrl: './fornecedores.component.html',
  styleUrl: './fornecedores.component.css'
})
export class FornecedoresComponent implements OnInit {
  fornecedores: Fornecedor[] = [];
  loading = false;
  error = '';

  // Campos digitados no 1º card de filtros
  filtroTexto = '';
  filtroCategoria = '';
  filtroStatus: '' | '0' | '1' = '';

  // Filtros efetivamente aplicados ao clicar em "Aplicar Filtro"
  filtroAplicadoTexto = '';
  filtroAplicadoCategoria = '';
  filtroAplicadoStatus: '' | '0' | '1' = '';

  pagina = 1;
  tamanho = 10;

  categoriasBanco: string[] = [];

  get categoriasDisponiveis(): string[] {
    const doBanco = this.fornecedores.map(f => f.categoria).filter((c): c is string => !!c);
    return Array.from(new Set([...this.categoriasBanco, ...doBanco]));
  }

  get filtrados(): Fornecedor[] {
    const termo = (this.filtroAplicadoTexto || '').trim().toLowerCase();
    const cat = (this.filtroAplicadoCategoria || '').trim().toLowerCase();
    const st = this.filtroAplicadoStatus;

    return this.fornecedores.filter(f => {
      if (termo) {
        const matchTexto =
          (f.nome || '').toLowerCase().includes(termo) ||
          (f.cpfCnpj || '').toLowerCase().includes(termo) ||
          (f.codigoFornecedor || '').toLowerCase().includes(termo) ||
          (f.emailPrincipal || '').toLowerCase().includes(termo) ||
          (f.telefonePrincipal || '').toLowerCase().includes(termo) ||
          (f.celular || '').toLowerCase().includes(termo) ||
          (f.cidade || '').toLowerCase().includes(termo);
        if (!matchTexto) return false;
      }

      if (cat && (f.categoria || '').toLowerCase() !== cat) {
        return false;
      }

      if (st === '0' && !this.ehAtivo(f)) return false;
      if (st === '1' && this.ehAtivo(f)) return false;

      return true;
    });
  }

  get paginados(): Fornecedor[] { return paginar(this.filtrados, this.pagina, this.tamanho); }
  get totalPaginas(): number { return totalPaginas(this.filtrados.length, this.tamanho); }

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.load();
    this.api.getOpcoesCategoria('fornecedores').subscribe({
      next: (d) => { this.categoriasBanco = d.map(x => x.nome); }
    });
  }

  ehAtivo(f: Fornecedor): boolean {
    if (f.desativado !== undefined && f.desativado !== null) {
      return f.desativado === 0;
    }
    return f.status !== 2;
  }

  aplicarFiltro() {
    this.filtroAplicadoTexto = this.filtroTexto;
    this.filtroAplicadoCategoria = this.filtroCategoria;
    this.filtroAplicadoStatus = this.filtroStatus;
    this.pagina = 1;
  }

  limparFiltro() {
    this.filtroTexto = '';
    this.filtroCategoria = '';
    this.filtroStatus = '';
    this.filtroAplicadoTexto = '';
    this.filtroAplicadoCategoria = '';
    this.filtroAplicadoStatus = '';
    this.pagina = 1;
  }

  onTamanhoChange() {
    this.pagina = 1;
  }

  irPagina(p: number) { if (p >= 1 && p <= this.totalPaginas) this.pagina = p; }

  load() {
    this.loading = true;
    this.api.getFornecedores().subscribe({
      next: (d) => { this.fornecedores = d; this.loading = false; },
      error: () => { this.error = 'Erro ao carregar fornecedores.'; this.loading = false; }
    });
  }

  novoFornecedor() {
    this.router.navigate(['/fornecedores/novo']);
  }

  editar(f: Fornecedor) {
    this.router.navigate(['/fornecedores', f.id, 'editar']);
  }

  alternarAtivo(f: Fornecedor) {
    this.error = '';
    const novoDesativado = this.ehAtivo(f) ? 1 : 0;
    this.api.alterarStatusFornecedor(f.id, novoDesativado).subscribe({
      next: (atualizado) => {
        f.desativado = atualizado?.desativado ?? novoDesativado;
        f.status = atualizado?.status ?? (novoDesativado === 1 ? 2 : 1);
        this.fornecedores = [...this.fornecedores];
      },
      error: () => {
        this.error = 'Erro ao alterar o status do fornecedor.';
      }
    });
  }

  excluir(f: Fornecedor) {
    if (!confirm(`Excluir fornecedor "${f.nome}"?`)) return;
    this.api.deleteFornecedor(f.id).subscribe({
      next: () => this.load(),
      error: () => { this.error = 'Erro ao excluir.'; }
    });
  }
}
