import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import { Processo, ProcessoCreate } from '../../core/models';

@Component({
  selector: 'app-processos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h2>{{ editando ? 'Editar Processo' : 'Novo Processo' }}</h2>
      </div>

      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      <div *ngIf="sucesso" class="alert alert-success">{{ sucesso }}</div>

      <div class="form-grid">
        <div class="form-group">
          <label>Nome *</label>
          <input [(ngModel)]="form.nome" placeholder="Montagem, Pintura, Corte..." />
        </div>
        <div class="form-group">
          <label>Valor por Hora (R$) *</label>
          <input [(ngModel)]="form.valorHora" type="number" step="0.01" min="0" />
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <input [(ngModel)]="form.descricao" placeholder="Opcional" />
        </div>
        <div class="form-group">
          <label>Ativo</label>
          <select [(ngModel)]="form.ativo">
            <option [ngValue]="true">Sim</option>
            <option [ngValue]="false">Não</option>
          </select>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn" (click)="salvar()">💾 {{ editando ? 'Atualizar' : 'Salvar' }}</button>
        <button class="btn btn-secondary" (click)="novo()">Limpar</button>
      </div>

      <p class="dica">
        Os processos são usados na composição dos produtos do tipo <strong>Kit</strong>.
        No kit você informa quantas horas de cada processo são gastas, e o custo é calculado
        automaticamente: <em>valor/hora × horas</em>.
      </p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>Processos ({{ processos.length }})</h2>
        <span class="total-geral">Custo/hora médio: {{ mediaHora | currency:'BRL' }}</span>
      </div>

      <div *ngIf="loading" class="empty">Carregando...</div>
      <div *ngIf="!loading && processos.length === 0" class="empty">Nenhum processo cadastrado.</div>

      <table class="table" *ngIf="!loading && processos.length > 0">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Descrição</th>
            <th>Valor/Hora</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of processos">
            <td><strong>{{ p.nome }}</strong></td>
            <td>{{ p.descricao || '—' }}</td>
            <td>{{ p.valorHora | currency:'BRL' }}</td>
            <td>
              <span class="badge" [ngClass]="p.ativo ? 'badge-green' : 'badge-gray'">
                {{ p.ativo ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
            <td class="actions">
              <button class="btn btn-sm btn-secondary" (click)="editar(p)">Editar</button>
              <button class="btn btn-sm btn-danger" (click)="excluir(p)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .dica { margin-top: 1rem; font-size: .85rem; color: #5b6b7c; background:#f3f6fa;
            border-left:3px solid #6b8cae; padding:.6rem .8rem; border-radius:6px; }
    .total-geral { font-size: .85rem; color:#4a5a6a; }
  `]
})
export class ProcessosComponent implements OnInit {
  processos: Processo[] = [];
  loading = false;
  error = '';
  sucesso = '';
  editando: Processo | null = null;
  form: ProcessoCreate = this.blankForm();

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  get mediaHora(): number {
    if (this.processos.length === 0) return 0;
    return this.processos.reduce((a, p) => a + p.valorHora, 0) / this.processos.length;
  }

  load() {
    this.loading = true;
    this.api.getProcessos().subscribe({
      next: d => { this.processos = d; this.loading = false; },
      error: () => { this.error = 'Erro ao carregar processos.'; this.loading = false; }
    });
  }

  blankForm(): ProcessoCreate {
    return { nome: '', descricao: '', valorHora: 0, ativo: true };
  }

  novo() { this.editando = null; this.form = this.blankForm(); this.error = ''; this.sucesso = ''; }

  editar(p: Processo) {
    this.editando = p;
    this.error = ''; this.sucesso = '';
    this.form = { nome: p.nome, descricao: p.descricao, valorHora: p.valorHora, ativo: p.ativo };
  }

  salvar() {
    this.error = ''; this.sucesso = '';
    if (!this.form.nome || !this.form.nome.trim()) { this.error = 'Informe o nome do processo.'; return; }
    if (this.form.valorHora === null || this.form.valorHora === undefined || Number(this.form.valorHora) < 0) {
      this.error = 'Valor por hora inválido.'; return;
    }

    const payload: ProcessoCreate = {
      nome: this.form.nome.trim(),
      descricao: this.form.descricao?.trim() || undefined,
      valorHora: Number(this.form.valorHora),
      ativo: this.form.ativo
    };

    if (this.editando) {
      this.api.updateProcesso(this.editando.id, payload).subscribe({
        next: () => { this.sucesso = 'Processo atualizado.'; this.editando = null; this.form = this.blankForm(); this.load(); },
        error: e => this.error = mensagemErro(e, 'Erro ao salvar processo.')
      });
    } else {
      this.api.createProcesso(payload).subscribe({
        next: () => { this.sucesso = 'Processo cadastrado.'; this.form = this.blankForm(); this.load(); },
        error: e => this.error = mensagemErro(e, 'Erro ao salvar processo.')
      });
    }
  }

  excluir(p: Processo) {
    if (!confirm(`Excluir o processo "${p.nome}"?`)) return;
    this.error = ''; this.sucesso = '';
    this.api.deleteProcesso(p.id).subscribe({
      next: () => { this.sucesso = 'Processo excluído.'; this.load(); },
      error: e => this.error = mensagemErro(e, 'Erro ao excluir processo (pode estar em uso em algum kit).')
    });
  }
}
