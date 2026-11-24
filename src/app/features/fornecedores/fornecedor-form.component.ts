import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { EnderecoCliente, FornecedorCreate, OpcaoCategoria } from '../../core/models';

export type TipoListaFornecedorOpcoes = 'categoriaFornecedor' | 'categoriaEndereco';

@Component({
  selector: 'app-fornecedor-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './fornecedor-form.component.html',
  styleUrl: './fornecedor-form.component.css'
})
export class FornecedorFormComponent implements OnInit {
  abaAtiva: 'geral' | 'endereco' | 'fiscal' | 'pagamentos' | 'compras' = 'geral';
  fornecedorId: string | null = null;
  loading = false;
  salvando = false;
  error = '';
  sucesso = '';

  form: FornecedorCreate = this.blankForm();

  // Lista de múltiplos endereços do fornecedor e formulário de endereço atual
  enderecos: EnderecoCliente[] = [];
  enderecoForm: EnderecoCliente = this.blankEndereco();
  editandoEnderecoIndex: number | null = null;
  erroEndereco = '';

  // Listas de seleção carregadas das tabelas dedicadas do SQL Server
  categoriasFornecedorObjs: OpcaoCategoria[] = [];
  categoriasEnderecoObjs: OpcaoCategoria[] = [];
  categoriasFornecedor: string[] = [];
  categoriasEndereco: string[] = [];

  // Estado do Pop-up (Modal da Engrenagem)
  modalAberto = false;
  modalTipo: TipoListaFornecedorOpcoes = 'categoriaFornecedor';
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
    this.fornecedorId = this.route.snapshot.paramMap.get('id');
    if (this.fornecedorId) {
      this.carregarFornecedor(this.fornecedorId);
    }
  }

  blankForm(): FornecedorCreate {
    return {
      nome: '',
      cpfCnpj: '',
      codigoFornecedor: '',
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

      // 03 — Fiscal
      inscricaoMunicipal: '',
      regimeTributario: '',
      indicadorIE: 'Contribuinte ICMS',
      configuracoesRetencao: '',

      // 04 — Pagamentos
      condicoesAcordadas: '',
      formasPagamentoFornecedor: '',
      contasBancariasTexto: '',
      chavePixFornecedor: '',

      // 05 — Compras
      prazoEntregaPadrao: '',
      pedidoMinimo: 0,
      frete: 'CIF (Por conta do Fornecedor)',
      contatosComerciais: ''
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

  get fornecedorAtivo(): boolean {
    return (this.form.desativado ?? 0) === 0;
  }

  set fornecedorAtivo(val: boolean) {
    this.form.desativado = val ? 0 : 1;
    this.form.status = val ? 1 : 2;
  }

  onStatusChange(novoDesativado: number) {
    this.error = '';
    this.sucesso = '';
    this.form.desativado = Number(novoDesativado) === 1 ? 1 : 0;
    this.form.status = this.form.desativado === 1 ? 2 : 1;

    if (this.fornecedorId) {
      this.api.alterarStatusFornecedor(this.fornecedorId, this.form.desativado).subscribe({
        next: (f) => {
          this.form.desativado = f.desativado ?? this.form.desativado;
          this.form.status = f.status ?? (this.form.desativado === 1 ? 2 : 1);
          this.sucesso = this.form.desativado === 1
            ? 'Fornecedor desativado com sucesso!'
            : 'Fornecedor ativado com sucesso!';
        },
        error: () => {
          this.error = 'Erro ao atualizar o status do fornecedor no servidor.';
        }
      });
    }
  }

  alternarAtivoFornecedor() {
    const novo = this.fornecedorAtivo ? 1 : 0;
    this.onStatusChange(novo);
  }

  carregarFornecedor(id: string) {
    this.loading = true;
    this.api.getFornecedor(id).subscribe({
      next: (f) => {
        this.form = {
          nome: f.nome ?? '',
          cpfCnpj: f.cpfCnpj ?? '',
          codigoFornecedor: f.codigoFornecedor ?? '',
          inscricaoEstadual: f.inscricaoEstadual ?? '',
          emailPrincipal: f.emailPrincipal ?? '',
          telefonePrincipal: f.telefonePrincipal ?? '',
          celular: f.celular ?? '',
          isentoIE: !!f.isentoIE,
          desativado: f.desativado ?? (f.status === 2 ? 1 : 0),
          status: (f.desativado === 1 || f.status === 2) ? 2 : 1,
          categoria: f.categoria ?? '',
          observacoes: f.observacoes ?? '',

          inscricaoMunicipal: f.inscricaoMunicipal ?? '',
          regimeTributario: f.regimeTributario ?? '',
          indicadorIE: f.indicadorIE || (f.isentoIE ? 'Contribuinte Isento' : 'Contribuinte ICMS'),
          configuracoesRetencao: f.configuracoesRetencao ?? '',

          condicoesAcordadas: f.condicoesAcordadas ?? '',
          formasPagamentoFornecedor: f.formasPagamentoFornecedor ?? '',
          contasBancariasTexto: f.contasBancariasTexto ?? '',
          chavePixFornecedor: f.chavePixFornecedor ?? '',

          prazoEntregaPadrao: f.prazoEntregaPadrao ?? '',
          pedidoMinimo: f.pedidoMinimo ?? 0,
          frete: f.frete || 'CIF (Por conta do Fornecedor)',
          contatosComerciais: f.contatosComerciais ?? ''
        };

        if (f.enderecos && f.enderecos.length > 0) {
          this.enderecos = f.enderecos.map(e => ({
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
        } else if (f.logradouro || f.cidade) {
          this.enderecos = [{
            cep: f.cep ?? '',
            pais: f.pais || 'Brasil',
            uf: f.uf ?? '',
            cidade: f.cidade ?? '',
            codigoIbge: f.codigoIbge ?? '',
            logradouro: f.logradouro ?? '',
            numero: f.numero ?? '',
            bairro: f.bairro ?? '',
            complemento: f.complemento ?? '',
            categoria: f.categoriaEndereco || 'Comercial',
            principal: f.enderecoPrincipal ?? true
          }];
        } else {
          this.enderecos = [];
        }

        this.enderecoForm = this.blankEndereco();

        this.garantirValorNaLista(this.categoriasFornecedor, this.form.categoria, 'erp_opcoes_cat_fornecedor');
        for (const e of this.enderecos) {
          this.garantirValorNaLista(this.categoriasEndereco, e.categoria, 'erp_opcoes_cat_endereco');
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar os dados do fornecedor.';
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

  private rotaPorTipo(tipo: TipoListaFornecedorOpcoes): string {
    return tipo === 'categoriaFornecedor' ? 'fornecedores' : 'enderecos';
  }

  private garantirValorNaLista(lista: string[], valor: string | undefined, _chaveStorage: string) {
    if (valor && !lista.includes(valor)) {
      lista.push(valor);
    }
  }

  carregarListasOpcoes() {
    this.api.getOpcoesCategoria('fornecedores').subscribe({
      next: (d) => {
        this.categoriasFornecedorObjs = d;
        this.categoriasFornecedor = d.map(x => x.nome);
      },
      error: () => {
        this.categoriasFornecedor = [
          'Materia-Prima',
          'Equipamentos de Rede',
          'Componentes e Fixacao',
          'Embalagens',
          'Servicos / Terceirizacao',
          'Logistica e Transporte',
          'Insumos Industriais'
        ];
      }
    });

    this.api.getOpcoesCategoria('enderecos').subscribe({
      next: (d) => {
        this.categoriasEnderecoObjs = d;
        this.categoriasEndereco = d.map(x => x.nome);
      },
      error: () => {
        this.categoriasEndereco = [
          'Comercial',
          'Entrega',
          'Cobranca',
          'Residencial',
          'Filial / Deposito'
        ];
      }
    });
  }

  // ---------- Pop-up da Engrenagem (Salvo no Banco de Dados) ----------
  abrirModalOpcoes(tipo: TipoListaFornecedorOpcoes) {
    this.modalTipo = tipo;
    this.novoItemTexto = '';
    this.editandoIndex = null;
    this.editandoTexto = '';

    if (tipo === 'categoriaFornecedor') {
      this.modalTitulo = 'Categorias de Fornecedor (Tabela CategoriaFornecedores)';
      this.modalObjs = [...this.categoriasFornecedorObjs];
      this.modalItens = this.modalObjs.map(x => x.nome);
    } else if (tipo === 'categoriaEndereco') {
      this.modalTitulo = 'Categorias de Endereço (Tabela CategoriaEnderecos)';
      this.modalObjs = [...this.categoriasEnderecoObjs];
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
    if (this.modalTipo === 'categoriaFornecedor' && this.form.categoria === antigo) {
      this.form.categoria = novo;
    } else if (this.modalTipo === 'categoriaEndereco') {
      if (this.enderecoForm.categoria === antigo) this.enderecoForm.categoria = novo;
      this.enderecos.forEach(e => { if (e.categoria === antigo) e.categoria = novo; });
    }
  }

  private sincronizarModalComLista(selecionarNovo?: string) {
    if (this.modalTipo === 'categoriaFornecedor') {
      this.categoriasFornecedorObjs = [...this.modalObjs];
      this.categoriasFornecedor = [...this.modalItens];
      if (selecionarNovo) this.form.categoria = selecionarNovo;
    } else if (this.modalTipo === 'categoriaEndereco') {
      this.categoriasEnderecoObjs = [...this.modalObjs];
      this.categoriasEndereco = [...this.modalItens];
      if (selecionarNovo) this.enderecoForm.categoria = selecionarNovo;
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

  voltar() {
    this.router.navigate(['/fornecedores']);
  }

  salvar() {
    this.error = '';
    this.sucesso = '';

    if (!this.form.nome?.trim() || !this.form.cpfCnpj?.trim()) {
      this.error = 'Preencha os campos obrigatórios: Nome / Razão Social e CPF / CNPJ (na aba 01 — Geral).';
      this.abaAtiva = 'geral';
      return;
    }

    if (this.enderecoForm.logradouro?.trim() && this.enderecoForm.cidade?.trim() && this.enderecoForm.uf?.trim()) {
      this.salvarEnderecoNaLista();
    }

    this.form.enderecos = [...this.enderecos];
    this.form.isentoIE = this.form.indicadorIE === 'Contribuinte Isento';

    this.salvando = true;
    if (this.fornecedorId) {
      this.api.updateFornecedor(this.fornecedorId, this.form).subscribe({
        next: () => {
          this.salvando = false;
          this.router.navigate(['/fornecedores']);
        },
        error: (err) => {
          this.salvando = false;
          this.error = err?.error?.detail || err?.error || 'Erro ao atualizar o fornecedor.';
        }
      });
    } else {
      this.api.createFornecedor(this.form).subscribe({
        next: () => {
          this.salvando = false;
          this.router.navigate(['/fornecedores']);
        },
        error: (err) => {
          this.salvando = false;
          this.error = err?.error?.detail || err?.error || 'Erro ao cadastrar o fornecedor.';
        }
      });
    }
  }
}
