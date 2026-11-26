import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import { Recurso, OpcaoCategoria } from '../../core/models';
import { paginar, totalPaginas, normalizar } from '../../core/paginacao';

@Component({
  selector: 'app-recursos',
  imports: [CommonModule, FormsModule],
  templateUrl: './recursos.component.html',
  styleUrl: './recursos.component.css'
})
export class RecursosComponent implements OnInit {
  recursos: Recurso[] = [];
  tiposRecurso: OpcaoCategoria[] = [];
  loading = false;
  error = '';

  filtroTexto = '';
  filtroTipo = '';
  filtroStatus: '' | '0' | '1' = '';

  filtroAplicadoTexto = '';
  filtroAplicadoTipo = '';
  filtroAplicadoStatus: '' | '0' | '1' = '';

  pagina = 1;
  tamanho = 10;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.load();
    this.api.getOpcoesCategoria('tipos-recurso').subscribe({
      next: d => { this.tiposRecurso = d; }
    });
  }

  load() {
    this.loading = true;
    this.api.getRecursos().subscribe({
      next: d => {
        this.recursos = d;
        this.loading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar os recursos.';
        this.loading = false;
      }
    });
  }

  get filtrados(): Recurso[] {
    const termo = normalizar(this.filtroAplicadoTexto);
    const tipo = this.filtroAplicadoTipo;
    const st = this.filtroAplicadoStatus;

    return this.recursos.filter(r => {
      if (termo) {
        const achou =
          normalizar(r.codigo).includes(termo) ||
          normalizar(r.nome).includes(termo) ||
          normalizar(r.tipoRecursoNome).includes(termo);
        if (!achou) return false;
      }
      if (tipo && r.tipoRecursoId !== tipo) return false;
      if (st === '0' && !r.ativo) return false;
      if (st === '1' && r.ativo) return false;
      return true;
    });
  }

  get paginados(): Recurso[] { return paginar(this.filtrados, this.pagina, this.tamanho); }
  get totalPaginas(): number { return totalPaginas(this.filtrados.length, this.tamanho); }

  aplicarFiltro() {
    this.filtroAplicadoTexto = this.filtroTexto;
    this.filtroAplicadoTipo = this.filtroTipo;
    this.filtroAplicadoStatus = this.filtroStatus;
    this.pagina = 1;
  }

  limparFiltro() {
    this.filtroTexto = '';
    this.filtroTipo = '';
    this.filtroStatus = '';
    this.filtroAplicadoTexto = '';
    this.filtroAplicadoTipo = '';
    this.filtroAplicadoStatus = '';
    this.pagina = 1;
  }

  onTamanhoChange() { this.pagina = 1; }
  irPagina(p: number) { if (p >= 1 && p <= this.totalPaginas) this.pagina = p; }

  novoRecurso() { this.router.navigate(['/roteiro/recursos/novo']); }
  editar(r: Recurso) { this.router.navigate(['/roteiro/recursos', r.id, 'editar']); }

  alternarAtivo(r: Recurso) {
    this.error = '';
    const novo = !r.ativo;
    this.api.alterarStatusRecurso(r.id, novo).subscribe({
      next: () => {
        r.ativo = novo;
        this.recursos = [...this.recursos];
      },
      error: e => { this.error = mensagemErro(e, 'Erro ao alterar o status do recurso.'); }
    });
  }

  excluir(r: Recurso) {
    if (!confirm(`Excluir o recurso "${r.codigo} - ${r.nome}"?`)) return;
    this.api.deleteRecurso(r.id).subscribe({
      next: () => this.load(),
      error: e => { this.error = mensagemErro(e, 'Erro ao excluir o recurso.'); }
    });
  }
}
