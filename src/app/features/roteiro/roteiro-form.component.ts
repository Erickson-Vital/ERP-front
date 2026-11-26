import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import { Roteiro, RoteiroCreate, RoteiroItem, Produto, Recurso, OpcaoCategoria } from '../../core/models';
import { normalizar } from '../../core/paginacao';

@Component({
  selector: 'app-roteiro-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './roteiro-form.component.html',
  styleUrl: './roteiro-form.component.css'
})
export class RoteiroFormComponent implements OnInit {
  roteiroId: string | null = null;
  loading = false;
  salvando = false;
  error = '';
  sucesso = '';

  produtos: Produto[] = [];
  recursos: Recurso[] = [];
  unidadesRoteiro: OpcaoCategoria[] = [];

  // Cabeçalho do Roteiro
  unidadeMedidaRoteiroId: string | null = null;
  produtoId: string | null = null;
  produtoSelecionado: Produto | null = null;
  ativo = true;

  // Autocomplete Produto
  buscaProdutoTermo = '';
  mostrarDropdownProduto = false;

  // Autocomplete & Adição de Recurso
  buscaRecursoTermo = '';
  mostrarDropdownRecurso = false;
  recursoEmSelecao: Recurso | null = null;
  novasHoras = 1;
  novaQtdMaoDeObra = 1;

  // Itens (Recursos do Roteiro com sequência 1, 2, 3...)
  itens: RoteiroItem[] = [];

  // Modal da Engrenagem (UnidadesMedidaRoteiro)
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
    this.roteiroId = this.route.snapshot.paramMap.get('id');
    this.carregarDadosIniciais();
  }

  carregarDadosIniciais() {
    this.api.getOpcoesCategoria('unidades-roteiro').subscribe({
      next: d => { this.unidadesRoteiro = d; }
    });

    this.api.getRecursos().subscribe({
      next: recs => { this.recursos = recs.filter(r => r.ativo); }
    });

    this.api.getProdutos().subscribe({
      next: prods => {
        this.produtos = prods;
        if (this.roteiroId) {
          this.carregarRoteiro(this.roteiroId);
        }
      },
      error: () => {
        this.error = 'Erro ao carregar a lista de produtos.';
      }
    });
  }

  carregarRoteiro(id: string) {
    this.loading = true;
    this.api.getRoteiro(id).subscribe({
      next: (r: Roteiro) => {
        this.unidadeMedidaRoteiroId = r.unidadeMedidaRoteiroId;
        this.produtoId = r.produtoId;
        this.ativo = r.ativo;

        const prod = this.produtos.find(p => p.id === r.produtoId) ?? null;
        this.produtoSelecionado = prod;
        this.buscaProdutoTermo = prod
          ? `${prod.codigo} — ${prod.descricao}`
          : `${r.produtoCodigo} — ${r.produtoDescricao}`;

        this.itens = (r.itens || []).map((item, idx) => ({
          ...item,
          ordem: idx + 1
        }));
        this.loading = false;
      },
      error: e => {
        this.error = mensagemErro(e, 'Erro ao carregar os dados do roteiro.');
        this.loading = false;
      }
    });
  }

  // =====================================================
  // Busca Dinâmica do Produto
  // =====================================================
  get opcoesProduto(): Produto[] {
    const termo = normalizar(this.buscaProdutoTermo);
    return this.produtos.filter(p => {
      if (!termo) return true;
      return (
        normalizar(p.codigo).includes(termo) ||
        normalizar(p.descricao).includes(termo) ||
        normalizar(p.codigoBarras).includes(termo)
      );
    }).slice(0, 30);
  }

  onDigitarProduto() {
    this.mostrarDropdownProduto = true;
    if (this.produtoSelecionado) {
      const textoAtual = `${this.produtoSelecionado.codigo} — ${this.produtoSelecionado.descricao}`;
      if (this.buscaProdutoTermo !== textoAtual) {
        this.produtoId = null;
        this.produtoSelecionado = null;
      }
    }
  }

  selecionarProduto(p: Produto) {
    this.produtoId = p.id;
    this.produtoSelecionado = p;
    this.buscaProdutoTermo = `${p.codigo} — ${p.descricao}`;
    this.mostrarDropdownProduto = false;
  }

  limparProduto() {
    this.produtoId = null;
    this.produtoSelecionado = null;
    this.buscaProdutoTermo = '';
    this.mostrarDropdownProduto = true;
  }

  fecharDropdownProdutoComDelay() {
    setTimeout(() => { this.mostrarDropdownProduto = false; }, 180);
  }

  // =====================================================
  // Busca Dinâmica e Adição de Recursos
  // =====================================================
  get opcoesRecurso(): Recurso[] {
    const termo = normalizar(this.buscaRecursoTermo);
    return this.recursos.filter(r => {
      if (!termo) return true;
      return (
        normalizar(r.codigo).includes(termo) ||
        normalizar(r.nome).includes(termo) ||
        normalizar(r.tipoRecursoNome).includes(termo)
      );
    }).slice(0, 30);
  }

  onDigitarRecurso() {
    this.mostrarDropdownRecurso = true;
    if (this.recursoEmSelecao) {
      const textoAtual = `${this.recursoEmSelecao.codigo} — ${this.recursoEmSelecao.nome}`;
      if (this.buscaRecursoTermo !== textoAtual) {
        this.recursoEmSelecao = null;
      }
    }
  }

  selecionarRecurso(r: Recurso) {
    this.recursoEmSelecao = r;
    this.buscaRecursoTermo = `${r.codigo} — ${r.nome}`;
    this.mostrarDropdownRecurso = false;
    if (!this.novasHoras || this.novasHoras <= 0) {
      this.novasHoras = 1;
    }
    if (this.novaQtdMaoDeObra === null || this.novaQtdMaoDeObra === undefined || this.novaQtdMaoDeObra < 0) {
      this.novaQtdMaoDeObra = 1;
    }
  }

  limparSelecaoRecurso() {
    this.recursoEmSelecao = null;
    this.buscaRecursoTermo = '';
    this.novasHoras = 1;
    this.novaQtdMaoDeObra = 1;
  }

  fecharDropdownRecursoComDelay() {
    setTimeout(() => { this.mostrarDropdownRecurso = false; }, 180);
  }

  get previewValorHora(): number {
    return this.recursoEmSelecao?.valorHora ?? 0;
  }

  get previewCustoTotal(): number {
    const h = Number(this.novasHoras) || 0;
    return +(h * this.previewValorHora).toFixed(2);
  }

  adicionarRecurso() {
    this.error = '';
    if (!this.produtoId) {
      this.error = 'Selecione primeiro o Produto desejado.';
      return;
    }
    if (!this.recursoEmSelecao) {
      this.error = 'Pesquise e selecione um Recurso na lista.';
      return;
    }
    const horas = Number(this.novasHoras);
    if (!horas || horas <= 0) {
      this.error = 'Informe uma quantidade de horas maior que zero.';
      return;
    }
    const maoObra = Number(this.novaQtdMaoDeObra);
    if (isNaN(maoObra) || maoObra < 0) {
      this.error = 'A quantidade de mão de obra não pode ser negativa.';
      return;
    }

    const r = this.recursoEmSelecao;
    const valorHora = Number(r.valorHora) || 0;

    this.itens.push({
      ordem: this.itens.length + 1,
      recursoId: r.id,
      recursoCodigo: r.codigo,
      recursoNome: r.nome,
      tipoRecursoNome: r.tipoRecursoNome,
      valorHora,
      horas,
      quantidadeMaoDeObra: Math.round(maoObra),
      custoTotal: +(horas * valorHora).toFixed(2)
    });

    this.renumerarSequenciaItens();
    this.limparSelecaoRecurso();
  }

  recalcularItem(item: RoteiroItem) {
    const horas = Number(item.horas) || 0;
    const valorHora = Number(item.valorHora) || 0;
    item.custoTotal = +(horas * valorHora).toFixed(2);
  }

  removerItem(index: number) {
    this.itens.splice(index, 1);
    this.renumerarSequenciaItens();
  }

  private renumerarSequenciaItens() {
    this.itens.forEach((item, idx) => {
      item.ordem = idx + 1;
    });
  }

  get totalHorasGeral(): number {
    const soma = this.itens.reduce((acc, i) => acc + (Number(i.horas) || 0), 0);
    return +soma.toFixed(4);
  }

  get totalMaoDeObraGeral(): number {
    return this.itens.reduce((acc, i) => acc + (Number(i.quantidadeMaoDeObra) || 0), 0);
  }

  get custoTotalGeral(): number {
    const soma = this.itens.reduce((acc, i) => acc + (Number(i.custoTotal) || 0), 0);
    return +soma.toFixed(2);
  }

  // =====================================================
  // Modal da Engrenagem — Unidades de Medida do Roteiro
  // =====================================================
  abrirModalUnidades() {
    this.novaUnidadeTexto = '';
    this.editandoIndex = null;
    this.editandoTexto = '';
    this.modalUnidadeAberto = true;
  }

  fecharModalUnidades() {
    this.modalUnidadeAberto = false;
  }

  adicionarUnidade() {
    const nome = (this.novaUnidadeTexto || '').trim();
    if (!nome) return;
    this.api.addOpcaoCategoria('unidades-roteiro', nome).subscribe({
      next: nova => {
        this.unidadesRoteiro = [...this.unidadesRoteiro, nova];
        this.unidadeMedidaRoteiroId = nova.id;
        this.novaUnidadeTexto = '';
      },
      error: e => { this.error = mensagemErro(e, 'Erro ao adicionar unidade de medida do roteiro.'); }
    });
  }

  iniciarEdicaoUnidade(i: number) {
    this.editandoIndex = i;
    this.editandoTexto = this.unidadesRoteiro[i].nome;
  }

  cancelarEdicaoUnidade() {
    this.editandoIndex = null;
    this.editandoTexto = '';
  }

  salvarEdicaoUnidade(i: number) {
    const nome = (this.editandoTexto || '').trim();
    if (!nome) { this.cancelarEdicaoUnidade(); return; }
    const atual = this.unidadesRoteiro[i];
    this.api.updateOpcaoCategoria('unidades-roteiro', atual.id, nome).subscribe({
      next: upd => {
        this.unidadesRoteiro[i] = upd;
        this.unidadesRoteiro = [...this.unidadesRoteiro];
        this.editandoIndex = null;
      },
      error: e => { this.error = mensagemErro(e, 'Erro ao editar unidade de medida do roteiro.'); }
    });
  }

  removerUnidade(i: number) {
    const atual = this.unidadesRoteiro[i];
    this.api.deleteOpcaoCategoria('unidades-roteiro', atual.id).subscribe({
      next: () => {
        this.unidadesRoteiro = this.unidadesRoteiro.filter(u => u.id !== atual.id);
        if (this.unidadeMedidaRoteiroId === atual.id) {
          this.unidadeMedidaRoteiroId = null;
        }
      },
      error: e => { this.error = mensagemErro(e, 'Erro ao excluir unidade de medida do roteiro.'); }
    });
  }

  // =====================================================
  // Salvar / Voltar
  // =====================================================
  voltar() {
    this.router.navigate(['/roteiro']);
  }

  salvar() {
    this.error = '';
    this.sucesso = '';

    if (!this.unidadeMedidaRoteiroId) {
      this.error = 'Selecione a Unidade de Medida do Roteiro.';
      return;
    }
    if (!this.produtoId) {
      this.error = 'Selecione o Produto desejado digitando o código ou nome.';
      return;
    }
    if (this.itens.length === 0) {
      this.error = 'Adicione pelo menos um Recurso ao Roteiro.';
      return;
    }
    for (const item of this.itens) {
      if (!item.horas || Number(item.horas) <= 0) {
        this.error = `Informe uma quantidade de horas maior que zero para o recurso "${item.recursoCodigo} - ${item.recursoNome}".`;
        return;
      }
      if (item.quantidadeMaoDeObra === null || item.quantidadeMaoDeObra === undefined || Number(item.quantidadeMaoDeObra) < 0) {
        this.error = `A quantidade de mão de obra não pode ser negativa para o recurso "${item.recursoCodigo} - ${item.recursoNome}".`;
        return;
      }
    }

    const payload: RoteiroCreate = {
      produtoId: this.produtoId,
      unidadeMedidaRoteiroId: this.unidadeMedidaRoteiroId,
      ativo: this.ativo,
      itens: this.itens.map(i => ({
        recursoId: i.recursoId,
        horas: Number(i.horas),
        quantidadeMaoDeObra: Math.round(Number(i.quantidadeMaoDeObra) || 0)
      }))
    };

    this.salvando = true;
    if (this.roteiroId) {
      this.api.updateRoteiro(this.roteiroId, payload).subscribe({
        next: () => {
          this.salvando = false;
          this.sucesso = 'Roteiro atualizado com sucesso.';
          setTimeout(() => this.voltar(), 800);
        },
        error: e => {
          this.salvando = false;
          this.error = mensagemErro(e, 'Erro ao atualizar o roteiro.');
        }
      });
    } else {
      this.api.createRoteiro(payload).subscribe({
        next: () => {
          this.salvando = false;
          this.sucesso = 'Roteiro cadastrado com sucesso.';
          setTimeout(() => this.voltar(), 800);
        },
        error: e => {
          this.salvando = false;
          this.error = mensagemErro(e, 'Erro ao cadastrar o roteiro.');
        }
      });
    }
  }
}
