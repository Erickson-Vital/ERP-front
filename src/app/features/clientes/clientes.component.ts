import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Cliente } from '../../core/models';
import { paginar, totalPaginas } from '../../core/paginacao';

@Component({
  selector: 'app-clientes',
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  loading = false;
  error = '';

  // Campos digitados no 1º card de filtros
  filtroTexto = '';
  filtroCategoria = '';
  filtroStatus: '' | '0' | '1' = '';

  // Filtros efetivamente aplicados ao clicar em "Filtrar"
  filtroAplicadoTexto = '';
  filtroAplicadoCategoria = '';
  filtroAplicadoStatus: '' | '0' | '1' = '';

  pagina = 1;
  tamanho = 10;

  categoriasBanco: string[] = [];

  get categoriasDisponiveis(): string[] {
    const doBanco = this.clientes.map(c => c.categoria).filter((c): c is string => !!c);
    return Array.from(new Set([...this.categoriasBanco, ...doBanco]));
  }

  get filtrados(): Cliente[] {
    const termo = (this.filtroAplicadoTexto || '').trim().toLowerCase();
    const cat = (this.filtroAplicadoCategoria || '').trim().toLowerCase();
    const st = this.filtroAplicadoStatus;

    return this.clientes.filter(c => {
      if (termo) {
        const matchTexto =
          (c.nome || '').toLowerCase().includes(termo) ||
          (c.cpfCnpj || '').toLowerCase().includes(termo) ||
          (c.codigoCliente || '').toLowerCase().includes(termo) ||
          (c.emailPrincipal || '').toLowerCase().includes(termo) ||
          (c.telefonePrincipal || '').toLowerCase().includes(termo) ||
          (c.celular || '').toLowerCase().includes(termo) ||
          (c.cidade || '').toLowerCase().includes(termo);
        if (!matchTexto) return false;
      }

      if (cat && (c.categoria || '').toLowerCase() !== cat) {
        return false;
      }

      if (st === '0' && !this.ehAtivo(c)) return false;
      if (st === '1' && this.ehAtivo(c)) return false;

      return true;
    });
  }

  get paginados(): Cliente[] { return paginar(this.filtrados, this.pagina, this.tamanho); }
  get totalPaginas(): number { return totalPaginas(this.filtrados.length, this.tamanho); }

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.load();
    this.api.getOpcoesCategoria('clientes').subscribe({
      next: (d) => { this.categoriasBanco = d.map(x => x.nome); }
    });
  }

  ehAtivo(c: Cliente): boolean {
    if (c.desativado !== undefined && c.desativado !== null) {
      return c.desativado === 0;
    }
    return c.status !== 2;
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
    this.api.getClientes().subscribe({
      next: (d) => { this.clientes = d; this.loading = false; },
      error: () => { this.error = 'Erro ao carregar clientes.'; this.loading = false; }
    });
  }

  novoCliente() {
    this.router.navigate(['/clientes/novo']);
  }

  editar(c: Cliente) {
    this.router.navigate(['/clientes', c.id, 'editar']);
  }

  alternarAtivo(c: Cliente) {
    this.error = '';
    const novoDesativado = this.ehAtivo(c) ? 1 : 0;
    this.api.alterarStatusCliente(c.id, novoDesativado).subscribe({
      next: (atualizado) => {
        c.desativado = atualizado?.desativado ?? novoDesativado;
        c.status = atualizado?.status ?? (novoDesativado === 1 ? 2 : 1);
        this.clientes = [...this.clientes];
      },
      error: () => {
        this.error = 'Erro ao alterar o status do cliente.';
      }
    });
  }

  excluir(c: Cliente) {
    if (!confirm(`Excluir cliente "${c.nome}"?`)) return;
    this.api.deleteCliente(c.id).subscribe({
      next: () => this.load(),
      error: () => { this.error = 'Erro ao excluir.'; }
    });
  }
}
