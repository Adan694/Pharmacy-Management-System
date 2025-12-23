import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../Components/sidebar/sidebar';
import { AdminService } from '../../shared/services/adminservice';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-sales-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  templateUrl: './sales.html',
  styleUrls: ['./sales.css']
})
export class Sales implements OnInit , AfterViewInit{
  @ViewChild('salesChart') salesChartCanvas!: ElementRef<HTMLCanvasElement>;

  sales: any[] = [];
  allSales: any[] = [];
  summary: any = {
    todaySalesCount: 0,
    todaySalesAmount: 0,
    totalSalesCount: 0,
    monthSalesAmount: 0
  };

  filters = { startDate: '', endDate: '', search: '', cashier: '' };

  chartView: 'monthly' | 'yearly' = 'monthly';
  chart!: Chart;

  loading = true;
  salesLoading = false;
  exportingData = false;
  errorMessage = '';
// Add this property at the top with other state variables
applyingFilters = false;

  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  totalRecords = 0;

  today: string = new Date().toISOString().split('T')[0];

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

    ngAfterViewInit() {
    // Delay slightly to ensure canvas is ready
    setTimeout(() => {
      this.loadChart();
    }, 100);
  }


  /** ================= LOAD DASHBOARD ================= */
  loadDashboardData() {
    this.loading = true;
    this.errorMessage = '';
    this.loadSummary();
    this.loadSales();
    // this.loadChart();
  }

  loadSummary() {
    this.adminService.getReportsSummary().subscribe({
      next: res => { this.summary = res || this.summary; },
      error: err => { console.error(err); this.errorMessage = 'Failed to load summary'; }
    });
  }

  loadSales() {
    this.salesLoading = true;
      this.applyingFilters = true; // <-- set to true while fetching

    this.adminService.getSales(this.filters).subscribe({
      next: res => {
        this.allSales = res?.data || res || [];
        this.totalRecords = this.allSales.length;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.updatePagedSales();
        this.salesLoading = false;
        this.applyingFilters = false;
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Failed to load sales';
        this.salesLoading = false;
        this.applyingFilters = false;
         this.loading = false;
      }
    });
  }

  updatePagedSales() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.sales = this.allSales.slice(start, start + this.pageSize);
  }

  nextPage() { if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePagedSales(); } }
  prevPage() { if (this.currentPage > 1) { this.currentPage--; this.updatePagedSales(); } }

  applyFilters() { this.currentPage = 1; this.loadSales(); }
  resetFilters() { this.filters = { startDate: '', endDate: '', search: '', cashier: '' }; this.applyFilters(); }

  getSalesTotal() { return this.sales.reduce((total, s) => total + (s.total || 0), 0); }
  getAverageSale() { return this.sales.length ? this.getSalesTotal() / this.sales.length : 0; }

  /** ================= CHART ================= */
  changeChartView(view: 'monthly' | 'yearly') {
  this.chartView = view;
  setTimeout(() => {
    this.loadChart();
  }, 100); // Ensure canvas exists
}


  loadChart() {
    if (!this.salesChartCanvas?.nativeElement) return;
    const chartObservable = this.chartView === 'monthly' 
      ? this.adminService.getMonthlySales() 
      : this.adminService.getYearlySales();

    chartObservable.subscribe({
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
    const ctx = this.salesChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: this.chartView === 'monthly' ? 'Monthly Sales' : 'Yearly Sales',
          data,
          fill: true,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76,175,80,0.15)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: this.chartView === 'monthly' ? 'Monthly Sales Trend' : 'Yearly Sales Trend' }
        },
        scales: {
          x: { title: { display: true, text: this.chartView === 'monthly' ? 'Month' : 'Year' } },
          y: { beginAtZero: true, title: { display: true, text: 'Sales Amount ($)' } }
        }
      }
    });
  }

  /** ================= EXPORT ================= */
  exportData() {
    this.exportingData = true;
    this.adminService.exportSales(this.filters).subscribe({
      next: blob => {
        if (blob) this.adminService.downloadBlob(blob, 'sales-report.csv');
        this.exportingData = false;
      },
      error: err => { console.error(err); this.errorMessage = 'Failed to export'; this.exportingData = false; }
    });
  }

  retryLoadData() { this.errorMessage = ''; this.loadDashboardData(); }
}
