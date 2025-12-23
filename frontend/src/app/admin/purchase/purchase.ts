import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../Components/sidebar/sidebar';
import { AdminService } from '../../shared/services/adminservice';
import { Chart, registerables } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-purchase-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  templateUrl: './purchase.html',
  styleUrls: ['./purchase.css']
})
export class Purchase implements OnInit, AfterViewInit {
  @ViewChild('purchaseChart') purchaseChartCanvas!: ElementRef<HTMLCanvasElement>;

  purchases: any[] = [];
  allPurchases: any[] = [];
summary = {
  totalOrdersCount: 0,
  totalPurchasesAmount: 0
};

  filters = { startDate: '', endDate: '', search: '', supplier: '' };

  chartView: 'monthly' | 'yearly' = 'monthly';
  chart!: Chart;

  loading = true;
  purchasesLoading = false;
  exportingData = false;
  applyingFilters = false;
  errorMessage = '';

  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  totalRecords = 0;

  today: string = new Date().toISOString().split('T')[0];

  constructor(private adminService: AdminService, private http: HttpClient) {}

  ngOnInit() {
    this.loadDashboardData();
    this.loadPurchaseSummary();
  }

  ngAfterViewInit() {
    setTimeout(() => this.loadChart(), 100);
  }

  /** ================= LOAD DASHBOARD ================= */
  loadDashboardData() {
    this.loading = true;
    this.errorMessage = '';
    // this.loadSummary();
    this.loadPurchases();
  }

  // loadSummary() {
  //   this.adminService.getReportsSummary().subscribe({
  //     next: res => { this.summary = res || this.summary; },
  //     error: err => { console.error(err); this.errorMessage = 'Failed to load summary'; }
  //   });
  // }

  

  loadPurchases() {
    this.purchasesLoading = true;
    this.applyingFilters = true;

    this.adminService.getPurchases(this.filters).subscribe({
      next: res => {
        this.allPurchases = res?.data || res || [];
        this.totalRecords = this.allPurchases.length;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.updatePagedPurchases();
        this.purchasesLoading = false;
        this.applyingFilters = false;
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Failed to load purchases';
        this.purchasesLoading = false;
        this.applyingFilters = false;
        this.loading = false;
      }
    });
  }

  loadPurchaseSummary() {
  this.adminService.getReportsSummary().subscribe({
    next: res => {
      this.summary.totalOrdersCount = res.totalOrdersCount || 0;
      this.summary.totalPurchasesAmount = res.totalPurchasesAmount || 0;
    },
    error: err => {
      console.error('Failed to load purchase summary', err);
      this.summary.totalOrdersCount = 0;
      this.summary.totalPurchasesAmount = 0;
    }
  });
}


  updatePagedPurchases() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.purchases = this.allPurchases.slice(start, start + this.pageSize);
  }

  nextPage() { if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePagedPurchases(); } }
  prevPage() { if (this.currentPage > 1) { this.currentPage--; this.updatePagedPurchases(); } }

  applyFilters() { this.currentPage = 1; this.loadPurchases(); }
  resetFilters() { this.filters = { startDate: '', endDate: '', search: '', supplier: '' }; this.applyFilters(); }

  getPurchasesTotal() {
    return this.purchases.reduce((total, p) => total + (p.totalCost || 0), 0);
  }

  getAveragePurchase() {
    return this.purchases.length ? this.getPurchasesTotal() / this.purchases.length : 0;
  }

  hasActiveFilters(): boolean {
    return Object.values(this.filters).some(v => v !== '');
  }

  /** ================= CHART ================= */
  changeChartView(view: 'monthly' | 'yearly') {
    this.chartView = view;
    setTimeout(() => this.loadChart(), 100);
  }

  loadChart() {
    if (!this.purchaseChartCanvas?.nativeElement) return;

    const chartObs = this.chartView === 'monthly'
      ? this.adminService.getMonthlyPurchases()
      : this.adminService.getYearlyPurchases();

    chartObs.subscribe({
      next: data => {
        if (!data || data.length === 0) return;
        const labels = this.chartView === 'monthly'
          ? data.map((d: any) => new Date(d.year, d.month - 1).toLocaleString('default', { month: 'short' }))
          : data.map((d: any) => d.year.toString());
        const totals = data.map((d: any) => d.total);
        this.renderChart(labels, totals);
      },
      error: err => console.error(`${this.chartView} chart error:`, err)
    });
  }

  renderChart(labels: string[], data: number[]) {
    const ctx = this.purchaseChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: this.chartView === 'monthly' ? 'Monthly Purchases' : 'Yearly Purchases',
          data,
          fill: true,
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255,152,0,0.15)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: this.chartView === 'monthly' ? 'Monthly Purchases Trend' : 'Yearly Purchases Trend' }
        },
        scales: {
          x: { title: { display: true, text: this.chartView === 'monthly' ? 'Month' : 'Year' } },
          y: { beginAtZero: true, title: { display: true, text: 'Purchase Amount ($)' } }
        }
      }
    });
  }

  /** ================= EXPORT ================= */
  exportData() {
    this.exportingData = true;
    this.adminService.exportPurchases(this.filters).subscribe({
      next: blob => {
        if (blob) this.adminService.downloadBlob(blob, 'purchase-report.csv');
        this.exportingData = false;
      },
      error: err => { console.error(err); this.errorMessage = 'Failed to export'; this.exportingData = false; }
    });
  }

  retryLoadData() { this.errorMessage = ''; this.loadDashboardData(); }
}
