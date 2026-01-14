import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CostService } from '../../services/cost.service';
import { CategoryTotal } from '../../models/cost.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Dashboard de Costos</h2>
        <p class="text-gray-600">Bienvenido al sistema de gestión de costos ganaderos</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-700 mb-2">Total del Mes</h3>
          <p class="text-3xl font-bold text-blue-600">
            {{ totalMonth | currency:'USD':'symbol':'1.2-2' }}
          </p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-700 mb-2">Categorías Activas</h3>
          <p class="text-3xl font-bold text-green-600">{{ monthlyReport.length }}</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-700 mb-2">Mes Actual</h3>
          <p class="text-3xl font-bold text-purple-600">{{ currentMonth }}</p>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">Reporte Mensual por Categorías</h3>
        @if (loading) {
          <p class="text-gray-500">Cargando...</p>
        } @else if (monthlyReport.length === 0) {
          <p class="text-gray-500">No hay datos disponibles</p>
        } @else {
          <div class="space-y-3">
            @for (item of monthlyReport; track item.category) {
              <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span class="font-medium text-gray-700">{{ item.category }}</span>
                <span class="text-lg font-bold text-blue-600">
                  {{ item.total | currency:'USD':'symbol':'1.2-2' }}
                </span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  loading = false;
  totalMonth = 0;
  monthlyReport: CategoryTotal[] = [];
  currentMonth = '';

  constructor(private costService: CostService) {}

  ngOnInit(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    this.currentMonth = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    
    this.loadMonthlyData(year, month);
  }

  loadMonthlyData(year: number, month: number): void {
    this.loading = true;

    this.costService.getTotalMonth(year, month).subscribe({
      next: (response) => {
        if (response.success) {
          this.totalMonth = response.data.total;
        }
      },
      error: (error) => {
        console.error('Error loading total month', error);
      }
    });

    this.costService.getMonthlyReport(year, month).subscribe({
      next: (response) => {
        if (response.success) {
          this.monthlyReport = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading monthly report', error);
        this.loading = false;
      }
    });
  }
}
