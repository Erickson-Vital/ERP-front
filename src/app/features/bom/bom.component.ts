import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import { BomResumo, KitOpcao, ComposicaoKit, Produto, Processo } from '../../core/models';

@Component({
    selector: 'app-bom',
    imports: [CommonModule, FormsModule],
    templateUrl: './bom.component.html',
    styleUrl: './bom.component.css'
})
export class BomComponent implements OnInit {
  bom: BomResumo[] = [];
  kits: KitOpcao[] = [];
  produtos: Produto[] = [];
  processos: Processo[] = [];
  loading = false;
  error = '';

  // Seleção
  kitSelecionadoId = '';
  kitAtual: KitOpcao | null = null;
  composicao: ComposicaoKit | null = null;
  carregandoComposicao = false;
  erroComposicao = '';
  sucessoComposicao = '';

  // Formulários de adição
  novoComponenteId = '';
  novaQtdComponente: number | null = 1;
  novoProcessoId = '';
  novasHoras: number | null = 1;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadBom();
    this.api.getKits().subscribe(d => this.kits = d);
    this.api.getProdutos().subscribe({
      next: d => this.produtos = d,
      error: () => this.produtos = []
    });
    this.api.getProcessos().subscribe({
      next: d => this.processos = d,
      error: () => this.processos = []
    });
  }

  loadBom() {
    this.loading = true;
    this.api.getBom().subscribe({
      next: d => { this.bom = d; this.loading = false; },
      error: () => { this.error = 'Erro ao carregar os kits.'; this.loading = false; }
    });
  }

  selecionarKit() {
    this.error = '';
    const kit = this.kits.find(k => k.id === this.kitSelecionadoId);
    this.kitAtual = kit ?? null;
    this.composicao = null;
    this.erroComposicao = '';
    this.sucessoComposicao = '';
    this.novoComponenteId = '';
    this.novoProcessoId = '';
    this.novaQtdComponente = 1;
    this.novasHoras = 1;
    if (kit) this.carregarComposicao(kit.id);
  }

  carregarComposicao(produtoId: string) {
    this.carregandoComposicao = true;
    this.api.getBomDetalhe(produtoId).subscribe({
      next: c => { this.composicao = c; this.carregandoComposicao = false; },
      error: e => { this.erroComposicao = mensagemErro(e, 'Erro ao carregar a estrutura.'); this.carregandoComposicao = false; }
    });
  }

  /** Componentes elegíveis: qualquer produto não-kit e diferente do kit atual. */
  get componentesDisponiveis(): Produto[] {
    if (!this.kitAtual) return [];
    return this.produtos.filter(p => p.id !== this.kitAtual!.id && p.tipo !== 4);
  }

  // ---------- Componentes ----------
  adicionarComponente() {
    if (!this.kitAtual) return;
    this.erroComposicao = ''; this.sucessoComposicao = '';
    if (!this.novoComponenteId) { this.erroComposicao = 'Selecione o componente.'; return; }
    if (!this.novaQtdComponente || this.novaQtdComponente <= 0) { this.erroComposicao = 'Quantidade deve ser maior que zero.'; return; }

    this.api.addComponente(this.kitAtual.id, {
      componenteId: this.novoComponenteId,
      quantidade: Number(this.novaQtdComponente)
    }).subscribe({
      next: () => {
        this.sucessoComposicao = 'Componente adicionado.';
        this.novoComponenteId = ''; this.novaQtdComponente = 1;
        this.recarregar();
      },
      error: e => this.erroComposicao = mensagemErro(e, 'Erro ao adicionar componente.')
    });
  }

  alterarQtdComponente(comp: any) {
    if (!this.kitAtual || !comp.quantidade || comp.quantidade <= 0) return;
    this.api.updateComponente(this.kitAtual.id, comp.id, {
      componenteId: comp.componenteId, quantidade: Number(comp.quantidade)
    }).subscribe({
      next: () => { this.sucessoComposicao = 'Quantidade atualizada.'; this.recarregar(); },
      error: e => this.erroComposicao = mensagemErro(e, 'Erro ao atualizar quantidade.')
    });
  }

  removerComponente(comp: any) {
    if (!this.kitAtual) return;
    if (!confirm(`Remover "${comp.componenteDescricao}" da composição?`)) return;
    this.api.removeComponente(this.kitAtual.id, comp.id).subscribe({
      next: () => { this.sucessoComposicao = 'Componente removido.'; this.recarregar(); },
      error: e => this.erroComposicao = mensagemErro(e, 'Erro ao remover componente.')
    });
  }

  // ---------- Processos ----------
  adicionarProcesso() {
    if (!this.kitAtual) return;
    this.erroComposicao = ''; this.sucessoComposicao = '';
    if (!this.novoProcessoId) { this.erroComposicao = 'Selecione o processo.'; return; }
    if (!this.novasHoras || this.novasHoras <= 0) { this.erroComposicao = 'Horas devem ser maiores que zero.'; return; }

    this.api.addProcessoKit(this.kitAtual.id, {
      processoId: this.novoProcessoId,
      horas: Number(this.novasHoras)
    }).subscribe({
      next: () => {
        this.sucessoComposicao = 'Processo adicionado.';
        this.novoProcessoId = ''; this.novasHoras = 1;
        this.recarregar();
      },
      error: e => this.erroComposicao = mensagemErro(e, 'Erro ao adicionar processo.')
    });
  }

  alterarHoras(proc: any) {
    if (!this.kitAtual || !proc.horas || proc.horas <= 0) return;
    this.api.updateProcessoKit(this.kitAtual.id, proc.id, {
      processoId: proc.processoId, horas: Number(proc.horas)
    }).subscribe({
      next: () => { this.sucessoComposicao = 'Horas atualizadas.'; this.recarregar(); },
      error: e => this.erroComposicao = mensagemErro(e, 'Erro ao atualizar horas.')
    });
  }

  removerProcesso(proc: any) {
    if (!this.kitAtual) return;
    if (!confirm(`Remover o processo "${proc.processoNome}" do kit?`)) return;
    this.api.removeProcessoKit(this.kitAtual.id, proc.id).subscribe({
      next: () => { this.sucessoComposicao = 'Processo removido.'; this.recarregar(); },
      error: e => this.erroComposicao = mensagemErro(e, 'Erro ao remover processo.')
    });
  }

  private recarregar() {
    if (this.kitAtual) this.carregarComposicao(this.kitAtual.id);
    this.loadBom();
  }
}
