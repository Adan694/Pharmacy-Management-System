import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../Components/sidebar/sidebar';
import { AdminService } from '../../shared/services/adminservice';
import { catchError, finalize } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class AdminDashboard implements OnInit, AfterViewInit {
  @ViewChild('dashboardChart') chartCanvas!: ElementRef;
  
  // Dashboard stats from backend
  stats = {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pharmacists: 0,
    cashiers: 0
  };

  // Summary data from backend
  summary = {
    todaySalesAmount: 0,
    monthSalesAmount: 0,
    totalPurchasesAmount: 0,
    todaySalesCount: 0,
    totalSalesCount: 0,
    totalOrdersCount: 0
  };

  // Alert counts from backend
  alerts = {
    totalMedicines: 0,
    lowStock: 0,
    expired: 0
  };

  // Users list
  users: any[] = [];

  // Chart data from backend
  chartData: any = null;
  
  // Loading and error states
  loading: boolean = true;
  chartLoading: boolean = true;
  error: string | null = null;

  // Chart instance
  private chart: Chart | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    // Chart will be initialized when data is loaded
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;
    
    // Load all data from backend using forkJoin for parallel requests
    forkJoin({
      users: this.adminService.getUsers().pipe(
        catchError(error => {
          console.error('Error loading users:', error);
          return of([]);
        })
      ),
      stats: this.adminService.getDashboardStats().pipe(
        catchError(error => {
          console.error('Error loading dashboard stats:', error);
          return of({});
        })
      ),
      medicines: this.adminService.getInventory().pipe(
        catchError(error => {
          console.error('Error loading inventory:', error);
          return of([]);
        })
      ),
      lowStock: this.adminService.getLowStockItems().pipe(
        catchError(error => {
          console.error('Error loading low stock items:', error);
          return of([]);
        })
      ),
      monthlySales: this.adminService.getMonthlySales().pipe(
        catchError(error => {
          console.error('Error loading monthly sales:', error);
          return of([]);
        })
      ),
      monthlyPurchases: this.adminService.getMonthlyPurchases().pipe(
        catchError(error => {
          console.error('Error loading monthly purchases:', error);
          return of([]);
        })
      )
    }).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (data) => {
        // Process users data
        this.users = data.users || [];
        this.calculateStats();
        
        // Process summary stats
        if (data.stats) {
          this.summary = {
            todaySalesAmount: data.stats.todaySalesAmount || 0,
            monthSalesAmount: data.stats.monthSalesAmount || 0,
            totalPurchasesAmount: data.stats.totalPurchasesAmount || 0,
            todaySalesCount: data.stats.todaySalesCount || 0,
            totalSalesCount: data.stats.totalSalesCount || 0,
            totalOrdersCount: data.stats.totalOrdersCount || 0
          };
        }
        
        // Process inventory alerts
        this.processInventoryAlerts(data.medicines, data.lowStock);
        
        // Process chart data
        // this.processChartData(data.monthlySales, data.monthlyPurchases);
        // Instead of loading chart data in the forkJoin, call the separate method
this.loadComparisonChart();
        // Initialize chart after data is loaded
        setTimeout(() => {
          this.initializeChart();
        }, 100);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error = 'Failed to load dashboard data';
        this.setFallbackData();
      }
    });
  }

  processInventoryAlerts(medicines: any[], lowStockItems: any[]) {
    // Check if medicines is an array
    const medicinesArray = Array.isArray(medicines) ? medicines : [];
    
    // Calculate total medicines
    this.alerts.totalMedicines = medicinesArray.length;
    
    // Calculate low stock count
    this.alerts.lowStock = Array.isArray(lowStockItems) ? lowStockItems.length : 0;
    
    // Calculate expired medicines using the same logic as inventory component
    const today = new Date();
    this.alerts.expired = medicinesArray.filter(med => {
      if (!med.expiryDate) return false;
      const expiryDate = new Date(med.expiryDate);
      return expiryDate < today;
    }).length;
  }

  setFallbackData() {
    // Fallback data if API fails
    this.summary = {
      todaySalesAmount: 0,
      monthSalesAmount: 0,
      totalPurchasesAmount: 0,
      todaySalesCount: 0,
      totalSalesCount: 0,
      totalOrdersCount: 0
    };
    
    this.alerts = {
      totalMedicines: 0,
      lowStock: 0,
      expired: 0
    };
    
    // Initialize chart with empty data
    this.chartData = this.getEmptyChartData();
  }


  processChartData(monthlySales: any[], monthlyPurchases: any[]) {
  console.log('DASHBOARD SALES:', monthlySales);
  console.log('DASHBOARD PURCHASES:', monthlyPurchases);
  
  // Check if we have sales data
  if (!monthlySales || !monthlySales.length) {
    // Use empty chart data
    this.chartData = this.getEmptyChartData();
    this.chartLoading = false;
    return;
  }
  
  // Generate labels like "Jan 2024", "Feb 2024", etc.
  const labels = monthlySales.map(s => {
    // Assuming each sale has year and month properties
    return new Date(s.year, s.month - 1).toLocaleString('default', {
      month: 'short',
      year: 'numeric'
    });
  });
  
  // Extract sales data
  const salesData = monthlySales.map(s => s.totalAmount || s.total || 0);
  
  // Match purchases with sales by year and month
  const purchaseData = monthlySales.map(sale => {
    if (!monthlyPurchases || !monthlyPurchases.length) return 0;
    
    const match = monthlyPurchases.find(
      purchase => purchase.year === sale.year && purchase.month === sale.month
    );
    return match ? (match.totalCost || match.total || 0) : 0;
  });
  
  this.chartData = {
    labels: labels,
    sales: salesData,
    purchases: purchaseData
  };
  
  console.log('PROCESSED CHART DATA:', this.chartData);
  this.chartLoading = false;
}
  calculateStats() {
    this.stats.totalUsers = this.users.length;
    this.stats.activeUsers = this.users.filter(u => u.isActive).length;
    this.stats.inactiveUsers = this.users.filter(u => !u.isActive).length;
    this.stats.pharmacists = this.users.filter(u => u.role === 'Pharmacist').length;
    this.stats.cashiers = this.users.filter(u => u.role === 'Cashier').length;
  }

  initializeChart() {
  if (!this.chartCanvas || !this.chartData) {
    console.log('Chart canvas or data not available');
    return;
  }
  
  // Destroy existing chart
  if (this.chart) {
    this.chart.destroy();
  }
  
  const ctx = this.chartCanvas.nativeElement.getContext('2d');
  if (!ctx) return;
  
  console.log('Initializing chart with data:', this.chartData);
  
  this.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: this.chartData.labels,
      datasets: [
        {
          label: 'Sales',
          data: this.chartData.sales,
          borderColor: '#4cd137', // Green color like example
          backgroundColor: 'rgba(76, 209, 55, 0.15)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#4cd137',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: 'Purchases',
          data: this.chartData.purchases,
          borderColor: '#ff9800', // Orange color like example
          backgroundColor: 'rgba(255, 152, 0, 0.15)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ff9800',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#fff',
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(27, 27, 27, 0.9)',
          titleColor: '#fff',
          bodyColor: '#ddd',
          borderColor: '#2a2a2a',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const value = context.raw || 0;
              return `${context.dataset.label}: $${value.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#aaa',
            font: {
              size: 12
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#aaa',
            font: {
              size: 12
            },
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
  
  this.chartLoading = false;
  }
  loadComparisonChart() {
  this.chartLoading = true;
  
  forkJoin({
    sales: this.adminService.getMonthlySales(),
    purchases: this.adminService.getMonthlyPurchases()
  }).subscribe({
    next: ({ sales, purchases }) => {
      console.log('DASHBOARD SALES:', sales);
      console.log('DASHBOARD PURCHASES:', purchases);
      
      this.processChartData(sales, purchases);
      
      // Initialize chart after processing data
      setTimeout(() => {
        this.initializeChart();
      }, 100);
    },
    error: (error) => {
      console.error('Chart loading error:', error);
      this.chartData = this.getEmptyChartData();
      this.chartLoading = false;
      this.initializeChart();
    }
  });
  }
  
  getEmptyChartData() {
  // Generate labels for current year
  const currentYear = new Date().getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const labels = months.map(month => `${month} ${currentYear}`);
  
  return {
    labels: labels,
    sales: new Array(12).fill(0),
    purchases: new Array(12).fill(0)
  };
}
  // Chart data helpers
  get hasChartData(): boolean {
    if (!this.chartData) return false;
    const hasSales = this.chartData.sales.some((s: number) => s > 0);
    const hasPurchases = this.chartData.purchases.some((p: number) => p > 0);
    return hasSales || hasPurchases;
  }

  getTotalSales(): number {
    if (!this.chartData || !this.chartData.sales) return this.summary.monthSalesAmount;
    return this.chartData.sales.reduce((a: number, b: number) => a + b, 0);
  }

  getTotalPurchases(): number {
    if (!this.chartData || !this.chartData.purchases) return this.summary.totalPurchasesAmount;
    return this.chartData.purchases.reduce((a: number, b: number) => a + b, 0);
  }

  getNetProfit(): number {
    return this.getTotalSales() - this.getTotalPurchases();
  }

  getProfitPercentage(): number {
    const profit = this.getNetProfit();
    const purchases = this.getTotalPurchases();
    if (purchases === 0) return 0;
    return Math.round((profit / purchases) * 100);
  }

  downloadChart() {
    if (!this.chart) return;
    
    const link = document.createElement('a');
    link.download = `dashboard-chart-${new Date().toISOString().split('T')[0]}.png`;
    link.href = this.chart.toBase64Image();
    link.click();
    
    alert('Chart downloaded successfully!');
  }

  refreshChart() {
    this.chartLoading = true;
    this.loadDashboardData();
  }

  retryLoadData() {
    this.error = null;
    this.loadDashboardData();
  }
}