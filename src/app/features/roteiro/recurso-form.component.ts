import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import { RecursoCreate, OpcaoCategoria } from '../../core/models';

@Component({
  selector: 'app-recurso-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './recurso-form.component.html',
  styleUrl: './recurso-form.component.css'
})
export class RecursoFormComponent implements OnInit {
  recursoId: string | null = null;
  loading = false;
  salvando = false;
  error = '';
  sucesso = '';

  tiposRecurso: OpcaoCategoria[] = [];

  form: RecursoCreate = {
    codigo: '',
    nome: '',
    valorHora: 0,
    tipoRecursoId: null,
    ativo: true
  };

  // Modal da Engrenagem (TiposRecurso)
  modalTipoAberto = false;
  novoTipoTexto = '';
  editandoIndex: number | null = null;
  editandoTexto = '';

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.recursoId = this.route.snapshot.paramMap.get('id');
    this.api.getOpcoesCategoria('tipos-recurso').subscribe({
      next: d => { this.tiposRecurso = d; }
    });
    if (this.recursoId) {
      this.carregarRecurso(this.recursoId);
    }
  }

  carregarRecurso(id: string) {
    this.loading = true;
    this.api.getRecurso(id).subscribe({
      next: r => {
        this.form = {
          codigo: r.codigo,
          nome: r.nome,
          valorHora: r.valorHora,
          tipoRecursoId: r.tipoRecursoId,
          ativo: r.ativo
        };
        this.loading = false;
      },
      error: e => {
        this.error = mensagemErro(e, 'Erro ao carregar o recurso.');
        this.loading = false;
      }
    });
  }

  // ===== Modal da Engrenagem (TiposRecurso) =====
  abrirModalTipos() {
    this.novoTipoTexto = '';
    this.editandoIndex = null;
    this.editandoTexto = '';
    this.modalTipoAberto = true;
  }

  fecharModalTipos() {
    this.modalTipoAberto = false;
  }

  adicionarTipo() {
    const nome = (this.novoTipoTexto || '').trim();
    if (!nome) return;
    this.api.addOpcaoCategoria('tipos-recurso', nome).subscribe({
      next: novo => {
        this.tiposRecurso = [...this.tiposRecurso, novo];
        this.form.tipoRecursoId = novo.id;
        this.novoTipoTexto = '';
      },
      error: e => { this.error = mensagemErro(e, 'Erro ao adicionar tipo de recurso.'); }
    });
  }

  iniciarEdicaoTipo(i: number) {
    this.editandoIndex = i;
    this.editandoTexto = this.tiposRecurso[i].nome;
  }

  cancelarEdicaoTipo() {
    this.editandoIndex = null;
    this.editandoTexto = '';
  }

  salvarEdicaoTipo(i: number) {
    const nome = (this.editandoTexto || '').trim();
    if (!nome) { this.cancelarEdicaoTipo(); return; }
    const atual = this.tiposRecurso[i];
    this.api.updateOpcaoCategoria('tipos-recurso', atual.id, nome).subscribe({
      next: upd => {
        this.tiposRecurso[i] = upd;
        this.tiposRecurso = [...this.tiposRecurso];
        this.editandoIndex = null;
      },
      error: e => { this.error = mensagemErro(e, 'Erro ao editar tipo de recurso.'); }
    });
  }

  removerTipo(i: number) {
    const atual = this.tiposRecurso[i];
    this.api.deleteOpcaoCategoria('tipos-recurso', atual.id).subscribe({
      next: () => {
        this.tiposRecurso = this.tiposRecurso.filter(t => t.id !== atual.id);
        if (this.form.tipoRecursoId === atual.id) {
          this.form.tipoRecursoId = null;
        }
      },
      error: e => { this.error = mensagemErro(e, 'Erro ao excluir tipo de recurso.'); }
    });
  }

  voltar() {
    this.router.navigate(['/roteiro/recursos']);
  }

  salvar() {
    this.error = '';
    this.sucesso = '';

    if (!this.form.codigo?.trim()) {
      this.error = 'Informe o Código do recurso.';
      return;
    }
    if (!this.form.nome?.trim()) {
      this.error = 'Informe o Nome do recurso.';
      return;
    }
    if (!this.form.tipoRecursoId) {
      this.error = 'Selecione o Tipo do recurso.';
      return;
    }
    if (this.form.valorHora === null || this.form.valorHora === undefined || Number(this.form.valorHora) < 0) {
      this.error = 'Informe um Valor Hora válido.';
      return;
    }

    const payload: RecursoCreate = {
      codigo: this.form.codigo.trim(),
      nome: this.form.nome.trim(),
      valorHora: Number(this.form.valorHora),
      tipoRecursoId: this.form.tipoRecursoId,
      ativo: this.form.ativo
    };

    this.salvando = true;
    if (this.recursoId) {
      this.api.updateRecurso(this.recursoId, payload).subscribe({
        next: () => {
          this.salvando = false;
          this.sucesso = 'Recurso atualizado com sucesso.';
          setTimeout(() => this.voltar(), 800);
        },
        error: e => {
          this.salvando = false;
          this.error = mensagemErro(e, 'Erro ao atualizar o recurso.');
        }
      });
    } else {
      this.api.createRecurso(payload).subscribe({
        next: () => {
          this.salvando = false;
          this.sucesso = 'Recurso cadastrado com sucesso.';
          setTimeout(() => this.voltar(), 800);
        },
        error: e => {
          this.salvando = false;
          this.error = mensagemErro(e, 'Erro ao cadastrar o recurso.');
        }
      });
    }
  }
}
