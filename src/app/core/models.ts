export interface EnderecoCliente {
  id?: string;
  cep?: string;
  pais?: string;
  uf?: string;
  cidade?: string;
  codigoIbge?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  categoria?: string;
  principal?: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  inscricaoEstadual?: string;
  emailPrincipal?: string;
  telefonePrincipal?: string;
  celular?: string;
  isentoIE: boolean;
  status: number;
  codigoCliente: string;
  limiteCredito: number;
  scoreCredito: number;
  categoria?: string;
  observacoes?: string;

  // Lista de Endereços (1:N)
  enderecos?: EnderecoCliente[];

  // Endereço
  cep?: string;
  pais?: string;
  uf?: string;
  cidade?: string;
  codigoIbge?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  categoriaEndereco?: string;
  enderecoPrincipal?: boolean;

  // Fiscal
  inscricaoEstadualProdutorRural?: string;
  informacoesZonaFranca?: string;
  regimeFiscal?: string;

  // Pagamentos
  condicaoPagamentoPadrao?: string;
  prazoMaximoDias?: number;
  formasPagamentoAceitas?: string;
  observacoesPagamento?: string;

  dataCadastro: string;
}

export interface ClienteCreate {
  nome: string;
  cpfCnpj: string;
  inscricaoEstadual?: string;
  emailPrincipal?: string;
  telefonePrincipal?: string;
  celular?: string;
  isentoIE: boolean;
  status?: number;
  codigoCliente: string;
  limiteCredito: number;
  categoria?: string;
  observacoes?: string;

  // Lista de Endereços (1:N)
  enderecos?: EnderecoCliente[];

  // Endereço
  cep?: string;
  pais?: string;
  uf?: string;
  cidade?: string;
  codigoIbge?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  categoriaEndereco?: string;
  enderecoPrincipal?: boolean;

  // Fiscal
  inscricaoEstadualProdutorRural?: string;
  informacoesZonaFranca?: string;
  regimeFiscal?: string;

  // Pagamentos
  condicaoPagamentoPadrao?: string;
  prazoMaximoDias?: number;
  formasPagamentoAceitas?: string;
  observacoesPagamento?: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  cpfCnpj: string;
  inscricaoEstadual?: string;
  emailPrincipal?: string;
  telefonePrincipal?: string;
  isentoIE: boolean;
  status: number;
  codigoFornecedor: string;
  prazoEntregaPadrao?: string;
  categoria?: string;
  dataCadastro: string;
}

export interface FornecedorCreate {
  nome: string;
  cpfCnpj: string;
  inscricaoEstadual?: string;
  emailPrincipal?: string;
  telefonePrincipal?: string;
  isentoIE: boolean;
  codigoFornecedor: string;
  prazoEntregaPadrao?: string;
  categoria?: string;
}

export interface Produto {
  id: string;
  codigo: string;
  codigoBarras?: string;
  descricao: string;
  tipo: number;
  ncm?: string;
  cest?: string;
  cfop?: string;
  precoVendaPadrao: number;
  precoCustoMedio: number;
  ativo: boolean;
  unidadeMedidaId: string;
  unidadeMedidaSigla?: string;
  familiaProdutoId: string;
  familiaProdutoNome?: string;
  ehKit: boolean;
  custoMateriais: number;
  custoProcessos: number;
  custoCalculado: number;
  qtdComponentes: number;
  qtdProcessos: number;
  margemPercentual?: number | null;
}

export interface ProdutoCreate {
  codigo: string;
  codigoBarras?: string;
  descricao: string;
  tipo: number;
  ncm?: string;
  cest?: string;
  cfop?: string;
  precoVendaPadrao: number;
  precoCustoMedio: number;
  ativo: boolean;
  unidadeMedidaId: string | null;
  familiaProdutoId: string | null;
}

export interface UnidadeMedida {
  id: string;
  sigla: string;
  descricao: string;
  fatorPadrao: number;
}

export interface FamiliaProduto {
  id: string;
  nome: string;
}

export interface Armazem {
  id: string;
  nome: string;
  endereco?: string;
  responsavel?: string;
  ativo: boolean;
  materiaisEmEmergencia: number;
  totalItens: number;
}

export interface ArmazemCreate {
  nome: string;
  endereco?: string;
  responsavel?: string;
  ativo: boolean;
}

export interface EstoqueProduto {
  id: string;
  produtoId: string;
  produtoCodigo?: string;
  produtoDescricao?: string;
  armazemId: string;
  armazemNome?: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  quantidadeMaxima: number;
  quantidadeEmergencia: number;
  emEmergencia: boolean;
  negativo: boolean;
}

/** Quantidade de emergência por material/armazém. */
export interface DefinirEmergencia {
  produtoId: string;
  armazemId: string;
  quantidadeEmergencia: number;
}

/** Item da tabela de materiais em estado de emergência. */
export interface EstoqueEmergencia {
  estoqueProdutoId: string;
  produtoId: string;
  produtoCodigo?: string;
  produtoDescricao?: string;
  armazemNome?: string;
  quantidadeAtual: number;
  quantidadeEmergencia: number;
  faltaParaSair: number;
  percentualEmergencia: number;
}

/** Resultado paginado genérico devolvido pelo backend. */
export interface PaginaResult<T> {
  itens: T[];
  pagina: number;
  tamanhoPagina: number;
  totalItens: number;
  totalPaginas: number;
  temAnterior: boolean;
  temProxima: boolean;
}

/** Resumo de um kit na tela de BOM. */
export interface BomResumo {
  produtoId: string;
  codigo: string;
  descricao: string;
  precoVenda: number;
  qtdComponentes: number;
  qtdProcessos: number;
  custoMateriais: number;
  custoProcessos: number;
  custoTotal: number;
  margemPercentual?: number | null;
}

export interface KitOpcao {
  id: string;
  codigo: string;
  descricao: string;
  precoVenda: number;
}

export interface MovimentacaoCreate {
  produtoId: string;
  armazemId: string;
  tipo: number;
  quantidade: number;
  observacao?: string;
}

export interface ItemPedido {
  produtoId: string;
  unidadeMedidaId: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
}

export interface ItemPedidoResponse {
  id: string;
  produtoId: string;
  produtoDescricao?: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  total: number;
}

export interface PedidoVenda {
  id: string;
  numero: string;
  dataEmissao: string;
  status: number;
  totalBruto: number;
  totalLiquido: number;
  clienteId: string;
  clienteNome?: string;
  itens: ItemPedidoResponse[];
}

export interface PedidoVendaCreate {
  clienteId: string;
  itens: ItemPedido[];
}

export interface PedidoCompra {
  id: string;
  numero: string;
  dataEmissao: string;
  status: number;
  totalBruto: number;
  totalLiquido: number;
  fornecedorId: string;
  fornecedorNome?: string;
  itens: ItemPedidoResponse[];
}

export interface PedidoCompraCreate {
  fornecedorId: string;
  itens: ItemPedido[];
}

// ---------- Segurança ----------
export interface Sessao {
  token: string;
  usuarioId: string;
  nome: string;
  login: string;
  isAdmin: boolean;
  menus: string[];
}

export interface Usuario {
  id: string;
  nome: string;
  login: string;
  ativo: boolean;
  isAdmin: boolean;
  ultimoAcesso?: string;
  menus: string[];
  dataCadastro: string;
}

export interface UsuarioCreate {
  nome: string;
  login: string;
  senha: string;
  ativo: boolean;
  isAdmin: boolean;
  menus: string[];
}

export interface UsuarioUpdate {
  nome: string;
  login: string;
  senha?: string | null;
  ativo: boolean;
  isAdmin: boolean;
  menus: string[];
}

export interface Auditoria {
  id: string;
  usuarioNome?: string;
  usuarioLogin?: string;
  acao: string;
  menu?: string;
  entidade?: string;
  entidadeId?: string;
  detalhes?: string;
  ip?: string;
  data: string;
}

export interface ComponenteFalta {
  componenteId: string;
  descricao?: string;
  quantidadeNecessaria: number;
  quantidadeDisponivel: number;
  suficiente: boolean;
}

export interface VerificacaoEstoque {
  produtoId: string;
  produtoDescricao?: string;
  quantidadeSolicitada: number;
  quantidadeDisponivel: number;
  suficiente: boolean;
  ehKit: boolean;
  componentes: ComponenteFalta[];
}

// ---------- Produção: Processos e Composição de Kit ----------
export interface Processo {
  id: string;
  nome: string;
  descricao?: string;
  valorHora: number;
  ativo: boolean;
}

export interface ProcessoCreate {
  nome: string;
  descricao?: string;
  valorHora: number;
  ativo: boolean;
}

export interface ProdutoComposicao {
  id: string;
  produtoId: string;
  componenteId: string;
  componenteDescricao?: string;
  componenteCodigo?: string;
  componenteUnidade?: string;
  quantidade: number;
  custoUnitario: number;
  custoTotal: number;
  estoqueDisponivel: number;
  kitsPossiveis?: number | null;
}

export interface ProdutoProcesso {
  id: string;
  produtoId: string;
  processoId: string;
  processoNome?: string;
  valorHora: number;
  horas: number;
  custoTotal: number;
}

export interface ComposicaoKit {
  produtoId: string;
  produtoDescricao?: string;
  precoVenda: number;
  componentes: ProdutoComposicao[];
  processos: ProdutoProcesso[];
  custoMateriais: number;
  custoProcessos: number;
  custoTotal: number;
  margemPercentual?: number | null;
  kitsPossiveis?: number | null;
}

export interface MovimentacaoEstoque {
  id: string;
  tipo: number;
  quantidade: number;
  dataMovimentacao: string;
  observacao?: string;
  produtoDescricao?: string;
  armazemNome?: string;
}

// ---------- Financeiro ----------
export interface ContaBancaria {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  digito?: string;
  chavePix?: string;
  tipo: number;
  saldoInicial: number;
  saldoAtual: number;
  ativa: boolean;
}

export interface ContaBancariaCreate {
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  digito?: string;
  chavePix?: string;
  tipo: number;
  saldoInicial: number;
}

export interface BaixaFinanceira {
  id: string;
  contaFinanceiraId: string;
  valor: number;
  desconto: number;
  juros: number;
  dataBaixa: string;
  formaPagamento: number;
  observacao?: string;
  contaBancariaId?: string;
  contaBancariaNome?: string;
}

export interface ContaFinanceira {
  id: string;
  tipo: number;         // 1 = Pagar, 2 = Receber
  status: number;       // 1 = EmAberto, 2 = Baixada, 3 = Cancelada
  descricao: string;
  documento?: string;
  valor: number;
  valorPago: number;
  valorAberto: number;
  dataEmissao: string;
  vencimento: string;
  dataPagamento?: string;
  formaPagamento: number;
  observacao?: string;
  pessoaId?: string;
  pessoaNome?: string;
  pedidoId?: string;
  contaBancariaId?: string;
  contaBancariaNome?: string;
  vencida: boolean;
  baixas: BaixaFinanceira[];
}

export interface ContaFinanceiraCreate {
  tipo: number;
  descricao: string;
  documento?: string;
  valor: number;
  dataEmissao?: string;
  vencimento: string;
  formaPagamento: number;
  observacao?: string;
  pessoaId?: string | null;
  pedidoId?: string | null;
  contaBancariaId?: string | null;
}

export interface BaixaCreate {
  valor: number;
  desconto: number;
  juros: number;
  dataBaixa?: string;
  formaPagamento: number;
  observacao?: string;
  contaBancariaId?: string | null;
}

export interface Cobranca {
  id: string;
  contaFinanceiraId: string;
  tipo: number;         // 1 = Boleto, 2 = PIX
  nossoNumero?: string;
  linhaDigitavel?: string;
  codigoBarras?: string;
  pixCopiaECola?: string;
  vencimento?: string;
  valor: number;
  pago: boolean;
  dataPagamento?: string;
  dataCadastro: string;
}

export interface CobrancaCreate {
  contaFinanceiraId: string;
  tipo: number;
  nossoNumero?: string;
  valor?: number;
  observacao?: string;
}

export interface Conciliacao {
  id: string;
  contaBancariaId: string;
  contaBancariaNome?: string;
  dataInicio: string;
  dataFim: string;
  saldoExtratoInicial: number;
  saldoExtratoFinal: number;
  saldoSistema: number;
  diferenca: number;
  fechada: boolean;
  dataFechamento?: string;
  observacao?: string;
  totalItens: number;
  itensConferidos: number;
}

export interface ConciliacaoCreate {
  contaBancariaId: string;
  dataInicio: string;
  dataFim: string;
  saldoExtratoInicial: number;
  saldoExtratoFinal: number;
  observacao?: string;
}

// ---------- Dashboard ----------
export interface Dashboard {
  financeiro: FinanceiroResumo;
  vendas: VendasResumo;
  estoque: EstoqueResumo;
  vendasPorMes: SerieMensal[];
  comprasPorMes: SerieMensal[];
  produtosAbaixoMinimo: ProdutoAlerta[];
  proximosVencimentos: ContaFinanceira[];
}

export interface FinanceiroResumo {
  aReceberAberto: number;
  aPagarAberto: number;
  aReceberVencido: number;
  aPagarVencido: number;
  recebidoNoMes: number;
  pagoNoMes: number;
  saldoContas: number;
  saldoPrevisto: number;
}

export interface VendasResumo {
  pedidosAbertos: number;
  pedidosFaturados: number;
  totalFaturadoMes: number;
  ticketMedio: number;
  totalPedidos: number;
}

export interface EstoqueResumo {
  totalProdutos: number;
  valorTotalEstoque: number;
  itensAbaixoMinimo: number;
  movimentacoesHoje: number;
}

export interface SerieMensal {
  mes: string;
  valor: number;
}

export interface ProdutoAlerta {
  produtoId: string;
  produtoDescricao?: string;
  armazemNome?: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
}
