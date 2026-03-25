import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase.client';

export interface UserProfile {
  id: string;
  username: string;
  role: 'admin' | 'operator';
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);

  readonly currentUser = signal<User | null>(null);
  readonly currentProfile = signal<UserProfile | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentProfile()?.role === 'admin');

  /** Promesa que se resuelve cuando la sesión inicial fue hidratada */
  readonly sessionReady: Promise<void>;

  constructor() {
    // Hidratar sesión existente al arrancar
    this.sessionReady = supabase.auth.getSession().then(({ data }) => {
      this.currentUser.set(data.session?.user ?? null);
      if (data.session?.user) {
        this.loadProfile(data.session.user.id);
      }
    });

    // Mantenerse actualizado ante cambios de sesión
    supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser.set(session?.user ?? null);

      if (session?.user) {
        this.loadProfile(session.user.id);
      } else {
        this.currentProfile.set(null);
      }

      if (event === 'PASSWORD_RECOVERY') {
        this.router.navigate(['/update-password']);
      }

      if (event === 'SIGNED_OUT') {
        this.router.navigate(['/login']);
      }
    });
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async signUp(email: string, password: string, username: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return { error: error?.message ?? null };
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    const redirectTo = `${window.location.origin}/update-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { error: error?.message ?? null };
  }

  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, role, created_at')
      .eq('id', userId)
      .single();
    this.currentProfile.set(data as UserProfile | null);
  }
}
