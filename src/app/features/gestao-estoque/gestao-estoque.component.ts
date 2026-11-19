import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import { Armazem, ArmazemCreate, EstoqueProduto, EstoqueEmergencia, Produto } from '../../core/models';

@Component({
  selector: 'app-gestao-estoque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestao-estoque.component.html',
  styleUrl: './gestao-estoque.component.css'
})
export class GestaoEstoqueComponent implements OnInit {
  armazens: Armazem[] = [];
  produtos: Produto[] = [];
  emergencias: EstoqueEmergencia[] = [];

  loading = false;
  error = '';
  sucesso = '';

  // Cadastro de armazém
  editandoArmazem: Armazem | null = null;
  formArmazem: ArmazemCreate = { nome: '', endereco: '', responsavel: '', ativo: true };

  // Quantidade de emergência
  produtoId = '';
  armazemId = '';
  quantidadeEmergencia: number | null = null;
  editandoQuantidade: boolean | null = null;

  // Filtros e paginação da posição de estoque
  filtroPosicao = '';
  armazemFiltro = '';
  apenasEmergencia = false;
  apenasAtivos = false;
  pagina = 1;
  tamanho = 10;
  totalPaginados = 0;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadTudo();
  }

  loadTudo() {
    this.loadArmazens();
    this.loadEmergencias();
    this.loadProdutos();
    this.loadPosicao();
  }

  private loadArmazens() {
    this.api.getArmazens().subscribe({
      next: d => this.armazens = d,
      error: () => {}
    });
  }

  private loadProdutos() {
    this.api.getProdutos().subscribe({
      next: d => this.produtos = d,
      error: () => this.produtos = []
    });
  }

  private loadEmergencias() {
    this.api.getEstoqueEmergencia(this.armazemFiltro || null).subscribe({
      next: d => this.emergencias = d,
      error: () => this.emergencias = []
    });
  }

  // ---------- Posição de estoque (consulta paginada) ----------
  posicao: EstoqueProduto[] = [];
  private loadPosicao() {
    this.api.consultarEstoque({
      termo: this.filtroPosicao || undefined,
      armazemId: this.armazemFiltro || null,
      emergencia: this.apenasEmergencia || undefined,
      ativos: this.apenasAtivos || undefined,
      pagina: this.pagina,
      tamanho: this.tamanho
    }).subscribe({
      next: d => { this.posicao = d.itens; this.totalPaginados = d.totalItens; this.pageInfo = d; },
      error: () => {}
    });
  }

  pageInfo: any = null;
  get totalPaginas(): number { return this.pageInfo?.totalPaginas ?? 1; }
  get temAnterior(): boolean { return this.pageInfo?.temAnterior ?? false; }
  get temProxima(): boolean { return this.pageInfo?.temProxima ?? false; }

  onFiltroPosicao() { this.pagina = 1; this.loadPosicao(); this.loadEmergencias(); }
  selecionarArmazem() { this.pagina = 1; this.loadPosicao(); this.loadEmergencias(); }
  irPagina(p: number) {
    if (p < 1 || p > this.totalPaginas) return;
    this.pagina = p;
    this.loadPosicao();
  }

  // ---------- Cadastro de armazém ----------
  novoArmazem() {
    this.editandoArmazem = null;
    this.formArmazem = { nome: '', endereco: '', responsavel: '', ativo: true };
    this.error = ''; this.sucesso = '';
  }

  editarArmazem(a: Armazem) {
    this.editandoArmazem = a;
    this.formArmazem = { nome: a.nome, endereco: a.endereco || '', responsavel: a.responsavel || '', ativo: a.ativo };
    this.error = ''; this.sucesso = '';
  }

  salvarArmazem() {
    this.error = ''; this.sucesso = '';
    if (!this.formArmazem.nome || !this.formArmazem.nome.trim()) { this.error = 'Informe o nome do armazém/local.'; return; }

    if (this.editandoArmazem) {
      this.api.updateArmazem(this.editandoArmazem.id, this.formArmazem).subscribe({
        next: () => { this.sucesso = 'Armazém atualizado.'; this.editandoArmazem = null; this.novoArmazem(); this.loadArmazens(); },
        error: e => this.error = mensagemErro(e, 'Erro ao atualizar armazém.')
      });
    } else {
      this.api.createArmazem(this.formArmazem).subscribe({
        next: () => { this.sucesso = 'Armazém cadastrado.'; this.novoArmazem(); this.loadArmazens(); },
        error: e => this.error = mensagemErro(e, 'Erro ao cadastrar armazém.')
      });
    }
  }

  excluirArmazem(a: Armazem) {
    if (!confirm(`Excluir o armazém/local "${a.nome}"?`)) return;
    this.error = ''; this.sucesso = '';
    this.api.deleteArmazem(a.id).subscribe({
      next: () => { this.sucesso = 'Armazém excluído.'; this.loadArmazens(); },
      error: e => this.error = mensagemErro(e, 'Erro ao excluir armazém (pode possuir saldo de estoque).')
    });
  }

  alternarAtivoArmazem(a: Armazem) {
    const novo = !a.ativo;
    this.api.updateArmazem(a.id, { nome: a.nome, endereco: a.endereco || '', responsavel: a.responsavel || '', ativo: novo }).subscribe({
      next: () => a.ativo = novo,
      error: e => this.error = mensagemErro(e, 'Erro ao alternar status do armazém.')
    });
  }

  // ---------- Quantidade de emergência ----------
  get produtosElegiveis(): Produto[] {
    // Só materiais/produtos não-kit podem ter emergência própria
    return this.produtos.filter(p => p.tipo !== 4);
  }

  definirEmergencia() {
    this.error = ''; this.sucesso = '';
    if (!this.produtoId || !this.armazemId) { this.error = 'Selecione o material e o armazém.'; return; }
    if (this.quantidadeEmergencia === null || this.quantidadeEmergencia === undefined || this.quantidadeEmergencia < 0) {
      this.error = 'Informe a quantidade de emergência (0 ou mais).';
      return;
    }
    this.api.definirEmergencia({
      produtoId: this.produtoId,
      armazemId: this.armazemId,
      quantidadeEmergencia: Number(this.quantidadeEmergencia)
    }).subscribe({
      next: () => {
        this.sucesso = 'Quantidade de emergência definida.';
        this.quantidadeEmergencia = null;
        this.loadEmergencias();
        this.loadPosicao();
        this.loadArmazens();
      },
      error: e => this.error = mensagemErro(e, 'Erro ao definir quantidade de emergência.')
    });
  }

  produtoDescricao(id: string): string {
    const p = this.produtos.find(x => x.id === id);
    return p ? `${p.codigo} - ${p.descricao}` : id;
  }

  armazemNome(id: string): string {
    return this.armazens.find(a => a.id === id)?.nome ?? id;
  }
}
