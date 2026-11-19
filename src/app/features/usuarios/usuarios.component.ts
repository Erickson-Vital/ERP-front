import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { mensagemErro } from '../../core/error-util';
import { Usuario, UsuarioCreate, UsuarioUpdate } from '../../core/models';
import { MENUS, MenuItem, menuPorCodigo } from '../../core/menus';
import { filtrarPor, paginar, totalPaginas } from '../../core/paginacao';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  loading = false;
  error = '';
  sucesso = '';
  editando: Usuario | null = null;
  formNovo = false;

  menusDisponiveis: MenuItem[] = MENUS.filter(m => m.codigo !== 'usuarios' && m.codigo !== 'auditoria');

  form: UsuarioCreate = this.blank();
  menusSelecionados: string[] = [];
  senhaAtual = '';

  // Filtro e paginação
  filtro = '';
  pagina = 1;
  tamanho = 10;
  get filtrados(): Usuario[] {
    return filtrarPor(this.usuarios, this.filtro, [u => u.nome, u => u.login]);
  }
  get paginados(): Usuario[] { return paginar(this.filtrados, this.pagina, this.tamanho); }
  get totalPaginas(): number { return totalPaginas(this.filtrados.length, this.tamanho); }

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  onFiltro() { this.pagina = 1; }
  irPagina(p: number) { if (p >= 1 && p <= this.totalPaginas) this.pagina = p; }

  load() {
    this.loading = true;
    this.api.getUsuarios().subscribe({
      next: (d) => { this.usuarios = d; this.loading = false; },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao carregar usuários.'); this.loading = false; }
    });
  }

  blank(): UsuarioCreate {
    return { nome: '', login: '', senha: '', ativo: true, isAdmin: false, menus: [] };
  }

  novo() {
    this.formNovo = true;
    this.editando = null;
    this.form = this.blank();
    this.menusSelecionados = [];
    this.senhaAtual = '';
    this.error = '';
    this.sucesso = '';
  }

  editar(u: Usuario) {
    this.editando = u;
    this.formNovo = false;
    this.error = '';
    this.sucesso = '';
    this.senhaAtual = '';
    this.menusSelecionados = [...u.menus];
    this.form = {
      nome: u.nome,
      login: u.login,
      senha: '',
      ativo: u.ativo,
      isAdmin: u.isAdmin,
      menus: [...u.menus]
    };
  }

  salvar() {
    this.error = '';
    this.sucesso = '';
    if (!this.form.nome || !this.form.login) {
      this.error = 'Informe nome e login.';
      return;
    }
    if (!this.form.isAdmin && this.menusSelecionados.length === 0) {
      this.error = 'Selecione ao menos um menu de acesso (ou marque como Administrador).';
      return;
    }

    if (this.editando) {
      const dto: UsuarioUpdate = {
        nome: this.form.nome,
        login: this.form.login,
        senha: this.senhaAtual || null,
        ativo: this.form.ativo,
        isAdmin: this.form.isAdmin,
        menus: this.menusSelecionados
      };
      this.api.updateUsuario(this.editando.id, dto).subscribe({
        next: () => {
          this.sucesso = 'Usuário atualizado.';
          this.editando = null;
          this.load();
        },
        error: (e) => { this.error = mensagemErro(e, 'Erro ao atualizar usuário.'); }
      });
    } else {
      if (!this.form.senha || this.form.senha.length < 4) {
        this.error = 'A senha deve ter ao menos 4 caracteres.';
        return;
      }
      const dto: UsuarioCreate = {
        nome: this.form.nome,
        login: this.form.login,
        senha: this.form.senha,
        ativo: this.form.ativo,
        isAdmin: this.form.isAdmin,
        menus: this.menusSelecionados
      };
      this.api.createUsuario(dto).subscribe({
        next: (criado) => {
          this.sucesso = `Usuário "${criado.nome}" criado com sucesso.`;
          this.formNovo = false;
          this.form = this.blank();
          this.menusSelecionados = [];
          this.load();
        },
        error: (e) => { this.error = mensagemErro(e, 'Erro ao criar usuário.'); }
      });
    }
  }

  excluir(u: Usuario) {
    if (!confirm(`Excluir o usuário "${u.nome}"?`)) return;
    this.api.deleteUsuario(u.id).subscribe({
      next: () => { this.sucesso = 'Usuário removido.'; this.load(); },
      error: (e) => { this.error = mensagemErro(e, 'Erro ao excluir usuário.'); }
    });
  }

  toggleMenu(codigo: string) {
    const i = this.menusSelecionados.indexOf(codigo);
    if (i >= 0) this.menusSelecionados.splice(i, 1);
    else this.menusSelecionados.push(codigo);
  }

  temMenu(codigo: string): boolean {
    return this.menusSelecionados.indexOf(codigo) >= 0;
  }

  menuLabel(codigo: string): string {
    return menuPorCodigo(codigo)?.label ?? codigo;
  }

  cancelar() {
    this.formNovo = false;
    this.editando = null;
    this.error = '';
  }
}
