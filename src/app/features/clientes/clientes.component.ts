import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Cliente, ClienteCreate } from '../../core/models';
import { filtrarPor, paginar, totalPaginas } from '../../core/paginacao';

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
  editando: Cliente | null = null;
  form: ClienteCreate = this.blankForm();

  // Filtro e paginação
  filtro = '';
  pagina = 1;
  tamanho = 10;
  get filtrados(): Cliente[] {
    return filtrarPor(this.clientes, this.filtro, [c => c.nome, c => c.cpfCnpj, c => c.codigoCliente, c => c.emailPrincipal, c => c.categoria]);
  }
  get paginados(): Cliente[] { return paginar(this.filtrados, this.pagina, this.tamanho); }
  get totalPaginas(): number { return totalPaginas(this.filtrados.length, this.tamanho); }

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  onFiltro() { this.pagina = 1; }
  irPagina(p: number) { if (p >= 1 && p <= this.totalPaginas) this.pagina = p; }

  load() {
    this.loading = true;
    this.api.getClientes().subscribe({
      next: (d) => { this.clientes = d; this.loading = false; },
      error: (e) => { this.error = 'Erro ao carregar clientes.'; this.loading = false; }
    });
  }

  blankForm(): ClienteCreate {
    return { nome: '', cpfCnpj: '', codigoCliente: '', limiteCredito: 0, isentoIE: false };
  }

  novo() {
    this.editando = null;
    this.form = this.blankForm();
    this.error = '';
  }

  editar(c: Cliente) {
    this.editando = c;
    this.error = '';
    this.form = {
      nome: c.nome, cpfCnpj: c.cpfCnpj, inscricaoEstadual: c.inscricaoEstadual,
      emailPrincipal: c.emailPrincipal, telefonePrincipal: c.telefonePrincipal,
      isentoIE: c.isentoIE, codigoCliente: c.codigoCliente,
      limiteCredito: c.limiteCredito, categoria: c.categoria
    };
  }

  salvar() {
    this.error = '';
    if (this.editando) {
      this.api.updateCliente(this.editando.id, this.form).subscribe({
        next: () => { this.load(); this.editando = null; },
        error: () => { this.error = 'Erro ao salvar cliente.'; }
      });
    } else {
      this.api.createCliente(this.form).subscribe({
        next: () => { this.load(); this.editando = null; },
        error: () => { this.error = 'Erro ao salvar cliente.'; }
      });
    }
  }

  excluir(c: Cliente) {
    if (!confirm(`Excluir cliente "${c.nome}"?`)) return;
    this.api.deleteCliente(c.id).subscribe({
      next: () => this.load(),
      error: () => { this.error = 'Erro ao excluir.'; }
    });
  }
}
