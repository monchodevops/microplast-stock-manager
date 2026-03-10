import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
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

          @if (!sent()) {
            <h1 class="mb-1 text-xl font-semibold text-slate-800">Recuperar contraseña</h1>
            <p class="mb-6 text-sm text-slate-500">
              Ingresá tu correo y te enviamos un link para crear una nueva contraseña.
            </p>

            <form (ngSubmit)="onSubmit()" class="space-y-4">

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">Correo electrónico</label>
                <input
                  type="email" name="email" [(ngModel)]="email" required
                  placeholder="usuario@empresa.com"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              @if (error()) {
                <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ error() }}</p>
              }

              <button
                type="submit" [disabled]="loading()"
                class="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60">
                {{ loading() ? 'Enviando...' : 'Enviar link de recuperación' }}
              </button>

            </form>
          } @else {
            <!-- Correo enviado -->
            <div class="flex flex-col items-center gap-4 py-4 text-center">
              <div class="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <svg class="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-slate-800">¡Revisá tu correo!</h2>
                <p class="mt-1 text-sm text-slate-500">
                  Si existe una cuenta con <strong>{{ email }}</strong>, te enviamos el link para restablecer tu contraseña.
                </p>
              </div>
            </div>
          }

          <p class="mt-6 text-center text-sm text-slate-500">
            <a routerLink="/login" class="font-medium text-blue-600 hover:text-blue-700 hover:underline">← Volver al login</a>
          </p>
        </div>

      </div>
    </div>
  `,
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);

  email = '';
  loading = signal(false);
  error = signal<string | null>(null);
  sent = signal(false);

  async onSubmit(): Promise<void> {
    if (!this.email) return;
    this.loading.set(true);
    this.error.set(null);

    const { error } = await this.auth.resetPassword(this.email);

    if (error) {
      this.error.set(error);
      this.loading.set(false);
    } else {
      this.sent.set(true);
    }
  }
}
