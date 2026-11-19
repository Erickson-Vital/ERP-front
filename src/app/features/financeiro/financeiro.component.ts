import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import {
  ContaFinanceira, ContaFinanceiraCreate, BaixaCreate, ContaBancaria, ContaBancariaCreate,
  Cobranca, Conciliacao, ConciliacaoCreate
} from '../../core/models';
import { filtrarPor, paginar, totalPaginas } from '../../core/paginacao';

type Aba = 'receber' | 'pagar' | 'bancos' | 'cobrancas' | 'conciliacao';

@Component({
    selector: 'app-financeiro',
    imports: [CommonModule, FormsModule],
    templateUrl: './financeiro.component.html',
    styleUrl: './financeiro.component.css'
})
export class FinanceiroComponent implements OnInit {
  aba: Aba = 'receber';
  loading = false;
  error = '';
  sucesso = '';

  contas: ContaFinanceira[] = [];
  bancos: ContaBancaria[] = [];
  cobrancas: Cobranca[] = [];
  conciliacoes: Conciliacao[] = [];

  // Formulário de novo título
  formAberto = false;
  form: ContaFinanceiraCreate = this.blankConta();

  // Baixa
  baixando: ContaFinanceira | null = null;
  baixa: BaixaCreate = this.blankBaixa();

  // Novo banco
  formBanco = false;
  bancoNovo: ContaBancariaCreate = this.blankBanco();

  // Nova conciliação
  formConc = false;
  conc: ConciliacaoCreate = this.blankConc();

  // Cobrança
  cobrando: ContaFinanceira | null = null;

  formas = [
    { valor: 0, label: 'Indefinido' },
    { valor: 1, label: 'Dinheiro' },
    { valor: 2, label: 'PIX' },
    { valor: 3, label: 'Boleto' },
    { valor: 4, label: 'Transferência' },
    { valor: 5, label: 'Cartão de Crédito' },
    { valor: 6, label: 'Cartão de Débito' },
    { valor: 7, label: 'Cheque' },
    { valor: 99, label: 'Outro' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit() { this.carregarTudo(); }

  carregarTudo() {
    this.loading = true;
    this.error = '';
    this.api.getContasFinanceiras().subscribe({
      next: (d) => {
        this.contas = d;
        this.api.getContasBancarias().subscribe(b => this.bancos = b);
        this.api.getCobrancas().subscribe(c => this.cobrancas = c);
        this.api.getConciliacoes().subscribe(c => this.conciliacoes = c);
        this.loading = false;
      },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao carregar financeiro.'); this.loading = false; }
    });
  }

  // ---------- Helpers ----------
  blankConta(): ContaFinanceiraCreate {
    return {
      tipo: 1, descricao: '', valor: 0, vencimento: this.hojeISO(), formaPagamento: 0,
      contaBancariaId: null, pessoaId: null, pedidoId: null
    };
  }

  blankBaixa(): BaixaCreate {
    return { valor: 0, desconto: 0, juros: 0, formaPagamento: 2, contaBancariaId: null };
  }

  blankBanco(): ContaBancariaCreate {
    return { nome: '', banco: '', agencia: '', conta: '', digito: '', chavePix: '', tipo: 1, saldoInicial: 0 };
  }

  blankConc(): ConciliacaoCreate {
    return {
      contaBancariaId: '',
      dataInicio: this.primeiroDiaMes(),
      dataFim: this.hojeISO(),
      saldoExtratoInicial: 0,
      saldoExtratoFinal: 0
    };
  }

  hojeISO(): string { return new Date().toISOString().slice(0, 10); }
  primeiroDiaMes(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  }

  get receber(): ContaFinanceira[] { return this.contas.filter(c => c.tipo === 2); }
  get pagar(): ContaFinanceira[] { return this.contas.filter(c => c.tipo === 1); }
  get emAberto(): number { return this.contas.filter(c => c.status === 1).length; }

  // ---------- Filtros e paginação por aba ----------
  filtroContas = '';
  filtroStatusContas = 0; // 0 = todos, 1 = Aberta, 2 = Baixada, 3 = Cancelada
  paginaContas = 1;
  tamanhoContas = 10;

  get contasAba(): ContaFinanceira[] {
    let base = this.aba === 'receber' ? this.receber : this.pagar;
    if (this.filtroStatusContas > 0) base = base.filter(c => c.status === this.filtroStatusContas);
    return filtrarPor(base, this.filtroContas, [c => c.descricao, c => c.documento, c => c.pessoaNome, c => c.contaBancariaNome]);
  }
  get contasPaginadas(): ContaFinanceira[] { return paginar(this.contasAba, this.paginaContas, this.tamanhoContas); }
  get totalPaginasContas(): number { return totalPaginas(this.contasAba.length, this.tamanhoContas); }

  filtroBancos = ''; paginaBancos = 1;
  get bancosFiltrados(): ContaBancaria[] { return filtrarPor(this.bancos, this.filtroBancos, [b => b.nome, b => b.banco, b => b.agencia, b => b.conta, b => b.chavePix]); }
  get bancosPaginados(): ContaBancaria[] { return paginar(this.bancosFiltrados, this.paginaBancos, this.tamanhoContas); }
  get totalPaginasBancos(): number { return totalPaginas(this.bancosFiltrados.length, this.tamanhoContas); }

  filtroCobrancas = ''; paginaCobrancas = 1;
  get cobrancasFiltradas(): Cobranca[] { return filtrarPor(this.cobrancas, this.filtroCobrancas, [c => c.nossoNumero, c => c.linhaDigitavel, c => c.pixCopiaECola, c => (c.tipo === 1 ? 'boleto' : 'pix')]); }
  get cobrancasPaginadas(): Cobranca[] { return paginar(this.cobrancasFiltradas, this.paginaCobrancas, this.tamanhoContas); }
  get totalPaginasCobrancas(): number { return totalPaginas(this.cobrancasFiltradas.length, this.tamanhoContas); }

  filtroConc = ''; paginaConc = 1;
  get concFiltradas(): Conciliacao[] { return filtrarPor(this.conciliacoes, this.filtroConc, [c => c.contaBancariaNome, c => this.bancoNome(c.contaBancariaId)]); }
  get concPaginadas(): Conciliacao[] { return paginar(this.concFiltradas, this.paginaConc, this.tamanhoContas); }
  get totalPaginasConc(): number { return totalPaginas(this.concFiltradas.length, this.tamanhoContas); }

  onFiltroContas() { this.paginaContas = 1; }
  irPaginaContas(p: number) { if (p >= 1 && p <= this.totalPaginasContas) this.paginaContas = p; }
  onFiltroBancos() { this.paginaBancos = 1; }
  irPaginaBancos(p: number) { if (p >= 1 && p <= this.totalPaginasBancos) this.paginaBancos = p; }
  onFiltroCobrancas() { this.paginaCobrancas = 1; }
  irPaginaCobrancas(p: number) { if (p >= 1 && p <= this.totalPaginasCobrancas) this.paginaCobrancas = p; }
  onFiltroConc() { this.paginaConc = 1; }
  irPaginaConc(p: number) { if (p >= 1 && p <= this.totalPaginasConc) this.paginaConc = p; }

  sensiveis(aba: Aba) { this.aba = aba; this.error = ''; this.sucesso = ''; this.formAberto = false; this.filtroContas = ''; this.filtroStatusContas = 0; this.paginaContas = 1; }

  tipoLabel(t: number): string { return t === 2 ? 'Receber' : 'Pagar'; }
  statusLabel(s: number): string { return s === 1 ? 'Em aberto' : s === 2 ? 'Baixada' : 'Cancelada'; }
  statusClass(s: number): string { return s === 1 ? 'badge-orange' : s === 2 ? 'badge-green' : 'badge-red'; }
  formaLabel(f: number): string { return this.formas.find(x => x.valor === f)?.label ?? '—'; }

  totalAberto(lista: ContaFinanceira[]): number {
    return lista.filter(c => c.status === 1).reduce((acc, c) => acc + c.valorAberto, 0);
  }

  // ---------- Novo título ----------
  novoConta(tipo: number) {
    this.formAberto = true;
    this.form = this.blankConta();
    this.form.tipo = tipo;
    this.aba = tipo === 2 ? 'receber' : 'pagar';
    this.error = ''; this.sucesso = '';
  }

  salvarConta() {
    this.error = ''; this.sucesso = '';
    if (!this.form.descricao) { this.error = 'Informe a descrição.'; return; }
    if (!this.form.valor || this.form.valor <= 0) { this.error = 'Informe um valor maior que zero.'; return; }
    if (!this.form.vencimento) { this.error = 'Informe o vencimento.'; return; }

    const payload: ContaFinanceiraCreate = {
      ...this.form,
      contaBancariaId: this.form.contaBancariaId || null,
      pessoaId: this.form.pessoaId || null,
      pedidoId: this.form.pedidoId || null
    };

    this.api.createContaFinanceira(payload).subscribe({
      next: () => { this.sucesso = 'Título criado.'; this.formAberto = false; this.form = this.blankConta(); this.carregarTudo(); },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao criar título.'); }
    });
  }

  cancelarConta(c: ContaFinanceira) {
    if (!confirm(`Cancelar o título "${c.descricao}"?`)) return;
    this.api.cancelarContaFinanceira(c.id).subscribe({
      next: () => { this.sucesso = 'Título cancelado.'; this.carregarTudo(); },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao cancelar.'); }
    });
  }

  // ---------- Baixa ----------
  abrirBaixa(c: ContaFinanceira) {
    this.baixando = c;
    this.baixa = { valor: c.valorAberto, desconto: 0, juros: 0, formaPagamento: 2, contaBancariaId: c.contaBancariaId ?? null };
    this.error = ''; this.sucesso = '';
  }

  confirmarBaixa() {
    if (!this.baixando) return;
    this.error = ''; this.sucesso = '';
    if (!this.baixa.valor || this.baixa.valor <= 0) { this.error = 'Informe o valor da baixa.'; return; }

    const payload: BaixaCreate = { ...this.baixa, contaBancariaId: this.baixa.contaBancariaId || null };
    this.api.baixarConta(this.baixando.id, payload).subscribe({
      next: () => { this.sucesso = 'Baixa registrada.'; this.baixando = null; this.carregarTudo(); },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao baixar título.'); }
    });
  }

  // ---------- Bancos ----------
  novoBanco() { this.formBanco = true; this.bancoNovo = this.blankBanco(); this.error = ''; this.sucesso = ''; }

  salvarBanco() {
    if (!this.bancoNovo.nome) { this.error = 'Informe o nome da conta.'; return; }
    this.api.createContaBancaria(this.bancoNovo).subscribe({
      next: () => { this.sucesso = 'Conta bancária criada.'; this.formBanco = false; this.carregarTudo(); },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao criar conta bancária.'); }
    });
  }

  excluirBanco(b: ContaBancaria) {
    if (!confirm(`Excluir a conta bancária "${b.nome}"?`)) return;
    this.api.deleteContaBancaria(b.id).subscribe({
      next: () => { this.sucesso = 'Conta bancária removida.'; this.carregarTudo(); },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao excluir conta bancária.'); }
    });
  }

  // ---------- Boleto / PIX ----------
  abrirCobranca(c: ContaFinanceira, tipo: number) {
    this.cobrando = c;
    this.error = ''; this.sucesso = '';
    this.api.gerarCobranca({ contaFinanceiraId: c.id, tipo }).subscribe({
      next: (cob) => {
        this.sucesso = `Cobrança gerada (${tipo === 1 ? 'Boleto' : 'PIX'}).`;
        this.cobrando = null;
        this.aba = 'cobrancas';
        this.carregarTudo();
        this.ultimaCobranca = cob;
      },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao gerar cobrança.'); this.cobrando = null; }
    });
  }

  ultimaCobranca: Cobranca | null = null;

  copiar(texto?: string) {
    if (!texto) return;
    navigator.clipboard?.writeText(texto);
    this.sucesso = 'Copiado para a área de transferência.';
  }

  // ---------- Conciliação ----------
  novaConc() {
    this.formConc = true;
    this.conc = this.blankConc();
    if (this.bancos.length) this.conc.contaBancariaId = this.bancos[0].id;
    this.error = ''; this.sucesso = '';
  }

  criarConc() {
    this.error = ''; this.sucesso = '';
    if (!this.conc.contaBancariaId) { this.error = 'Selecione a conta bancária.'; return; }

    this.api.criarConciliacao(this.conc).subscribe({
      next: () => { this.sucesso = 'Conciliação criada.'; this.formConc = false; this.carregarTudo(); },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao criar conciliação.'); }
    });
  }

  fecharConc(c: Conciliacao) {
    if (!confirm('Fechar esta conciliação? Não será possível alterá-la depois.')) return;
    this.api.fecharConciliacao(c.id).subscribe({
      next: () => { this.sucesso = 'Conciliação fechada.'; this.carregarTudo(); },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao fechar conciliação.'); }
    });
  }

  bancoNome(id?: string): string {
    return this.bancos.find(b => b.id === id)?.nome ?? '—';
  }

  conciliado(c: Conciliacao): boolean {
    return Math.abs(c.diferenca) < 0.01;
  }
}
