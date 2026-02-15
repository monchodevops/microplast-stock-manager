import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductionComponent } from './components/production/production.component';
import { InventoryViewComponent } from './components/inventory/inventory-view.component';
import { RecipesComponent } from './components/settings/recipes.component';

type View = 'dashboard' | 'production' | 'inventory' | 'recipes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent, ProductionComponent, InventoryViewComponent, RecipesComponent],
  templateUrl: './app.component.html',
  styleUrls: []
})
export class AppComponent {
  currentView = signal<View>('dashboard');

  setView(view: View) {
    this.currentView.set(view);
  }
}