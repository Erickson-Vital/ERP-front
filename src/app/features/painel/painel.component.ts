import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Dashboard } from '../../core/models';

@Component({
    selector: 'app-painel',
    imports: [CommonModule, RouterLink],
    template: `
    <div *ngIf="error" class="alert alert-error">{{ error }}</div>

    <div *ngIf="loading" class="empty">Carregando indicadores...</div>

    <ng-container *ngIf="!loading && d">
      <!-- Cartões principais -->
      <div class="kpi-grid">
        <div class="kpi kpi-blue">
          <span class="kpi-icon">💰</span>
          <div>
            <span class="kpi-label">A Receber (em aberto)</span>
            <strong class="kpi-valor">{{ d.financeiro.aReceberAberto | currency:'BRL' }}</strong>
          </div>
        </div>
        <div class="kpi kpi-red">
          <span class="kpi-icon">💸</span>
          <div>
            <span class="kpi-label">A Pagar (em aberto)</span>
            <strong class="kpi-valor">{{ d.financeiro.aPagarAberto | currency:'BRL' }}</strong>
          </div>
        </div>
        <div class="kpi" [ngClass]="d.financeiro.saldoPrevisto >= 0 ? 'kpi-green' : 'kpi-red'">
          <span class="kpi-icon">⚖️</span>
          <div>
            <span class="kpi-label">Saldo Previsto</span>
            <strong class="kpi-valor">{{ d.financeiro.saldoPrevisto | currency:'BRL' }}</strong>
          </div>
        </div>
        <div class="kpi kpi-purple">
          <span class="kpi-icon">🏦</span>
          <div>
            <span class="kpi-label">Saldo em Contas</span>
            <strong class="kpi-valor">{{ d.financeiro.saldoContas | currency:'BRL' }}</strong>
          </div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi kpi-green">
          <span class="kpi-icon">🧾</span>
          <div>
            <span class="kpi-label">Faturado no Mês</span>
            <strong class="kpi-valor">{{ d.vendas.totalFaturadoMes | currency:'BRL' }}</strong>
          </div>
        </div>
        <div class="kpi kpi-orange">
          <span class="kpi-icon">📦</span>
          <div>
            <span class="kpi-label">Valor em Estoque</span>
            <strong class="kpi-valor">{{ d.estoque.valorTotalEstoque | currency:'BRL' }}</strong>
          </div>
        </div>
        <div class="kpi kpi-blue">
          <span class="kpi-icon">🎯</span>
          <div>
            <span class="kpi-label">Ticket Médio</span>
            <strong class="kpi-valor">{{ d.vendas.ticketMedio | currency:'BRL' }}</strong>
          </div>
        </div>
        <div class="kpi" [ngClass]="d.estoque.itensAbaixoMinimo > 0 ? 'kpi-red' : 'kpi-green'">
          <span class="kpi-icon">⚠️</span>
          <div>
            <span class="kpi-label">Itens Abaixo do Mínimo</span>
            <strong class="kpi-valor">{{ d.estoque.itensAbaixoMinimo }}</strong>
          </div>
        </div>
      </div>

      <!-- Painéis de detalhe -->
      <div class="painel-grid">
        <!-- Vendas -->
        <div class="card">
          <div class="card-header"><h2>🧾 Vendas</h2></div>
          <div class="mini-stats">
            <div><span class="ml">Total de pedidos</span><strong>{{ d.vendas.totalPedidos }}</strong></div>
            <div><span class="ml">Em aberto</span><strong>{{ d.vendas.pedidosAbertos }}</strong></div>
            <div><span class="ml">Faturados</span><strong>{{ d.vendas.pedidosFaturados }}</strong></div>
          </div>
          <div class="chart" *ngIf="d.vendasPorMes.length">
            <div class="chart-row" *ngFor="let s of d.vendasPorMes">
              <span class="chart-label">{{ s.mes }}</span>
              <div class="chart-track">
                <div class="chart-bar bar-venda" [style.width.%]="largura(s.valor, maxVenda())"></div>
              </div>
              <span class="chart-valor">{{ s.valor | currency:'BRL' }}</span>
            </div>
          </div>
        </div>

        <!-- Estoque -->
        <div class="card">
          <div class="card-header"><h2>🏬 Estoque</h2></div>
          <div class="mini-stats">
            <div><span class="ml">Produtos cadastrados</span><strong>{{ d.estoque.totalProdutos }}</strong></div>
            <div><span class="ml">Movimentações hoje</span><strong>{{ d.estoque.movimentacoesHoje }}</strong></div>
            <div><span class="ml">Abaixo do mínimo</span><strong>{{ d.estoque.itensAbaixoMinimo }}</strong></div>
          </div>

          <h4 *ngIf="d.produtosAbaixoMinimo.length">Produtos abaixo do mínimo</h4>
          <table class="table" *ngIf="d.produtosAbaixoMinimo.length">
            <thead>
              <tr><th>Produto</th><th>Armazém</th><th>Atual</th><th>Mín.</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of d.produtosAbaixoMinimo">
                <td>{{ p.produtoDescricao || '—' }}</td>
                <td>{{ p.armazemNome || '—' }}</td>
                <td class="num-red">{{ p.quantidadeAtual | number:'1.0-2' }}</td>
                <td>{{ p.quantidadeMinima | number:'1.0-2' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="empty" *ngIf="!d.produtosAbaixoMinimo.length">Todos os produtos acima do mínimo. 👍</div>
        </div>
      </div>

      <div class="painel-grid">
        <!-- Financeiro -->
        <div class="card">
          <div class="card-header"><h2>💰 Financeiro</h2></div>
          <div class="mini-stats">
            <div><span class="ml">Recebido no mês</span><strong class="num-green">{{ d.financeiro.recebidoNoMes | currency:'BRL' }}</strong></div>
            <div><span class="ml">Pago no mês</span><strong class="num-red">{{ d.financeiro.pagoNoMes | currency:'BRL' }}</strong></div>
            <div><span class="ml">A receber vencido</span><strong class="num-red">{{ d.financeiro.aReceberVencido | currency:'BRL' }}</strong></div>
            <div><span class="ml">A pagar vencido</span><strong class="num-red">{{ d.financeiro.aPagarVencido | currency:'BRL' }}</strong></div>
          </div>

          <div class="chart" *ngIf="d.comprasPorMes.length">
            <div class="chart-row" *ngFor="let s of d.comprasPorMes">
              <span class="chart-label">{{ s.mes }}</span>
              <div class="chart-track">
                <div class="chart-bar bar-compra" [style.width.%]="largura(s.valor, maxCompra())"></div>
              </div>
              <span class="chart-valor">{{ s.valor | currency:'BRL' }}</span>
            </div>
          </div>
        </div>

        <!-- Próximos vencimentos -->
        <div class="card">
          <div class="card-header"><h2>⏰ Próximos Vencimentos</h2></div>
          <div class="empty" *ngIf="!d.proximosVencimentos.length">Nenhum título nos próximos 15 dias.</div>
          <table class="table" *ngIf="d.proximosVencimentos.length">
            <thead>
              <tr><th>Descrição</th><th>Tipo</th><th>Vencimento</th><th>Valor</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of d.proximosVencimentos">
                <td>{{ c.descricao }}</td>
                <td>
                  <span class="badge" [ngClass]="c.tipo === 2 ? 'badge-blue' : 'badge-orange'">
                    {{ c.tipo === 2 ? 'Receber' : 'Pagar' }}
                  </span>
                </td>
                <td>
                  <span [ngClass]="c.vencida ? 'num-red' : ''">{{ c.vencimento | date:'dd/MM/yyyy' }}</span>
                </td>
                <td>{{ c.valorAberto | currency:'BRL' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ng-container>
  `,
    styles: [`
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .kpi {
      background: #fff;
      border-radius: 12px;
      padding: 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border-left: 4px solid #e2e8f0;
    }
    .kpi-icon { font-size: 26px; }
    .kpi-label { display: block; font-size: 12px; color: #64748b; }
    .kpi-valor { font-size: 20px; color: #1e293b; }
    .kpi-blue { border-left-color: #2563eb; }
    .kpi-green { border-left-color: #16a34a; }
    .kpi-red { border-left-color: #dc2626; }
    .kpi-orange { border-left-color: #ea580c; }
    .kpi-purple { border-left-color: #7c3aed; }

    .painel-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
      gap: 20px;
    }

    .mini-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .mini-stats > div {
      background: #f8fafc;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .ml { font-size: 12px; color: #64748b; }
    .mini-stats strong { font-size: 17px; color: #1e293b; }
    .num-green { color: #16a34a !important; }
    .num-red { color: #dc2626 !important; }

    .chart { display: flex; flex-direction: column; gap: 8px; }
    .chart-row { display: flex; align-items: center; gap: 10px; }
    .chart-label { width: 62px; font-size: 12px; color: #64748b; }
    .chart-track { flex: 1; background: #f1f5f9; border-radius: 6px; height: 18px; overflow: hidden; }
    .chart-bar { height: 100%; border-radius: 6px; transition: width 0.3s; min-width: 2px; }
    .bar-venda { background: #2563eb; }
    .bar-compra { background: #ea580c; }
    .chart-valor { width: 110px; text-align: right; font-size: 12px; color: #475569; }

    h4 { margin: 16px 0 8px; font-size: 14px; color: #475569; }
  `]
})
export class PainelComponent implements OnInit {
  d: Dashboard | null = null;
  loading = true;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getDashboard().subscribe({
      next: (d) => { this.d = d; this.loading = false; },
      error: () => { this.error = 'Erro ao carregar indicadores.'; this.loading = false; }
    });
  }

  maxVenda(): number { return Math.max(1, ...(this.d?.vendasPorMes ?? []).map(s => s.valor)); }
  maxCompra(): number { return Math.max(1, ...(this.d?.comprasPorMes ?? []).map(s => s.valor)); }

  largura(valor: number, max: number): number {
    return valor <= 0 ? 0 : Math.max(2, (valor / max) * 100);
  }
}
