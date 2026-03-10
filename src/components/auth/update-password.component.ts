import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
          <h1 class="mb-1 text-xl font-semibold text-slate-800">Nueva contraseña</h1>
          <p class="mb-6 text-sm text-slate-500">Ingresá y confirmá tu nueva contraseña.</p>

          <form (ngSubmit)="onSubmit()" class="space-y-4">

            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">Nueva contraseña</label>
              <input
                type="password" name="password" [(ngModel)]="password" required minlength="6"
                placeholder="Mínimo 6 caracteres"
                class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">Confirmar contraseña</label>
              <input
                type="password" name="confirm" [(ngModel)]="confirm" required
                placeholder="Repetí la contraseña"
                class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>

            @if (error()) {
              <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ error() }}</p>
            }

            <button
              type="submit" [disabled]="loading()"
              class="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60">
              {{ loading() ? 'Guardando...' : 'Guardar nueva contraseña' }}
            </button>

          </form>
        </div>

      </div>
    </div>
  `,
})
export class UpdatePasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  password = '';
  confirm = '';
  loading = signal(false);
  error = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    if (!this.password || !this.confirm) return;

    if (this.password !== this.confirm) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    if (this.password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { error } = await this.auth.updatePassword(this.password);

    if (error) {
      this.error.set(error);
      this.loading.set(false);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
