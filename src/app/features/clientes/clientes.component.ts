import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Cliente } from '../../core/models';
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

  // Filtro e paginação
  filtro = '';
  pagina = 1;
  tamanho = 10;

  get filtrados(): Cliente[] {
    return filtrarPor(this.clientes, this.filtro, [
      c => c.nome,
      c => c.cpfCnpj,
      c => c.codigoCliente,
      c => c.emailPrincipal,
      c => c.categoria,
      c => c.cidade
    ]);
  }
  get paginados(): Cliente[] { return paginar(this.filtrados, this.pagina, this.tamanho); }
  get totalPaginas(): number { return totalPaginas(this.filtrados.length, this.tamanho); }

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() { this.load(); }

  onFiltro() { this.pagina = 1; }
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

  excluir(c: Cliente) {
    if (!confirm(`Excluir cliente "${c.nome}"?`)) return;
    this.api.deleteCliente(c.id).subscribe({
      next: () => this.load(),
      error: () => { this.error = 'Erro ao excluir.'; }
    });
  }
}
