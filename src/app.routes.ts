import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductionComponent } from './components/production/production.component';
import { RecipesComponent } from './components/settings/recipes.component';
import { ProductionReportComponent } from './components/production/production-report.component';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'production', component: ProductionComponent },
    { path: 'raw-materials', loadComponent: () => import('./components/inventory/raw-materials.component').then(c => c.RawMaterialsComponent) },
    { path: 'finished-goods', loadComponent: () => import('./components/inventory/finished-goods.component').then(c => c.FinishedGoodsComponent) },
    { path: 'dispatch', loadComponent: () => import('./components/dispatch/dispatch-builder.component').then(c => c.DispatchBuilderComponent) },
    { path: 'historial-remitos', loadComponent: () => import('./components/dispatch/dispatch-history.component').then(c => c.DispatchHistoryComponent) },
    { path: 'remito/imprimir/:id', loadComponent: () => import('./components/dispatch/remito-print.component').then(c => c.RemitoPrintComponent) },
    { path: 'recipes', component: RecipesComponent },
    { path: 'report', component: ProductionReportComponent }
];
