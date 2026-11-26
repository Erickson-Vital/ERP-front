import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import { Bom, BomCreate, BomItem, Produto, OpcaoCategoria } from '../../core/models';
import { normalizar } from '../../core/paginacao';

@Component({
  selector: 'app-bom-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './bom-form.component.html',
  styleUrl: './bom-form.component.css'
})
export class BomFormComponent implements OnInit {
  bomId: string | null = null;
  loading = false;
  salvando = false;
  error = '';
  sucesso = '';

  produtos: Produto[] = [];
  unidadesBom: OpcaoCategoria[] = [];

  // Cabeçalho da BOM
  unidadeMedidaBomId: string | null = null;
  produtoPaiId: string | null = null;
  produtoPaiSelecionado: Produto | null = null;
  ativo = true;

  // Autocomplete Produto Pai
  buscaPaiTermo = '';
  mostrarDropdownPai = false;

  // Autocomplete & Adição de Produto Filho
  buscaFilhoTermo = '';
  mostrarDropdownFilho = false;
  produtoFilhoEmSelecao: Produto | null = null;
  novaQtdFilho = 1;

  // Lista de Produtos Filhos vinculados
  itens: BomItem[] = [];

  // Modal da Engrenagem (UnidadesMedidaBom)
  modalUnidadeAberto = false;
  novaUnidadeTexto = '';
  editandoIndex: number | null = null;
  editandoTexto = '';

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.bomId = this.route.snapshot.paramMap.get('id');
    this.carregarDadosIniciais();
  }

  carregarDadosIniciais() {
    this.api.getOpcoesCategoria('unidades-bom').subscribe({
      next: d => { this.unidadesBom = d; }
    });

    this.api.getProdutos().subscribe({
      next: prods => {
        this.produtos = prods;
        if (this.bomId) {
          this.carregarBom(this.bomId);
        }
      },
      error: () => {
        this.error = 'Erro ao carregar a lista de produtos.';
      }
    });
  }

  carregarBom(id: string) {
    this.loading = true;
    this.api.getBom(id).subscribe({
      next: (b: Bom) => {
        this.unidadeMedidaBomId = b.unidadeMedidaBomId;
        this.produtoPaiId = b.produtoPaiId;
        this.ativo = b.ativo;

        const pai = this.produtos.find(p => p.id === b.produtoPaiId) ?? null;
        this.produtoPaiSelecionado = pai;
        this.buscaPaiTermo = pai
          ? `${pai.codigo} — ${pai.descricao}`
          : `${b.produtoPaiCodigo} — ${b.produtoPaiDescricao}`;

        this.itens = (b.itens || []).map(i => ({ ...i }));
        this.loading = false;
      },
      error: e => {
        this.error = mensagemErro(e, 'Erro ao carregar os dados da BOM.');
        this.loading = false;
      }
    });
  }

  // =====================================================
  // Busca Dinâmica do Produto Pai
  // =====================================================
  get opcoesProdutoPai(): Produto[] {
    const termo = normalizar(this.buscaPaiTermo);
    return this.produtos.filter(p => {
      if (!termo) return true;
      return (
        normalizar(p.codigo).includes(termo) ||
        normalizar(p.descricao).includes(termo) ||
        normalizar(p.codigoBarras).includes(termo)
      );
    }).slice(0, 30);
  }

  onDigitarProdutoPai() {
    this.mostrarDropdownPai = true;
    if (this.produtoPaiSelecionado) {
      const textoAtual = `${this.produtoPaiSelecionado.codigo} — ${this.produtoPaiSelecionado.descricao}`;
      if (this.buscaPaiTermo !== textoAtual) {
        this.produtoPaiId = null;
        this.produtoPaiSelecionado = null;
      }
    }
  }

  selecionarProdutoPai(p: Produto) {
    this.produtoPaiId = p.id;
    this.produtoPaiSelecionado = p;
    this.buscaPaiTermo = `${p.codigo} — ${p.descricao}`;
    this.mostrarDropdownPai = false;

    // Garante que o produto pai não fique como filho dele mesmo
    this.itens = this.itens.filter(i => i.produtoFilhoId !== p.id);
    if (this.produtoFilhoEmSelecao?.id === p.id) {
      this.limparSelecaoFilho();
    }
  }

  limparProdutoPai() {
    this.produtoPaiId = null;
    this.produtoPaiSelecionado = null;
    this.buscaPaiTermo = '';
    this.mostrarDropdownPai = true;
  }

  fecharDropdownPaiComDelay() {
    setTimeout(() => { this.mostrarDropdownPai = false; }, 180);
  }

  // =====================================================
  // Busca Dinâmica e Adição dos Produtos Filhos
  // =====================================================
  get opcoesProdutoFilho(): Produto[] {
    const termo = normalizar(this.buscaFilhoTermo);
    return this.produtos.filter(p => {
      if (this.produtoPaiId && p.id === this.produtoPaiId) return false;
      if (!termo) return true;
      return (
        normalizar(p.codigo).includes(termo) ||
        normalizar(p.descricao).includes(termo) ||
        normalizar(p.codigoBarras).includes(termo)
      );
    }).slice(0, 30);
  }

  onDigitarProdutoFilho() {
    this.mostrarDropdownFilho = true;
    if (this.produtoFilhoEmSelecao) {
      const textoAtual = `${this.produtoFilhoEmSelecao.codigo} — ${this.produtoFilhoEmSelecao.descricao}`;
      if (this.buscaFilhoTermo !== textoAtual) {
        this.produtoFilhoEmSelecao = null;
      }
    }
  }

  selecionarProdutoFilho(p: Produto) {
    this.produtoFilhoEmSelecao = p;
    this.buscaFilhoTermo = `${p.codigo} — ${p.descricao}`;
    this.mostrarDropdownFilho = false;
    if (!this.novaQtdFilho || this.novaQtdFilho <= 0) {
      this.novaQtdFilho = 1;
    }
  }

  limparSelecaoFilho() {
    this.produtoFilhoEmSelecao = null;
    this.buscaFilhoTermo = '';
    this.novaQtdFilho = 1;
  }

  fecharDropdownFilhoComDelay() {
    setTimeout(() => { this.mostrarDropdownFilho = false; }, 180);
  }

  get previewPrecoUnitarioFilho(): number {
    return this.produtoFilhoEmSelecao?.precoCustoMedio ?? 0;
  }

  get previewPrecoTotalFilho(): number {
    const qtd = Number(this.novaQtdFilho) || 0;
    return +(qtd * this.previewPrecoUnitarioFilho).toFixed(2);
  }

  get previewPercentualPerdaFilho(): number {
    return this.produtoFilhoEmSelecao?.percentualPerda ?? 0;
  }

  get previewQtdPerdaFilho(): number {
    const qtd = Number(this.novaQtdFilho) || 0;
    return +(qtd * (this.previewPercentualPerdaFilho / 100)).toFixed(4);
  }

  adicionarFilho() {
    this.error = '';
    if (!this.produtoPaiId) {
      this.error = 'Selecione primeiro o Produto Pai.';
      return;
    }
    if (!this.produtoFilhoEmSelecao) {
      this.error = 'Pesquise e selecione um Produto Filho na lista.';
      return;
    }
    const qtd = Number(this.novaQtdFilho);
    if (!qtd || qtd <= 0) {
      this.error = 'Informe uma quantidade maior que zero para o Produto Filho.';
      return;
    }

    const p = this.produtoFilhoEmSelecao;
    const precoUnit = Number(p.precoCustoMedio) || 0;
    const percPerda = Number(p.percentualPerda) || 0;

    const existente = this.itens.find(i => i.produtoFilhoId === p.id);
    if (existente) {
      existente.quantidade = +(Number(existente.quantidade) + qtd).toFixed(4);
      existente.precoUnitario = precoUnit;
      existente.percentualPerda = percPerda;
      this.recalcularItem(existente);
    } else {
      this.itens.push({
        produtoFilhoId: p.id,
        produtoFilhoCodigo: p.codigo,
        produtoFilhoDescricao: p.descricao,
        produtoFilhoUnidade: p.unidadeMedidaSigla,
        quantidade: qtd,
        precoUnitario: precoUnit,
        precoTotal: +(qtd * precoUnit).toFixed(2),
        percentualPerda: percPerda,
        quantidadePerda: +(qtd * (percPerda / 100)).toFixed(4)
      });
    }

    this.limparSelecaoFilho();
  }

  recalcularItem(item: BomItem) {
    const qtd = Number(item.quantidade) || 0;
    const unit = Number(item.precoUnitario) || 0;
    const perc = Number(item.percentualPerda) || 0;
    item.precoTotal = +(qtd * unit).toFixed(2);
    item.quantidadePerda = +(qtd * (perc / 100)).toFixed(4);
  }

  removerItem(index: number) {
    this.itens.splice(index, 1);
  }

  get precoTotalGeral(): number {
    const soma = this.itens.reduce((acc, i) => acc + (Number(i.precoTotal) || 0), 0);
    return +soma.toFixed(2);
  }

  // =====================================================
  // Modal da Engrenagem — Unidades de Medida da BOM
  // =====================================================
  abrirModalUnidadesBom() {
    this.novaUnidadeTexto = '';
    this.editandoIndex = null;
    this.editandoTexto = '';
    this.modalUnidadeAberto = true;
  }

  fecharModalUnidadesBom() {
    this.modalUnidadeAberto = false;
  }

  adicionarUnidadeBom() {
    const nome = (this.novaUnidadeTexto || '').trim();
    if (!nome) return;
    this.api.addOpcaoCategoria('unidades-bom', nome).subscribe({
      next: nova => {
        this.unidadesBom = [...this.unidadesBom, nova];
        this.unidadeMedidaBomId = nova.id;
        this.novaUnidadeTexto = '';
      },
      error: e => { this.error = mensagemErro(e, 'Erro ao adicionar unidade da BOM.'); }
    });
  }

  iniciarEdicaoUnidade(i: number) {
    this.editandoIndex = i;
    this.editandoTexto = this.unidadesBom[i].nome;
  }

  cancelarEdicaoUnidade() {
    this.editandoIndex = null;
    this.editandoTexto = '';
  }

  salvarEdicaoUnidade(i: number) {
    const nome = (this.editandoTexto || '').trim();
    if (!nome) { this.cancelarEdicaoUnidade(); return; }
    const atual = this.unidadesBom[i];
    this.api.updateOpcaoCategoria('unidades-bom', atual.id, nome).subscribe({
      next: upd => {
        this.unidadesBom[i] = upd;
        this.unidadesBom = [...this.unidadesBom];
        this.editandoIndex = null;
      },
      error: e => { this.error = mensagemErro(e, 'Erro ao editar unidade da BOM.'); }
    });
  }

  removerUnidadeBom(i: number) {
    const atual = this.unidadesBom[i];
    this.api.deleteOpcaoCategoria('unidades-bom', atual.id).subscribe({
      next: () => {
        this.unidadesBom = this.unidadesBom.filter(u => u.id !== atual.id);
        if (this.unidadeMedidaBomId === atual.id) {
          this.unidadeMedidaBomId = null;
        }
      },
      error: e => { this.error = mensagemErro(e, 'Erro ao excluir unidade da BOM.'); }
    });
  }

  // =====================================================
  // Salvar / Voltar
  // =====================================================
  voltar() {
    this.router.navigate(['/bom']);
  }

  salvar() {
    this.error = '';
    this.sucesso = '';

    if (!this.unidadeMedidaBomId) {
      this.error = 'Selecione a Unidade de Medida da BOM.';
      return;
    }
    if (!this.produtoPaiId) {
      this.error = 'Selecione o Produto Pai digitando o código ou nome.';
      return;
    }
    if (this.itens.length === 0) {
      this.error = 'Vincule pelo menos um Produto Filho à BOM.';
      return;
    }
    for (const item of this.itens) {
      if (!item.quantidade || Number(item.quantidade) <= 0) {
        this.error = `Informe uma quantidade maior que zero para o produto filho "${item.produtoFilhoCodigo} - ${item.produtoFilhoDescricao}".`;
        return;
      }
    }

    const payload: BomCreate = {
      produtoPaiId: this.produtoPaiId,
      unidadeMedidaBomId: this.unidadeMedidaBomId,
      ativo: this.ativo,
      itens: this.itens.map(i => ({
        produtoFilhoId: i.produtoFilhoId,
        quantidade: Number(i.quantidade)
      }))
    };

    this.salvando = true;
    if (this.bomId) {
      this.api.updateBom(this.bomId, payload).subscribe({
        next: () => {
          this.salvando = false;
          this.sucesso = 'BOM atualizada com sucesso.';
          setTimeout(() => this.voltar(), 800);
        },
        error: e => {
          this.salvando = false;
          this.error = mensagemErro(e, 'Erro ao atualizar a BOM.');
        }
      });
    } else {
      this.api.createBom(payload).subscribe({
        next: () => {
          this.salvando = false;
          this.sucesso = 'BOM cadastrada com sucesso.';
          setTimeout(() => this.voltar(), 800);
        },
        error: e => {
          this.salvando = false;
          this.error = mensagemErro(e, 'Erro ao cadastrar a BOM.');
        }
      });
    }
  }
}
