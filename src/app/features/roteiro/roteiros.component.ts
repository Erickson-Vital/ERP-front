import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import { Roteiro, OpcaoCategoria } from '../../core/models';
import { paginar, totalPaginas, normalizar } from '../../core/paginacao';

@Component({
  selector: 'app-roteiros',
  imports: [CommonModule, FormsModule],
  templateUrl: './roteiros.component.html',
  styleUrl: './roteiros.component.css'
})
export class RoteirosComponent implements OnInit {
  roteiros: Roteiro[] = [];
  unidadesRoteiro: OpcaoCategoria[] = [];
  loading = false;
  error = '';

  filtroTexto = '';
  filtroUnidade = '';
  filtroStatus: '' | '0' | '1' = '';

  filtroAplicadoTexto = '';
  filtroAplicadoUnidade = '';
  filtroAplicadoStatus: '' | '0' | '1' = '';

  pagina = 1;
  tamanho = 10;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.load();
    this.api.getOpcoesCategoria('unidades-roteiro').subscribe({
      next: d => { this.unidadesRoteiro = d; }
    });
  }

  load() {
    this.loading = true;
    this.api.getRoteiros().subscribe({
      next: d => {
        this.roteiros = d;
        this.loading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar os roteiros cadastrados.';
        this.loading = false;
      }
    });
  }

  get filtrados(): Roteiro[] {
    const termo = normalizar(this.filtroAplicadoTexto);
    const unid = this.filtroAplicadoUnidade;
    const st = this.filtroAplicadoStatus;

    return this.roteiros.filter(r => {
      if (termo) {
        const achouCabecalho =
          normalizar(r.produtoCodigo).includes(termo) ||
          normalizar(r.produtoDescricao).includes(termo) ||
          normalizar(r.unidadeMedidaRoteiroNome).includes(termo);
        const achouRecurso = (r.itens || []).some(
          i => normalizar(i.recursoCodigo).includes(termo) || normalizar(i.recursoNome).includes(termo)
        );
        if (!achouCabecalho && !achouRecurso) return false;
      }
      if (unid && r.unidadeMedidaRoteiroId !== unid) return false;
      if (st === '0' && !r.ativo) return false;
      if (st === '1' && r.ativo) return false;
      return true;
    });
  }

  get paginados(): Roteiro[] { return paginar(this.filtrados, this.pagina, this.tamanho); }
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

  novoRoteiro() { this.router.navigate(['/roteiro/novo']); }
  irParaRecursos() { this.router.navigate(['/roteiro/recursos']); }
  editar(r: Roteiro) { this.router.navigate(['/roteiro', r.id, 'editar']); }

  alternarAtivo(r: Roteiro) {
    this.error = '';
    const novo = !r.ativo;
    this.api.alterarStatusRoteiro(r.id, novo).subscribe({
      next: () => {
        r.ativo = novo;
        this.roteiros = [...this.roteiros];
      },
      error: e => { this.error = mensagemErro(e, 'Erro ao alterar o status do roteiro.'); }
    });
  }

  excluir(r: Roteiro) {
    if (!confirm(`Excluir o Roteiro do produto "${r.produtoCodigo} - ${r.produtoDescricao}"?`)) return;
    this.api.deleteRoteiro(r.id).subscribe({
      next: () => this.load(),
      error: e => { this.error = mensagemErro(e, 'Erro ao excluir o roteiro.'); }
    });
  }
}
