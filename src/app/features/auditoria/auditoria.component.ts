import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import { Auditoria } from '../../core/models';
import { MENUS, menuPorCodigo } from '../../core/menus';
import { paginar, totalPaginas } from '../../core/paginacao';

@Component({
    selector: 'app-auditoria',
    imports: [CommonModule, FormsModule],
    templateUrl: './auditoria.component.html',
    styleUrl: './auditoria.component.css'
})
export class AuditoriaComponent implements OnInit {
  registros: Auditoria[] = [];
  filtrados: Auditoria[] = [];
  loading = false;
  error = '';
  filtroMenu = '';
  filtroTexto = '';
  filtroDataInicio = '';
  filtroDataFim = '';
  menus = MENUS;

  // Paginação
  pagina = 1;
  tamanho = 15;
  get paginados(): Auditoria[] { return paginar(this.filtrados, this.pagina, this.tamanho); }
  get totalPaginas(): number { return totalPaginas(this.filtrados.length, this.tamanho); }

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    this.api.getAuditoria(500, this.filtroMenu || undefined).subscribe({
      next: (d) => {
        this.registros = d;
        this.aplicarFiltro();
        this.loading = false;
      },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao carregar auditoria.'); this.loading = false; }
    });
  }

  aplicarFiltro() {
    const t = (this.filtroTexto || '').toLowerCase();

    // Limites de data (inputs type="date" entregam 'YYYY-MM-DD')
    const inicio = this.filtroDataInicio ? this.inicioDoDia(this.filtroDataInicio) : null;
    const fim = this.filtroDataFim ? this.fimDoDia(this.filtroDataFim) : null;

    this.filtrados = this.registros.filter(r => {
      if (this.filtroMenu && r.menu !== this.filtroMenu) return false;

      if (inicio || fim) {
        const d = new Date(r.data).getTime();
        if (isNaN(d)) return false;
        if (inicio !== null && d < inicio) return false;
        if (fim !== null && d > fim) return false;
      }

      if (!t) return true;
      return `${r.usuarioNome} ${r.usuarioLogin} ${r.acao} ${r.detalhes} ${r.entidade}`.toLowerCase().includes(t);
    });
    this.pagina = 1;
  }

  /** Início do dia (00:00:00.000) a partir de 'YYYY-MM-DD'. */
  private inicioDoDia(iso: string): number {
    const [a, m, d] = iso.split('-').map(Number);
    return new Date(a, (m || 1) - 1, d || 1, 0, 0, 0, 0).getTime();
  }

  /** Fim do dia (23:59:59.999) a partir de 'YYYY-MM-DD'. */
  private fimDoDia(iso: string): number {
    const [a, m, d] = iso.split('-').map(Number);
    return new Date(a, (m || 1) - 1, d || 1, 23, 59, 59, 999).getTime();
  }

  limparDatas() {
    this.filtroDataInicio = '';
    this.filtroDataFim = '';
    this.aplicarFiltro();
  }

  onFiltro() { this.aplicarFiltro(); }
  onFiltroMenu() { this.pagina = 1; this.load(); }
  irPagina(p: number) { if (p >= 1 && p <= this.totalPaginas) this.pagina = p; }

  menuLabel(codigo?: string): string {
    if (!codigo) return '—';
    return menuPorCodigo(codigo)?.label ?? codigo;
  }

  acaoClass(acao: string): string {
    const a = (acao || '').toLowerCase();
    if (a.includes('remove') || a.includes('cancel') || a.includes('exclu')) return 'badge-red';
    if (a.includes('criou') || a.includes('entrou')) return 'badge-green';
    if (a.includes('alterou') || a.includes('atualiz')) return 'badge-orange';
    if (a.includes('baixou') || a.includes('faturou') || a.includes('recebeu')) return 'badge-blue';
    return 'badge-gray';
  }
}
