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
    { path: 'recipes', component: RecipesComponent },
    { path: 'report', component: ProductionReportComponent }
];
