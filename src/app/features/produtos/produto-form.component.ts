import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import {
  Produto,
  ProdutoCreate,
  ProdutoComposicaoItem,
  UnidadeMedida,
  FamiliaProduto,
  OpcaoCategoria
} from '../../core/models';

export type TipoListaProduto =
  | 'tipo'
  | 'unidade'
  | 'familia'
  | 'origemMercadoria'
  | 'unidadeTributavel'
  | 'unidadeVenda'
  | 'origemAbastecimento';

@Component({
  selector: 'app-produto-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './produto-form.component.html',
  styleUrl: './produto-form.component.css'
})
export class ProdutoFormComponent implements OnInit {
  abaAtiva: 'geral' | 'fiscal' | 'comercial' | 'producao' | 'composicao' = 'geral';
  produtoId: string | null = null;
  loading = false;
  salvando = false;
  error = '';
  sucesso = '';

  form: ProdutoCreate = this.blankForm();
  editando: Produto | null = null;

  // ===== 05. Aba Composição (Subprodutos / Insumos incluídos) =====
  itensComposicao: ProdutoComposicaoItem[] = [];
  todosProdutos: Produto[] = [];
  modalProdutosAberto = false;
  buscaProdutoTermo = '';
  selecionadosModal: Record<string, number> = {};
  quantidadesTempModal: Record<string, number> = {};

  // Listas dedicadas (tabelas)
  unidades: UnidadeMedida[] = [];          // UnidadesMedida (também usada em Unidade Tributável)
  familias: FamiliaProduto[] = [];
  tiposCadastro: OpcaoCategoria[] = [];    // TiposProdutoCadastro
  unidadesVendaList: OpcaoCategoria[] = [];          // UnidadesVenda
  origensAbastecimentoList: OpcaoCategoria[] = [];   // OrigensAbastecimento

  // Constantes de seleção
  origensMercadoria = [
    { valor: 0, label: 'Nacional (exceto as abas/incisos seguintes)' },
    { valor: 1, label: 'Estrangeira – Importação direta' },
    { valor: 2, label: 'Estrangeira – Adquirida no mercado interno' },
    { valor: 3, label: 'Nacional – mercadoria ou bem com conteúdo de importação superior a 40%' },
    { valor: 4, label: 'Nacional – produção conforme processo produtivo básico' },
    { valor: 5, label: 'Nacional – conteúdo de importação inferior ou igual a 40%' },
    { valor: 6, label: 'Estrangeira – importação direta sem similar nacional (lista Anexa)' },
    { valor: 7, label: 'Estrangeira – adquirida no mercado interno sem similar nacional' },
    { valor: 8, label: 'Nacional – conteúdo de importação superior a 70%' }
  ];

  tiposPadrao = [
    { valor: 1, label: 'Produto' },
    { valor: 2, label: 'Serviço' },
    { valor: 3, label: 'Matéria-prima' },
    { valor: 4, label: 'Kit (composto)' }
  ];

  // ===== Estado do Pop-up (Modal da Engrenagem) =====
  modalAberto = false;
  modalTipo: TipoListaProduto = 'tipo';
  modalTitulo = '';
  modalItens: string[] = [];
  modalObjs: OpcaoCategoria[] = [];
  novoItemTexto = '';
  editandoIndex: number | null = null;
  editandoTexto = '';

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.carregarListas();
    this.produtoId = this.route.snapshot.paramMap.get('id');
    if (this.produtoId) {
      this.carregarProduto(this.produtoId);
    }
  }

  /** Sincroniza o enum numérico `tipo` a partir do Tipo de Produto selecionado (tabela dedicada). */
  onTipoChange() {
    const tipo = this.tiposCadastro.find(t => t.id === this.form.tipoProdutoId);
    if (!tipo) { this.form.tipo = 1; return; }
    const padrao = this.tiposPadrao.find(t => t.label === tipo.nome);
    this.form.tipo = padrao?.valor ?? 1;
  }

  blankForm(): ProdutoCreate {
    return {
      codigo: '',
      codigoBarras: '',
      descricao: '',
      descricaoComplementar: '',
      tipo: 1,
      tipoProdutoId: null,
      ncm: '',
      cest: '',
      cfop: '',
      origemMercadoria: 0,
      unidadeTributavelId: null,
      precoVendaPadrao: 0,
      precoCustoMedio: 0,
      margem: 0,
      precoMinimo: 0,
      unidadeVendaId: null,
      origemAbastecimentoId: null,
      prazoFabricacaoDias: 0,
      rendimento: 0,
      percentualPerda: 0,
      permiteUsoEmBom: true,
      ativo: true,
      unidadeMedidaId: null,
      familiaProdutoId: null
    };
  }

  get produtoAtivo(): boolean { return this.form.ativo; }

  carregarListas() {
    this.api.getUnidadesMedida().subscribe({
      next: d => { this.unidades = d; }
    });
    this.api.getFamiliasProduto().subscribe({
      next: d => { this.familias = d; }
    });
    this.api.getOpcoesCategoria('tipos-produto').subscribe({
      next: d => { this.tiposCadastro = d; }
    });
    this.api.getOpcoesCategoria('unidades-venda').subscribe({
      next: d => { this.unidadesVendaList = d; }
    });
    this.api.getOpcoesCategoria('origens-abastecimento').subscribe({
      next: d => { this.origensAbastecimentoList = d; }
    });
    this.carregarTodosProdutos();
  }

  carregarTodosProdutos() {
    this.api.getProdutos().subscribe({
      next: d => {
        this.todosProdutos = d;
        for (const p of d) {
          if (this.quantidadesTempModal[p.id] === undefined) {
            this.quantidadesTempModal[p.id] = 1;
          }
        }
      }
    });
  }

  carregarProduto(id: string) {
    this.loading = true;
    this.api.getProduto(id).subscribe({
      next: (p) => {
        this.editando = p;
        this.form = {
          codigo: p.codigo,
          codigoBarras: p.codigoBarras ?? '',
          descricao: p.descricao,
          descricaoComplementar: p.descricaoComplementar ?? '',
          tipo: p.tipo,
          tipoProdutoId: p.tipoProdutoId ?? null,
          ncm: p.ncm ?? '',
          cest: p.cest ?? '',
          cfop: p.cfop ?? '',
          origemMercadoria: p.origemMercadoria ?? 0,
          unidadeTributavelId: p.unidadeTributavelId ?? null,
          precoVendaPadrao: p.precoVendaPadrao,
          precoCustoMedio: p.precoCustoMedio,
          margem: p.margem ?? 0,
          precoMinimo: p.precoMinimo ?? 0,
          unidadeVendaId: p.unidadeVendaId ?? null,
          origemAbastecimentoId: p.origemAbastecimentoId ?? null,
          prazoFabricacaoDias: p.prazoFabricacaoDias ?? 0,
          rendimento: p.rendimento ?? 0,
          percentualPerda: p.percentualPerda ?? 0,
          permiteUsoEmBom: p.permiteUsoEmBom ?? true,
          ativo: p.ativo,
          unidadeMedidaId: p.unidadeMedidaId,
          familiaProdutoId: p.familiaProdutoId
        };
        this.itensComposicao = (p.itensComposicao ?? []).map(i => ({ ...i }));
        this.loading = false;
      },
      error: (e) => {
        this.error = mensagemErro(e, 'Erro ao carregar o produto.');
        this.loading = false;
      }
    });
  }

  tipoLabelValor(v: number): string {
    return this.tiposPadrao.find(t => t.valor === v)?.label ?? '—';
  }

  // ===== Ações de Ativo/Inativo =====
  alternarAtivoProduto() {
    this.error = '';
    this.sucesso = '';
    this.form.ativo = !this.form.ativo;
    if (this.produtoId) {
      this.api.alterarStatusProduto(this.produtoId, this.form.ativo).subscribe({
        next: () => {
          this.sucesso = this.form.ativo ? 'Produto ativado com sucesso.' : 'Produto desativado com sucesso.';
        },
        error: (e) => { this.error = mensagemErro(e, 'Erro ao alterar o status.'); }
      });
    }
  }

  // =====================================================
  // Modal da Engrenagem (gerenciar listas dedicadas)
  // =====================================================
  abrirModal(tipo: TipoListaProduto) {
    this.modalTipo = tipo;
    this.novoItemTexto = '';
    this.editandoIndex = null;
    this.editandoTexto = '';

    switch (tipo) {
      case 'tipo':
        this.modalTitulo = 'Tipos de Produto';
        this.modalItens = this.tiposCadastro.map(x => x.nome);
        this.modalObjs = [...this.tiposCadastro];
        break;
      case 'unidade':
      case 'unidadeTributavel':
        this.modalTitulo = tipo === 'unidade' ? 'Unidades de Medida' : 'Unidades Tributáveis';
        this.modalItens = this.unidades.map(u => u.sigla);
        this.modalObjs = this.unidades.map(u => ({ id: u.id, nome: u.sigla }));
        break;
      case 'familia':
        this.modalTitulo = 'Famílias de Produto';
        this.modalItens = this.familias.map(f => f.nome);
        this.modalObjs = this.familias.map(f => ({ id: f.id, nome: f.nome }));
        break;
      case 'origemMercadoria':
        this.modalTitulo = 'Origens da Mercadoria';
        this.modalItens = this.origensMercadoria.map(o => o.label);
        this.modalObjs = this.origensMercadoria.map(o => ({ id: String(o.valor), nome: o.label }));
        break;
      case 'unidadeVenda':
        this.modalTitulo = 'Unidades de Venda';
        this.modalItens = this.unidadesVendaList.map(x => x.nome);
        this.modalObjs = [...this.unidadesVendaList];
        break;
      case 'origemAbastecimento':
        this.modalTitulo = 'Origens de Abastecimento';
        this.modalItens = this.origensAbastecimentoList.map(x => x.nome);
        this.modalObjs = [...this.origensAbastecimentoList];
        break;
    }
    this.modalAberto = true;
  }

  fecharModalOpcoes() { this.modalAberto = false; }

  adicionarOpcaoModal() {
    const nome = (this.novoItemTexto || '').trim();
    if (!nome) return;

    if (this.modalTipo === 'unidade' || this.modalTipo === 'unidadeTributavel') {
      this.api.createUnidadeMedida({ sigla: nome, descricao: nome, fatorPadrao: 1 }).subscribe({
        next: (u) => {
          this.unidades = [...this.unidades, u];
          this.modalItens.push(u.sigla);
          this.modalObjs.push({ id: u.id, nome: u.sigla });
          this.novoItemTexto = '';
        },
        error: (e) => { this.error = mensagemErro(e, 'Erro ao adicionar unidade.'); }
      });
      return;
    }

    if (this.modalTipo === 'familia') {
      this.api.createFamiliaProduto({ nome }).subscribe({
        next: (f) => {
          this.familias = [...this.familias, f];
          this.modalItens.push(f.nome);
          this.modalObjs.push({ id: f.id, nome: f.nome });
          this.novoItemTexto = '';
        },
        error: (e) => { this.error = mensagemErro(e, 'Erro ao adicionar família.'); }
      });
      return;
    }

    // demais listas via endpoint genérico de categorias/opções
    const rota = this.rotaModal();
    this.api.addOpcaoCategoria(rota, nome).subscribe({
      next: (o) => {
        this.modalItens.push(o.nome);
        this.modalObjs.push(o);
        this.novoItemTexto = '';
        this.sincronizarListaLocal();
      },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao adicionar opção.'); }
    });
  }

  iniciarEdicaoOpcao(i: number) {
    this.editandoIndex = i;
    this.editandoTexto = this.modalItens[i];
  }

  cancelarEdicaoOpcao() {
    this.editandoIndex = null;
    this.editandoTexto = '';
  }

  salvarEdicaoOpcao(i: number) {
    const nome = (this.editandoTexto || '').trim();
    if (!nome) { this.cancelarEdicaoOpcao(); return; }
    const antigo = this.modalItens[i];
    const obj = this.modalObjs[i];

    if (this.modalTipo === 'unidade' || this.modalTipo === 'unidadeTributavel') {
      this.api.updateUnidadeMedida(obj.id, { sigla: nome, descricao: nome, fatorPadrao: 1 }).subscribe({
        next: () => {
          this.modalItens[i] = nome;
          this.modalObjs[i] = { ...obj, nome };
          const u = this.unidades.find(x => x.id === obj.id);
          if (u) { u.sigla = nome; u.descricao = nome; }
          this.atualizarValorSelecionado(antigo, nome);
          this.editandoIndex = null;
        },
        error: (e) => { this.error = mensagemErro(e, 'Erro ao editar unidade.'); }
      });
      return;
    }

    if (this.modalTipo === 'familia') {
      this.api.updateFamiliaProduto(obj.id, { nome }).subscribe({
        next: () => {
          this.modalItens[i] = nome;
          this.modalObjs[i] = { ...obj, nome };
          const f = this.familias.find(x => x.id === obj.id);
          if (f) { f.nome = nome; }
          this.atualizarValorSelecionado(antigo, nome);
          this.editandoIndex = null;
        },
        error: (e) => { this.error = mensagemErro(e, 'Erro ao editar família.'); }
      });
      return;
    }

    if (this.modalTipo === 'origemMercadoria') {
      if (this.origemMercadoriaLabel() === antigo) {
        const o = this.origensMercadoria.find(x => x.label === antigo);
        if (o) o.label = nome;
      }
      this.modalItens[i] = nome;
      this.modalObjs[i] = { ...obj, nome };
      this.editandoIndex = null;
      return;
    }

    const rota = this.rotaModal();
    this.api.updateOpcaoCategoria(rota, obj.id, nome).subscribe({
      next: () => {
        this.modalItens[i] = nome;
        this.modalObjs[i] = { ...obj, nome };
        this.atualizarValorSelecionado(antigo, nome);
        this.sincronizarListaLocal();
        this.editandoIndex = null;
      },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao editar opção.'); }
    });
  }

  removerOpcaoModal(i: number) {
    const obj = this.modalObjs[i];
    const removido = this.modalItens[i];

    if (this.modalTipo === 'unidade' || this.modalTipo === 'unidadeTributavel') {
      this.api.deleteUnidadeMedida(obj.id).subscribe({
        next: () => {
          this.unidades = this.unidades.filter(u => u.id !== obj.id);
          this.modalItens.splice(i, 1);
          this.modalObjs.splice(i, 1);
          if (this.form.unidadeMedidaId === obj.id) this.form.unidadeMedidaId = null;
          if (this.form.unidadeTributavelId === obj.id) this.form.unidadeTributavelId = null;
        },
        error: (e) => { this.error = mensagemErro(e, 'Erro ao excluir unidade.'); }
      });
      return;
    }

    if (this.modalTipo === 'familia') {
      this.api.deleteFamiliaProduto(obj.id).subscribe({
        next: () => {
          this.familias = this.familias.filter(f => f.id !== obj.id);
          this.modalItens.splice(i, 1);
          this.modalObjs.splice(i, 1);
          if (this.form.familiaProdutoId === obj.id) this.form.familiaProdutoId = null;
        },
        error: (e) => { this.error = mensagemErro(e, 'Erro ao excluir família.'); }
      });
      return;
    }

    if (this.modalTipo === 'origemMercadoria') {
      this.modalItens.splice(i, 1);
      this.modalObjs.splice(i, 1);
      this.origensMercadoria = this.origensMercadoria.filter(o => o.label !== removido);
      return;
    }

    const rota = this.rotaModal();
    this.api.deleteOpcaoCategoria(rota, obj.id).subscribe({
      next: () => {
        this.modalItens.splice(i, 1);
        this.modalObjs.splice(i, 1);
        this.atualizarValorSelecionado(removido, '');
        this.sincronizarListaLocal();
      },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao excluir opção.'); }
    });
  }

  private rotaModal(): string {
    switch (this.modalTipo) {
      case 'tipo': return 'tipos-produto';
      case 'unidadeVenda': return 'unidades-venda';
      case 'origemAbastecimento': return 'origens-abastecimento';
      default: return '';
    }
  }

  /** Atualiza o valor selecionado no formulário quando o item editado é o que está selecionado. */
  private atualizarValorSelecionado(antigo: string, novo: string) {
    if (this.modalTipo === 'tipo') {
      const obj = this.modalObjs.find(x => x.nome === novo);
      if (obj && this.form.tipoProdutoId === this.modalObjs.find(x => x.nome === antigo)?.id) {
        this.form.tipoProdutoId = obj.id;
      }
      return;
    }
    if (this.modalTipo === 'unidade') {
      const obj = this.modalObjs.find(x => x.nome === novo);
      if (obj && this.form.unidadeMedidaId === this.modalObjs.find(x => x.nome === antigo)?.id) {
        this.form.unidadeMedidaId = obj.id;
      }
      return;
    }
    if (this.modalTipo === 'unidadeTributavel') {
      const obj = this.modalObjs.find(x => x.nome === novo);
      if (obj && this.form.unidadeTributavelId === this.modalObjs.find(x => x.nome === antigo)?.id) {
        this.form.unidadeTributavelId = obj.id;
      }
      return;
    }
    if (this.modalTipo === 'familia') {
      const obj = this.modalObjs.find(x => x.nome === novo);
      if (obj && this.form.familiaProdutoId === this.modalObjs.find(x => x.nome === antigo)?.id) {
        this.form.familiaProdutoId = obj.id;
      }
      return;
    }
    if (this.modalTipo === 'unidadeVenda') {
      const obj = this.modalObjs.find(x => x.nome === novo);
      if (obj && this.form.unidadeVendaId === this.modalObjs.find(x => x.nome === antigo)?.id) {
        this.form.unidadeVendaId = obj.id;
      }
      return;
    }
    if (this.modalTipo === 'origemAbastecimento') {
      const obj = this.modalObjs.find(x => x.nome === novo);
      if (obj && this.form.origemAbastecimentoId === this.modalObjs.find(x => x.nome === antigo)?.id) {
        this.form.origemAbastecimentoId = obj.id;
      }
      return;
    }
  }

  private sincronizarListaLocal() {
    if (this.modalTipo === 'tipo') {
      this.tiposCadastro = this.modalObjs.map(x => ({ id: x.id, nome: x.nome }));
    }
    if (this.modalTipo === 'unidadeVenda') {
      this.unidadesVendaList = this.modalObjs.map(x => ({ id: x.id, nome: x.nome }));
    }
    if (this.modalTipo === 'origemAbastecimento') {
      this.origensAbastecimentoList = this.modalObjs.map(x => ({ id: x.id, nome: x.nome }));
    }
  }

  private tipoSelecionadoNome(): string {
    return this.tiposPadrao.find(t => t.valor === this.form.tipo)?.label ?? '';
  }

  private origemMercadoriaLabel(): string {
    return this.origensMercadoria.find(o => o.valor === this.form.origemMercadoria)?.label ?? '';
  }

  // =====================================================
  // 05. Aba Composição & Pop-up Adicionar Outros Produtos
  // =====================================================
  /** Soma do custo de todos os produtos inseridos na 5ª aba. */
  get custoComponentes(): number {
    const soma = this.itensComposicao.reduce(
      (acc, item) => acc + (Number(item.quantidade) || 0) * (Number(item.valorCustoReferencia) || 0),
      0
    );
    return +soma.toFixed(2);
  }

  /** Custo Total = Custo de Referência (R$) + Soma dos produtos inseridos na Composição. */
  get custoTotalCalculado(): number {
    const custoRef = Number(this.form.precoCustoMedio) || 0;
    return +(custoRef + this.custoComponentes).toFixed(2);
  }

  custoUnitarioProduto(p: Produto): number {
    const ct = p.custoTotal ?? p.precoCustoMedio ?? 0;
    return +Number(ct).toFixed(2);
  }

  abrirModalProdutos() {
    this.buscaProdutoTermo = '';
    this.selecionadosModal = {};
    this.quantidadesTempModal = {};
    for (const p of this.todosProdutos) {
      this.quantidadesTempModal[p.id] = 1;
    }
    this.carregarTodosProdutos();
    this.modalProdutosAberto = true;
  }

  fecharModalProdutos() {
    this.modalProdutosAberto = false;
  }

  get produtosFiltradosModal(): Produto[] {
    const termo = (this.buscaProdutoTermo || '').trim().toLowerCase();
    return this.todosProdutos.filter(p => {
      if (this.produtoId && p.id === this.produtoId) return false;
      if (!termo) return true;
      const cod = (p.codigo || '').toLowerCase();
      const barras = (p.codigoBarras || '').toLowerCase();
      const desc = (p.descricao || '').toLowerCase();
      return cod.includes(termo) || barras.includes(termo) || desc.includes(termo);
    });
  }

  estaSelecionadoNoModal(produtoId: string): boolean {
    return this.selecionadosModal[produtoId] !== undefined;
  }

  jaInseridoNaComposicao(produtoId: string): boolean {
    return this.itensComposicao.some(i => i.componenteId === produtoId);
  }

  alternarSelecaoProdutoModal(p: Produto) {
    if (this.estaSelecionadoNoModal(p.id)) {
      delete this.selecionadosModal[p.id];
    } else {
      const qtd = Number(this.quantidadesTempModal[p.id]) > 0 ? Number(this.quantidadesTempModal[p.id]) : 1;
      this.quantidadesTempModal[p.id] = qtd;
      this.selecionadosModal[p.id] = qtd;
    }
  }

  onQuantidadeModalChange(p: Produto, valor: number) {
    const qtd = Number(valor);
    this.quantidadesTempModal[p.id] = qtd;
    if (qtd > 0) {
      this.selecionadosModal[p.id] = qtd;
    } else {
      delete this.selecionadosModal[p.id];
    }
  }

  get qtdSelecionadosModal(): number {
    return Object.keys(this.selecionadosModal).length;
  }

  inserirProdutosSelecionados() {
    const ids = Object.keys(this.selecionadosModal);
    if (ids.length === 0) return;

    for (const id of ids) {
      const qtd = Number(this.selecionadosModal[id]) || 0;
      if (qtd <= 0) continue;

      const prod = this.todosProdutos.find(p => p.id === id);
      if (!prod) continue;

      const custoUnit = this.custoUnitarioProduto(prod);
      const existente = this.itensComposicao.find(i => i.componenteId === id);

      if (existente) {
        existente.quantidade = +(Number(existente.quantidade) + qtd).toFixed(4);
        existente.valorCustoReferencia = custoUnit;
        existente.subtotal = +(existente.quantidade * custoUnit).toFixed(2);
      } else {
        this.itensComposicao.push({
          componenteId: prod.id,
          codigo: prod.codigo,
          codigoBarras: prod.codigoBarras,
          descricao: prod.descricao,
          unidadeMedidaSigla: prod.unidadeMedidaSigla,
          quantidade: qtd,
          valorCustoReferencia: custoUnit,
          subtotal: +(qtd * custoUnit).toFixed(2)
        });
      }
    }

    this.modalProdutosAberto = false;
  }

  atualizarQuantidadeItem(item: ProdutoComposicaoItem) {
    const qtd = Number(item.quantidade) || 0;
    item.subtotal = +(qtd * (Number(item.valorCustoReferencia) || 0)).toFixed(2);
  }

  removerItemComposicao(index: number) {
    this.itensComposicao.splice(index, 1);
  }

  // ===== Salvar / Voltar =====
  voltar() { this.router.navigate(['/produtos']); }

  salvar() {
    this.error = '';
    this.sucesso = '';

    if (!this.form.codigo?.trim() || !this.form.descricao?.trim()) {
      this.error = 'Preencha os campos obrigatórios: Código e Descrição (aba GERAL).';
      this.abaAtiva = 'geral';
      return;
    }
    if (!this.form.unidadeMedidaId || !this.form.familiaProdutoId) {
      this.error = 'Selecione a Unidade de Medida e a Família do produto (aba GERAL).';
      this.abaAtiva = 'geral';
      return;
    }
    for (const item of this.itensComposicao) {
      if (!item.quantidade || Number(item.quantidade) <= 0) {
        this.error = `Informe uma quantidade maior que zero para o produto "${item.codigo} - ${item.descricao}" (aba COMPOSIÇÃO).`;
        this.abaAtiva = 'composicao';
        return;
      }
    }

    const custoBase = this.custoTotalCalculado;
    if (custoBase > 0 && this.form.margem > 0 && this.form.precoVendaPadrao === 0) {
      this.form.precoVendaPadrao = +(custoBase * (1 + this.form.margem / 100)).toFixed(2);
    }

    // Garante o enum numérico a partir do Tipo de Produto selecionado (tabela dedicada)
    this.onTipoChange();

    const payload: ProdutoCreate = {
      ...this.form,
      itensComposicao: this.itensComposicao.map(i => ({
        componenteId: i.componenteId,
        quantidade: Number(i.quantidade)
      }))
    };

    this.salvando = true;
    if (this.produtoId) {
      this.api.updateProduto(this.produtoId, payload).subscribe({
        next: () => {
          this.salvando = false;
          this.sucesso = 'Produto atualizado com sucesso.';
          setTimeout(() => this.voltar(), 900);
        },
        error: (e) => {
          this.salvando = false;
          this.error = mensagemErro(e, 'Erro ao atualizar o produto.');
        }
      });
    } else {
      this.api.createProduto(payload).subscribe({
        next: () => {
          this.salvando = false;
          this.sucesso = 'Produto cadastrado com sucesso.';
          setTimeout(() => this.voltar(), 900);
        },
        error: (e) => {
          this.salvando = false;
          this.error = mensagemErro(e, 'Erro ao cadastrar o produto.');
        }
      });
    }
  }
}
