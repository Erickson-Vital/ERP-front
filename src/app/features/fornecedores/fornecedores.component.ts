import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Fornecedor, FornecedorCreate } from '../../core/models';
import { filtrarPor, paginar, totalPaginas } from '../../core/paginacao';

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
  editando: Fornecedor | null = null;
  form: FornecedorCreate = this.blankForm();

  // Filtro e paginação
  filtro = '';
  pagina = 1;
  tamanho = 10;
  get filtrados(): Fornecedor[] {
    return filtrarPor(this.fornecedores, this.filtro, [f => f.nome, f => f.cpfCnpj, f => f.codigoFornecedor, f => f.emailPrincipal, f => f.categoria]);
  }
  get paginados(): Fornecedor[] { return paginar(this.filtrados, this.pagina, this.tamanho); }
  get totalPaginas(): number { return totalPaginas(this.filtrados.length, this.tamanho); }

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  onFiltro() { this.pagina = 1; }
  irPagina(p: number) { if (p >= 1 && p <= this.totalPaginas) this.pagina = p; }

  load() {
    this.loading = true;
    this.api.getFornecedores().subscribe({
      next: (d) => { this.fornecedores = d; this.loading = false; },
      error: () => { this.error = 'Erro ao carregar fornecedores.'; this.loading = false; }
    });
  }

  blankForm(): FornecedorCreate {
    return { nome: '', cpfCnpj: '', codigoFornecedor: '', isentoIE: false };
  }

  novo() { this.editando = null; this.form = this.blankForm(); this.error = ''; }

  editar(f: Fornecedor) {
    this.editando = f;
    this.error = '';
    this.form = {
      nome: f.nome, cpfCnpj: f.cpfCnpj, inscricaoEstadual: f.inscricaoEstadual,
      emailPrincipal: f.emailPrincipal, telefonePrincipal: f.telefonePrincipal,
      isentoIE: f.isentoIE, codigoFornecedor: f.codigoFornecedor,
      prazoEntregaPadrao: f.prazoEntregaPadrao, categoria: f.categoria
    };
  }

  salvar() {
    this.error = '';
    if (this.editando) {
      this.api.updateFornecedor(this.editando.id, this.form).subscribe({
        next: () => { this.editando = null; this.load(); },
        error: () => { this.error = 'Erro ao salvar fornecedor.'; }
      });
    } else {
      this.api.createFornecedor(this.form).subscribe({
        next: () => { this.editando = null; this.load(); },
        error: () => { this.error = 'Erro ao salvar fornecedor.'; }
      });
    }
  }

  excluir(f: Fornecedor) {
    if (!confirm(`Excluir fornecedor "${f.nome}"?`)) return;
    this.api.deleteFornecedor(f.id).subscribe({
      next: () => this.load(),
      error: () => { this.error = 'Erro ao excluir.'; }
    });
  }
}
