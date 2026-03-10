import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductionComponent } from './components/production/production.component';
import { RecipesComponent } from './components/settings/recipes.component';
import { ProductionReportComponent } from './components/production/production-report.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
    // Rutas públicas (sin autenticación)
    { path: 'login',           loadComponent: () => import('./components/auth/login.component').then(c => c.LoginComponent) },
    { path: 'register',        loadComponent: () => import('./components/auth/register.component').then(c => c.RegisterComponent) },
    { path: 'reset-password',  loadComponent: () => import('./components/auth/reset-password.component').then(c => c.ResetPasswordComponent) },
    { path: 'update-password', loadComponent: () => import('./components/auth/update-password.component').then(c => c.UpdatePasswordComponent) },

    // Rutas protegidas
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'dashboard',         component: DashboardComponent,      canActivate: [authGuard] },
    { path: 'production',        component: ProductionComponent,      canActivate: [authGuard] },
    { path: 'raw-materials',     loadComponent: () => import('./components/inventory/raw-materials.component').then(c => c.RawMaterialsComponent),         canActivate: [authGuard] },
    { path: 'finished-goods',    loadComponent: () => import('./components/inventory/finished-goods.component').then(c => c.FinishedGoodsComponent),       canActivate: [authGuard] },
    { path: 'dispatch',          loadComponent: () => import('./components/dispatch/dispatch-builder.component').then(c => c.DispatchBuilderComponent),     canActivate: [authGuard] },
    { path: 'historial-remitos', loadComponent: () => import('./components/dispatch/dispatch-history.component').then(c => c.DispatchHistoryComponent),    canActivate: [authGuard] },
    { path: 'remito/imprimir/:id', loadComponent: () => import('./components/dispatch/remito-print.component').then(c => c.RemitoPrintComponent),          canActivate: [authGuard] },
    { path: 'recipes',           component: RecipesComponent,         canActivate: [authGuard, adminGuard] },
    { path: 'report',            component: ProductionReportComponent, canActivate: [authGuard] },
];
