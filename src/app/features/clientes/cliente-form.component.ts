import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ClienteCreate, EnderecoCliente, OpcaoCategoria } from '../../core/models';

export type TipoListaOpcoes = 'categoriaCliente' | 'categoriaEndereco' | 'condicaoPagamento' | 'formaPagamento';

@Component({
  selector: 'app-cliente-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-form.component.html',
  styleUrl: './cliente-form.component.css'
})
export class ClienteFormComponent implements OnInit {
  abaAtiva: 'geral' | 'endereco' | 'fiscal' | 'pagamentos' = 'geral';
  clienteId: string | null = null;
  loading = false;
  salvando = false;
  error = '';
  sucesso = '';

  form: ClienteCreate = this.blankForm();

  // Lista de múltiplos endereços do cliente e formulário de endereço atual
  enderecos: EnderecoCliente[] = [];
  enderecoForm: EnderecoCliente = this.blankEndereco();
  editandoEnderecoIndex: number | null = null;
  erroEndereco = '';

  // Listas de seleção carregadas das tabelas dedicadas do SQL Server
  categoriasClienteObjs: OpcaoCategoria[] = [];
  categoriasEnderecoObjs: OpcaoCategoria[] = [];
  condicoesPagamentoObjs: OpcaoCategoria[] = [];
  formasPagamentoObjs: OpcaoCategoria[] = [];

  categoriasCliente: string[] = [];
  categoriasEndereco: string[] = [];
  condicoesPagamento: string[] = [];
  formasPagamento: string[] = [];

  // Estado do Pop-up (Modal da Engrenagem)
  modalAberto = false;
  modalTipo: TipoListaOpcoes = 'categoriaCliente';
  modalTitulo = '';
  modalItens: string[] = [];
  modalObjs: OpcaoCategoria[] = [];
  novoItemTexto = '';
  editandoIndex: number | null = null;
  editandoTexto = '';

  readonly ufs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.carregarListasOpcoes();
    this.clienteId = this.route.snapshot.paramMap.get('id');
    if (this.clienteId) {
      this.carregarCliente(this.clienteId);
    }
  }

  blankForm(): ClienteCreate {
    return {
      nome: '',
      cpfCnpj: '',
      codigoCliente: '',
      inscricaoEstadual: '',
      emailPrincipal: '',
      telefonePrincipal: '',
      celular: '',
      isentoIE: false,
      status: 1,
      desativado: 0, // 0 = Ativo, 1 = Desativado
      categoria: '',
      observacoes: '',
      enderecos: [],

      inscricaoEstadualProdutorRural: '',
      informacoesZonaFranca: '',
      regimeFiscal: '',

      condicaoPagamentoPadrao: '',
      limiteCredito: 0,
      prazoMaximoDias: 30,
      formasPagamentoAceitas: '',
      observacoesPagamento: ''
    };
  }

  blankEndereco(): EnderecoCliente {
    return {
      cep: '',
      pais: 'Brasil',
      uf: '',
      cidade: '',
      codigoIbge: '',
      logradouro: '',
      numero: '',
      bairro: '',
      complemento: '',
      categoria: 'Comercial',
      principal: this.enderecos ? this.enderecos.length === 0 : true
    };
  }

  get clienteAtivo(): boolean {
    return (this.form.desativado ?? 0) === 0;
  }

  set clienteAtivo(val: boolean) {
    this.form.desativado = val ? 0 : 1;
    this.form.status = val ? 1 : 2;
  }

  alternarAtivoCliente() {
    this.error = '';
    this.sucesso = '';
    const novoDesativado = this.clienteAtivo ? 1 : 0;
    this.form.desativado = novoDesativado;
    this.form.status = novoDesativado === 1 ? 2 : 1;

    // Se já for um cliente existente no banco, salva a mudança de status imediatamente via PATCH
    if (this.clienteId) {
      this.api.alterarStatusCliente(this.clienteId, novoDesativado).subscribe({
        next: (c) => {
          this.form.desativado = c.desativado ?? novoDesativado;
          this.form.status = c.status ?? (novoDesativado === 1 ? 2 : 1);
          this.sucesso = novoDesativado === 1
            ? 'Cliente desativado com sucesso!'
            : 'Cliente ativado com sucesso!';
        },
        error: () => {
          // Reverte visualmente se falhar
          this.form.desativado = novoDesativado === 1 ? 0 : 1;
          this.form.status = this.form.desativado === 1 ? 2 : 1;
          this.error = 'Erro ao atualizar o status do cliente no servidor.';
        }
      });
    }
  }

  carregarCliente(id: string) {
    this.loading = true;
    this.api.getCliente(id).subscribe({
      next: (c) => {
        this.form = {
          nome: c.nome ?? '',
          cpfCnpj: c.cpfCnpj ?? '',
          codigoCliente: c.codigoCliente ?? '',
          inscricaoEstadual: c.inscricaoEstadual ?? '',
          emailPrincipal: c.emailPrincipal ?? '',
          telefonePrincipal: c.telefonePrincipal ?? '',
          celular: c.celular ?? '',
          isentoIE: !!c.isentoIE,
          desativado: c.desativado ?? (c.status === 2 ? 1 : 0),
          status: (c.desativado === 1 || c.status === 2) ? 2 : 1,
          categoria: c.categoria ?? '',
          observacoes: c.observacoes ?? '',

          inscricaoEstadualProdutorRural: c.inscricaoEstadualProdutorRural ?? '',
          informacoesZonaFranca: c.informacoesZonaFranca ?? '',
          regimeFiscal: c.regimeFiscal ?? '',

          condicaoPagamentoPadrao: c.condicaoPagamentoPadrao ?? '',
          limiteCredito: c.limiteCredito ?? 0,
          prazoMaximoDias: c.prazoMaximoDias ?? 0,
          formasPagamentoAceitas: c.formasPagamentoAceitas ?? '',
          observacoesPagamento: c.observacoesPagamento ?? ''
        };

        if (c.enderecos && c.enderecos.length > 0) {
          this.enderecos = c.enderecos.map(e => ({
            id: e.id,
            cep: e.cep ?? '',
            pais: e.pais || 'Brasil',
            uf: e.uf ?? '',
            cidade: e.cidade ?? '',
            codigoIbge: e.codigoIbge ?? '',
            logradouro: e.logradouro ?? '',
            numero: e.numero ?? '',
            bairro: e.bairro ?? '',
            complemento: e.complemento ?? '',
            categoria: e.categoria || 'Comercial',
            principal: !!e.principal
          }));
        } else if (c.logradouro || c.cidade) {
          this.enderecos = [{
            cep: c.cep ?? '',
            pais: c.pais || 'Brasil',
            uf: c.uf ?? '',
            cidade: c.cidade ?? '',
            codigoIbge: c.codigoIbge ?? '',
            logradouro: c.logradouro ?? '',
            numero: c.numero ?? '',
            bairro: c.bairro ?? '',
            complemento: c.complemento ?? '',
            categoria: c.categoriaEndereco || 'Comercial',
            principal: c.enderecoPrincipal ?? true
          }];
        } else {
          this.enderecos = [];
        }

        this.enderecoForm = this.blankEndereco();

        this.garantirValorNaLista(this.categoriasCliente, this.form.categoria, 'erp_opcoes_cat_cliente');
        for (const e of this.enderecos) {
          this.garantirValorNaLista(this.categoriasEndereco, e.categoria, 'erp_opcoes_cat_endereco');
        }
        this.garantirValorNaLista(this.condicoesPagamento, this.form.condicaoPagamentoPadrao, 'erp_opcoes_cond_pagto');
        this.garantirValorNaLista(this.formasPagamento, this.form.formasPagamentoAceitas, 'erp_opcoes_forma_pagto');
        this.loading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar os dados do cliente.';
        this.loading = false;
      }
    });
  }

  // ---------- Gestão de Múltiplos Endereços na Aba ENDEREÇO ----------
  salvarEnderecoNaLista() {
    this.erroEndereco = '';
    const log = (this.enderecoForm.logradouro || '').trim();
    const cid = (this.enderecoForm.cidade || '').trim();
    const uf = (this.enderecoForm.uf || '').trim();

    if (!log || !cid || !uf) {
      this.erroEndereco = 'Informe ao menos Rua / Logradouro, Cidade e Estado (UF) para adicionar o endereço.';
      return;
    }

    const item: EnderecoCliente = {
      ...this.enderecoForm,
      logradouro: log,
      cidade: cid,
      uf: uf,
      pais: (this.enderecoForm.pais || 'Brasil').trim(),
      categoria: this.enderecoForm.categoria || 'Comercial',
      principal: !!this.enderecoForm.principal
    };

    // Se marcou como principal, desmarca os outros
    if (item.principal) {
      this.enderecos.forEach(e => e.principal = false);
    } else if (this.enderecos.length === 0) {
      item.principal = true;
    }

    if (this.editandoEnderecoIndex !== null) {
      this.enderecos[this.editandoEnderecoIndex] = item;
      this.editandoEnderecoIndex = null;
    } else {
      this.enderecos.push(item);
    }

    this.enderecoForm = this.blankEndereco();
  }

  editarEnderecoDaLista(idx: number) {
    this.erroEndereco = '';
    this.editandoEnderecoIndex = idx;
    this.enderecoForm = { ...this.enderecos[idx] };
  }

  cancelarEdicaoEndereco() {
    this.erroEndereco = '';
    this.editandoEnderecoIndex = null;
    this.enderecoForm = this.blankEndereco();
  }

  excluirEnderecoDaLista(idx: number) {
    const eraPrincipal = this.enderecos[idx]?.principal;
    this.enderecos.splice(idx, 1);
    if (this.editandoEnderecoIndex === idx) {
      this.cancelarEdicaoEndereco();
    } else if (this.editandoEnderecoIndex !== null && this.editandoEnderecoIndex > idx) {
      this.editandoEnderecoIndex--;
    }
    if (eraPrincipal && this.enderecos.length > 0) {
      this.enderecos[0].principal = true;
    }
  }

  formatarResumoEndereco(e: EnderecoCliente): string {
    const log = [e.logradouro, e.numero].filter(Boolean).join(', ');
    const cidUf = [e.cidade, e.uf].filter(Boolean).join('-');
    return [log, cidUf].filter(Boolean).join(', ');
  }

  private rotaPorTipo(tipo: TipoListaOpcoes): string {
    switch (tipo) {
      case 'categoriaCliente': return 'clientes';
      case 'categoriaEndereco': return 'enderecos';
      case 'condicaoPagamento': return 'condicoes-pagamento';
      case 'formaPagamento': return 'formas-pagamento';
    }
  }

  private garantirValorNaLista(lista: string[], valor: string | undefined, _chaveStorage: string) {
    if (valor && !lista.includes(valor)) {
      lista.push(valor);
    }
  }

  carregarListasOpcoes() {
    this.api.getOpcoesCategoria('clientes').subscribe({
      next: (d) => {
        this.categoriasClienteObjs = d;
        this.categoriasCliente = d.map(x => x.nome);
      },
      error: () => {
        this.categoriasCliente = ['Varejo', 'Atacado', 'Corporativo', 'Enterprise', 'Varejo/Provedor', 'Distribuidor', 'Governo'];
      }
    });

    this.api.getOpcoesCategoria('enderecos').subscribe({
      next: (d) => {
        this.categoriasEnderecoObjs = d;
        this.categoriasEndereco = d.map(x => x.nome);
      },
      error: () => {
        this.categoriasEndereco = ['Comercial', 'Entrega', 'Cobranca', 'Residencial', 'Filial / Deposito'];
      }
    });

    this.api.getOpcoesCategoria('condicoes-pagamento').subscribe({
      next: (d) => {
        this.condicoesPagamentoObjs = d;
        this.condicoesPagamento = d.map(x => x.nome);
      },
      error: () => {
        this.condicoesPagamento = ['A Vista', '7 Dias', '14 Dias', '28 Dias', '30 Dias', '30 / 60 Dias', '30 / 60 / 90 Dias'];
      }
    });

    this.api.getOpcoesCategoria('formas-pagamento').subscribe({
      next: (d) => {
        this.formasPagamentoObjs = d;
        this.formasPagamento = d.map(x => x.nome);
      },
      error: () => {
        this.formasPagamento = ['PIX', 'Boleto Bancario', 'Transferencia / TED', 'Cartao de Credito', 'Cartao de Debito', 'Dinheiro', 'PIX e Boleto'];
      }
    });
  }

  // ---------- Pop-up da Engrenagem (Salvo no Banco de Dados) ----------
  abrirModalOpcoes(tipo: TipoListaOpcoes) {
    this.modalTipo = tipo;
    this.novoItemTexto = '';
    this.editandoIndex = null;
    this.editandoTexto = '';

    if (tipo === 'categoriaCliente') {
      this.modalTitulo = 'Categorias de Cliente (Tabela CategoriaClientes)';
      this.modalObjs = [...this.categoriasClienteObjs];
      this.modalItens = this.modalObjs.map(x => x.nome);
    } else if (tipo === 'categoriaEndereco') {
      this.modalTitulo = 'Categorias de Endereço (Tabela CategoriaEnderecos)';
      this.modalObjs = [...this.categoriasEnderecoObjs];
      this.modalItens = this.modalObjs.map(x => x.nome);
    } else if (tipo === 'condicaoPagamento') {
      this.modalTitulo = 'Condições de Pagamento (Tabela OpcoesCondicaoPagamento)';
      this.modalObjs = [...this.condicoesPagamentoObjs];
      this.modalItens = this.modalObjs.map(x => x.nome);
    } else if (tipo === 'formaPagamento') {
      this.modalTitulo = 'Formas de Pagamento Aceitas (Tabela OpcoesFormaPagamento)';
      this.modalObjs = [...this.formasPagamentoObjs];
      this.modalItens = this.modalObjs.map(x => x.nome);
    }

    this.modalAberto = true;
  }

  fecharModalOpcoes() {
    this.modalAberto = false;
    this.editandoIndex = null;
  }

  adicionarOpcaoModal() {
    const val = (this.novoItemTexto || '').trim();
    if (!val) return;
    if (this.modalItens.some(x => x.toLowerCase() === val.toLowerCase())) {
      this.novoItemTexto = '';
      return;
    }

    const rota = this.rotaPorTipo(this.modalTipo);
    this.api.addOpcaoCategoria(rota, val).subscribe({
      next: (criado) => {
        this.modalObjs.push(criado);
        this.modalItens = this.modalObjs.map(x => x.nome);
        this.sincronizarModalComLista(criado.nome);
        this.novoItemTexto = '';
      }
    });
  }

  iniciarEdicaoOpcao(idx: number) {
    this.editandoIndex = idx;
    this.editandoTexto = this.modalItens[idx];
  }

  salvarEdicaoOpcao(idx: number) {
    const novoVal = (this.editandoTexto || '').trim();
    if (!novoVal) return;
    const antigoVal = this.modalItens[idx];
    const obj = this.modalObjs[idx];
    const rota = this.rotaPorTipo(this.modalTipo);

    if (obj?.id) {
      this.api.updateOpcaoCategoria(rota, obj.id, novoVal).subscribe({
        next: (atualizado) => {
          this.modalObjs[idx] = atualizado;
          this.modalItens[idx] = atualizado.nome;
          this.editandoIndex = null;
          this.atualizarValorSelecionadoSeEditado(antigoVal, atualizado.nome);
          this.sincronizarModalComLista();
        }
      });
    }
  }

  cancelarEdicaoOpcao() {
    this.editandoIndex = null;
    this.editandoTexto = '';
  }

  removerOpcaoModal(idx: number) {
    const removido = this.modalItens[idx];
    const obj = this.modalObjs[idx];
    const rota = this.rotaPorTipo(this.modalTipo);

    if (obj?.id) {
      this.api.deleteOpcaoCategoria(rota, obj.id).subscribe({
        next: () => {
          this.modalObjs.splice(idx, 1);
          this.modalItens.splice(idx, 1);
          this.atualizarValorSelecionadoSeEditado(removido, '');
          this.sincronizarModalComLista();
        }
      });
    }
  }

  private atualizarValorSelecionadoSeEditado(antigo: string, novo: string) {
    if (this.modalTipo === 'categoriaCliente' && this.form.categoria === antigo) {
      this.form.categoria = novo;
    } else if (this.modalTipo === 'categoriaEndereco') {
      if (this.enderecoForm.categoria === antigo) this.enderecoForm.categoria = novo;
      this.enderecos.forEach(e => { if (e.categoria === antigo) e.categoria = novo; });
    } else if (this.modalTipo === 'condicaoPagamento' && this.form.condicaoPagamentoPadrao === antigo) {
      this.form.condicaoPagamentoPadrao = novo;
    } else if (this.modalTipo === 'formaPagamento' && this.form.formasPagamentoAceitas === antigo) {
      this.form.formasPagamentoAceitas = novo;
    }
  }

  private sincronizarModalComLista(selecionarNovo?: string) {
    if (this.modalTipo === 'categoriaCliente') {
      this.categoriasClienteObjs = [...this.modalObjs];
      this.categoriasCliente = [...this.modalItens];
      if (selecionarNovo) this.form.categoria = selecionarNovo;
    } else if (this.modalTipo === 'categoriaEndereco') {
      this.categoriasEnderecoObjs = [...this.modalObjs];
      this.categoriasEndereco = [...this.modalItens];
      if (selecionarNovo) this.enderecoForm.categoria = selecionarNovo;
    } else if (this.modalTipo === 'condicaoPagamento') {
      this.condicoesPagamentoObjs = [...this.modalObjs];
      this.condicoesPagamento = [...this.modalItens];
      if (selecionarNovo) this.form.condicaoPagamentoPadrao = selecionarNovo;
    } else if (this.modalTipo === 'formaPagamento') {
      this.formasPagamentoObjs = [...this.modalObjs];
      this.formasPagamento = [...this.modalItens];
      if (selecionarNovo) this.form.formasPagamentoAceitas = selecionarNovo;
    }
  }

  // ---------- Consulta rápida de CEP (ViaCEP) ----------
  buscarCep() {
    const cepLimpo = (this.enderecoForm.cep || '').replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      .then(r => r.json())
      .then(d => {
        if (!d.erro) {
          this.enderecoForm.logradouro = d.logradouro || this.enderecoForm.logradouro;
          this.enderecoForm.bairro = d.bairro || this.enderecoForm.bairro;
          this.enderecoForm.cidade = d.localidade || this.enderecoForm.cidade;
          this.enderecoForm.uf = d.uf || this.enderecoForm.uf;
          this.enderecoForm.codigoIbge = d.ibge || this.enderecoForm.codigoIbge;
        }
      })
      .catch(() => {});
  }

  // ---------- Salvar / Voltar ----------
  voltar() {
    this.router.navigate(['/clientes']);
  }

  salvar() {
    this.error = '';
    this.sucesso = '';

    if (!this.form.nome?.trim() || !this.form.cpfCnpj?.trim()) {
      this.error = 'Preencha os campos obrigatórios: Nome / Razão Social e CPF / CNPJ (na aba GERAL).';
      this.abaAtiva = 'geral';
      return;
    }

    // Se o usuário digitou um endereço nos campos da aba Endereço mas não clicou em "Adicionar Endereço", inclui automaticamente
    if (this.enderecoForm.logradouro?.trim() && this.enderecoForm.cidade?.trim() && this.enderecoForm.uf?.trim()) {
      this.salvarEnderecoNaLista();
    }

    this.form.enderecos = [...this.enderecos];

    this.salvando = true;
    if (this.clienteId) {
      this.api.updateCliente(this.clienteId, this.form).subscribe({
        next: () => {
          this.salvando = false;
          this.router.navigate(['/clientes']);
        },
        error: (err) => {
          this.salvando = false;
          this.error = err?.error?.detail || err?.error || 'Erro ao atualizar o cliente.';
        }
      });
    } else {
      this.api.createCliente(this.form).subscribe({
        next: () => {
          this.salvando = false;
          this.router.navigate(['/clientes']);
        },
        error: (err) => {
          this.salvando = false;
          this.error = err?.error?.detail || err?.error || 'Erro ao cadastrar o cliente.';
        }
      });
    }
  }
}
