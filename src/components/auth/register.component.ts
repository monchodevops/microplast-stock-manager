import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div class="w-full max-w-md">

        <!-- Logo -->
        <div class="mb-8 flex flex-col items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <span class="text-2xl font-bold tracking-widest text-slate-800">ROTO<span class="text-blue-600">SYS</span></span>
        </div>

        <!-- Card -->
        <div class="rounded-2xl bg-white px-8 py-10 shadow-lg">

          @if (!success()) {
            <h1 class="mb-1 text-xl font-semibold text-slate-800">Crear cuenta</h1>
            <p class="mb-6 text-sm text-slate-500">Completá los datos para registrarte</p>

            <form (ngSubmit)="onSubmit()" class="space-y-4">

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">Nombre de usuario</label>
                <input
                  type="text" name="username" [(ngModel)]="username" required
                  placeholder="Tu nombre"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">Correo electrónico</label>
                <input
                  type="email" name="email" [(ngModel)]="email" required
                  placeholder="usuario@empresa.com"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">Contraseña</label>
                <input
                  type="password" name="password" [(ngModel)]="password" required minlength="6"
                  placeholder="Mínimo 6 caracteres"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              @if (error()) {
                <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ error() }}</p>
              }

              <button
                type="submit" [disabled]="loading()"
                class="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60">
                {{ loading() ? 'Creando cuenta...' : 'Crear cuenta' }}
              </button>

            </form>
          } @else {
            <!-- Confirmación enviada -->
            <div class="flex flex-col items-center gap-4 py-4 text-center">
              <div class="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <svg class="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-slate-800">¡Revisá tu correo!</h2>
                <p class="mt-1 text-sm text-slate-500">
                  Te enviamos un link de confirmación a <strong>{{ email }}</strong>.<br>
                  Confirmá tu cuenta para poder ingresar.
                </p>
              </div>
            </div>
          }

          <p class="mt-6 text-center text-sm text-slate-500">
            ¿Ya tenés cuenta?
            <a routerLink="/login" class="font-medium text-blue-600 hover:text-blue-700 hover:underline">Iniciar sesión</a>
          </p>
        </div>

      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);

  username = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  async onSubmit(): Promise<void> {
    if (!this.username || !this.email || !this.password) return;
    this.loading.set(true);
    this.error.set(null);

    const { error } = await this.auth.signUp(this.email, this.password, this.username);

    if (error) {
      this.error.set(this.translateError(error));
      this.loading.set(false);
    } else {
      this.success.set(true);
    }
  }

  private translateError(msg: string): string {
    if (msg.includes('already registered')) return 'Este correo ya está registrado.';
    if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres.';
    return msg;
  }
}
