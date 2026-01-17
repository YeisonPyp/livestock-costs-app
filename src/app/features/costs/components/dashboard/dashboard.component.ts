import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CostService } from '../../services/cost.service';
import { CategoryService } from '../../../categories/services/category.service';
import { CategoryTotal } from '../../models/cost.interface';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

interface DashboardStats {
  totalMonth: number;
  totalYear: number;
  categoriesActive: number;
  costsCount: number;
  averageCost: number;
  maxCost: number;
  comparison: {
    percentageChange: number;
    isPositive: boolean;
  };
}

interface MonthData {
  year: number;
  month: number;
  name: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  loading = false;
  loadingStats = false;
  
  stats: DashboardStats = {
    totalMonth: 0,
    totalYear: 0,
    categoriesActive: 0,
    costsCount: 0,
    averageCost: 0,
    maxCost: 0,
    comparison: {
      percentageChange: 0,
      isPositive: false
    }
  };

  monthlyReport: CategoryTotal[] = [];
  currentMonth: MonthData;
  previousMonth: MonthData;

  // Para selector de mes
  availableMonths: MonthData[] = [];
  selectedMonthIndex = 0;

  constructor(
    private costService: CostService,
    private categoryService: CategoryService
  ) {
    const now = new Date();
    this.currentMonth = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      name: now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    };

    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    this.previousMonth = {
      year: prevDate.getFullYear(),
      month: prevDate.getMonth() + 1,
      name: prevDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    };

    this.generateAvailableMonths();
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  generateAvailableMonths(): void {
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      this.availableMonths.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        name: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      });
    }
  }

  loadDashboardData(): void {
    this.loadMonthlyData(this.currentMonth.year, this.currentMonth.month);
    this.loadPreviousMonthForComparison();
    this.loadYearToDate();
    this.loadCategoriesCount();
  }

  loadMonthlyData(year: number, month: number): void {
    this.loading = true;

    // Total del mes
    this.costService.getTotalMonth(year, month).subscribe({
      next: (response) => {
        if (response.success) {
          this.stats.totalMonth = response.data.total || 0;
          this.stats.costsCount = response.data.count || 0;
          this.stats.averageCost = this.stats.costsCount > 0 
            ? this.stats.totalMonth / this.stats.costsCount 
            : 0;
        }
      },
      error: (error) => {
        console.error('Error loading total month', error);
      }
    });

    // Reporte mensual por categorías
    this.costService.getMonthlyReport(year, month).subscribe({
      next: (response) => {
        if (response.success) {
          this.monthlyReport = response.data.sort((a, b) => b.total - a.total);
          
          // Encontrar el costo máximo
          if (this.monthlyReport.length > 0) {
            this.stats.maxCost = Math.max(...this.monthlyReport.map(r => r.total));
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading monthly report', error);
        this.loading = false;
      }
    });
  }

  loadPreviousMonthForComparison(): void {
    this.costService.getTotalMonth(this.previousMonth.year, this.previousMonth.month).subscribe({
      next: (response) => {
        if (response.success) {
          const previousTotal = response.data.total || 0;
          
          // Calcular cambio porcentual
          if (previousTotal > 0) {
            const change = ((this.stats.totalMonth - previousTotal) / previousTotal) * 100;
            this.stats.comparison.percentageChange = Math.abs(change);
            this.stats.comparison.isPositive = change >= 0;
          }
        }
      },
      error: (error) => {
        console.error('Error loading previous month', error);
      }
    });
  }

  loadYearToDate(): void {
    const year = this.currentMonth.year;
    
    this.costService.getYearToDate(year).subscribe({
      next: (response) => {
        if (response.success) {
          this.stats.totalYear = response.data.total || 0;
        }
      },
      error: (error) => {
        console.error('Error loading year to date', error);
      }
    });
  }

  loadCategoriesCount(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats.categoriesActive = response.data.filter(c => c.is_movement).length;
        }
      },
      error: (error) => {
        console.error('Error loading categories', error);
      }
    });
  }

  onMonthChange(index: number): void {
    this.selectedMonthIndex = index;
    const selected = this.availableMonths[index];
    this.currentMonth = selected;
    
    // Actualizar mes anterior
    const prevDate = new Date(selected.year, selected.month - 2, 1);
    this.previousMonth = {
      year: prevDate.getFullYear(),
      month: prevDate.getMonth() + 1,
      name: prevDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    };

    this.loadDashboardData();
  }

  previousMonthClick(): void {
    if (this.selectedMonthIndex < this.availableMonths.length - 1) {
      this.onMonthChange(this.selectedMonthIndex + 1);
    }
  }

  nextMonthClick(): void {
    if (this.selectedMonthIndex > 0) {
      this.onMonthChange(this.selectedMonthIndex - 1);
    }
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  getPercentageWidth(total: number): number {
    if (this.stats.maxCost === 0) return 0;
    return (total / this.stats.maxCost) * 100;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-CO').format(num);
  }

  formatPercentage(num: number): string {
    return num.toFixed(1);
  }

  capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}