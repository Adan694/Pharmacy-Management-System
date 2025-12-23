import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Sidebar } from '../Components/sidebar/sidebar';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-sales-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class Reports implements OnInit, AfterViewInit {

  /* -------------------- Chart Reference -------------------- */
  @ViewChild('monthlySalesChart')
  monthlySalesCanvas!: ElementRef<HTMLCanvasElement>;

  /* -------------------- Data -------------------- */
  sales: any[] = [];
  purchases: any[] = [];
  monthlySalesChart: any;

  /* -------------------- Filters -------------------- */
  filters = {
    startDate: '',
    endDate: '',
    search: '',
    cashier: '',
    supplier: ''
  };

  /* -------------------- UI State -------------------- */
  activeTab: 'sales' | 'purchases' = 'sales';
  errorMessage: string = '';

  /* -------------------- Loading States -------------------- */
  loading = true;
  salesLoading = false;
  purchasesLoading = false;
  tableLoading = false;
  applyingFilters = false;
  exportingData = false;

  /* -------------------- Summary -------------------- */
  summary = {
  todaySalesCount: 0,
  todaySalesAmount: 0,
  totalSalesCount: 0,
  totalOrdersCount: 0,
  totalPurchasesAmount: 0,
  monthSalesAmount: 0
};


  /* -------------------- Pagination -------------------- */
  currentPageSales = 1;
  currentPagePurchases = 1;
  pageSize = 15;
  totalPagesSales = 1;
  totalPagesPurchases = 1;

  today: string = new Date().toISOString().split('T')[0];

  constructor(private http: HttpClient) {}

  /* =========================================================
     Lifecycle
     ========================================================= */

  ngOnInit() {
    this.loadDashboardData();
    this.loadSummary();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.activeTab === 'sales') {
        this.loadMonthlySalesChart();
      }
    });
  }

  /* =========================================================
     Dashboard
     ========================================================= */

  loadDashboardData() {
    this.loading = true;
    this.errorMessage = '';

    Promise.all([
      this.loadSales(),
      this.loadPurchases(),
      this.loadSummary()
    ]).finally(() => {
      this.loading = false;
    });
  }

  /* =========================================================
     Auth
     ========================================================= */

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.handleUnauthorized();
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  }

  /* =========================================================
     Summary
     ========================================================= */

 loadSummary() {
  const headers = this.getAuthHeaders();
  if (!headers) return Promise.resolve();

  return this.http.get<any>('http://localhost:5046/api/admin/reports/summary', { headers })
    .pipe(
      catchError(() => of({
        todaySalesCount: 0,
        todaySalesAmount: 0,
        totalSalesCount: 0,
        totalOrdersCount: 0,
        totalPurchasesAmount: 0,
        monthSalesAmount: 0
      }))
    )
    .toPromise()
    .then(res => {
      console.log('SUMMARY RESPONSE FROM BACKEND:', res); // << Add this log
      this.summary = res || {
        todaySalesCount: 0,
        todaySalesAmount: 0,
        totalSalesCount: 0,
        totalOrdersCount: 0,
        totalPurchasesAmount: 0,
        monthSalesAmount: 0
      };
      console.log('SUMMARY AFTER ASSIGNMENT:', this.summary); // << And this log
    });
}

  /* =========================================================
     Sales
     ========================================================= */

  loadSales() {
    const headers = this.getAuthHeaders();
    if (!headers) return Promise.resolve();

    this.salesLoading = true;
    this.tableLoading = true;

    let params = new HttpParams()
      .set('page', this.currentPageSales)
      .set('pageSize', this.pageSize);
console.log('SALES DATA:', this.sales); // << Log sales records
  console.log('CALCULATED TOTAL SALES:', this.getSalesTotal()); // << Log total
    if (this.filters.startDate) params = params.set('startDate', this.filters.startDate);
    if (this.filters.endDate) params = params.set('endDate', this.filters.endDate);
    if (this.filters.search) params = params.set('search', this.filters.search);
    if (this.filters.cashier) params = params.set('cashier', this.filters.cashier);

    return this.http
      .get<any>('http://localhost:5046/api/admin/sales', { headers, params })
      .pipe(
        catchError(err => {
          this.handleHttpError(err);
          return of({ data: [], total: 0 });
        }),
        finalize(() => {
          this.salesLoading = false;
          this.tableLoading = false;
          this.applyingFilters = false;
        })
      )
      .toPromise()
      .then(res => {
        this.sales = res?.data || res || [];
        this.totalPagesSales = Math.ceil(
          (res?.total || this.sales.length) / this.pageSize
        );
      });
  }

  /* =========================================================
     Purchases
     ========================================================= */

  loadPurchases() {
    const headers = this.getAuthHeaders();
    if (!headers) return Promise.resolve();

    this.purchasesLoading = true;
    this.tableLoading = true;

    let params = new HttpParams()
      .set('page', this.currentPagePurchases)
      .set('pageSize', this.pageSize);

    if (this.filters.startDate) params = params.set('startDate', this.filters.startDate);
    if (this.filters.endDate) params = params.set('endDate', this.filters.endDate);
    if (this.filters.search) params = params.set('search', this.filters.search);
    if (this.filters.supplier) params = params.set('supplier', this.filters.supplier);

    return this.http
      .get<any>('http://localhost:5046/api/admin/purchases', { headers, params })
      .pipe(
        catchError(err => {
          this.handleHttpError(err);
          return of({ data: [], total: 0 });
        }),
        finalize(() => {
          this.purchasesLoading = false;
          this.tableLoading = false;
          this.applyingFilters = false;
        })
      )
      .toPromise()
      .then(res => {
        this.purchases = res?.data || res || [];
        this.totalPagesPurchases = Math.ceil(
          (res?.total || this.purchases.length) / this.pageSize
        );
      });
  }

  /* =========================================================
     Filters & Pagination
     ========================================================= */

  applyFilters() {
    this.applyingFilters = true;
    this.activeTab === 'sales' ? this.loadSales() : this.loadPurchases();
  }

  resetFilters() {
    this.filters = {
      startDate: '',
      endDate: '',
      search: '',
      cashier: '',
      supplier: ''
    };
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return Object.values(this.filters).some(v => v !== '');
  }

  nextPage(type: 'sales' | 'purchases') {
    type === 'sales' ? ++this.currentPageSales && this.loadSales()
                     : ++this.currentPagePurchases && this.loadPurchases();
  }

  prevPage(type: 'sales' | 'purchases') {
    type === 'sales' ? --this.currentPageSales && this.loadSales()
                     : --this.currentPagePurchases && this.loadPurchases();
  }

  /* =========================================================
     Calculations
     ========================================================= */

  getSalesTotal() {
    return this.sales.reduce((t, s) => t + (s.total || 0), 0);
  }

  getAverageSale() {
    return this.sales.length ? this.getSalesTotal() / this.sales.length : 0;
  }

  getPurchasesTotal() {
    return this.purchases.reduce((t, p) => t + (p.totalCost || 0), 0);
  }

  getAveragePurchase() {
    return this.purchases.length ? this.getPurchasesTotal() / this.purchases.length : 0;
  }

  /* =========================================================
     Chart
     ========================================================= */

  loadMonthlySalesChart() {
    const headers = this.getAuthHeaders();
    if (!headers || !this.monthlySalesCanvas) return;

    this.http
      .get<any[]>('http://localhost:5046/api/admin/reports/monthly-sales', { headers })
      .subscribe(data => {
        const labels = data.map(d =>
          new Date(d.year, d.month - 1).toLocaleString('default', { month: 'short' })
        );
        const totals = data.map(d => d.total);
        this.renderMonthlySalesChart(labels, totals);
      });
  }

  renderMonthlySalesChart(labels: string[], data: number[]) {
    const ctx = this.monthlySalesCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.monthlySalesChart) {
      this.monthlySalesChart.destroy();
    }

    this.monthlySalesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Monthly Sales',
          data,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true
      }
    });
  }

  /* =========================================================
     Export
     ========================================================= */

  exportData() {
    this.activeTab === 'sales' ? this.exportSalesCSV() : this.exportPurchasesCSV();
  }

  exportSalesCSV() {
    const headers = this.getAuthHeaders();
    if (!headers) return;

    this.http.get('http://localhost:5046/api/admin/sales/export', {
      headers,
      responseType: 'blob'
    }).subscribe(blob =>
      this.downloadBlob(blob, 'sales-report.csv')
    );
  }

  exportPurchasesCSV() {
    const headers = this.getAuthHeaders();
    if (!headers) return;

    this.http.get('http://localhost:5046/api/admin/purchases/export', {
      headers,
      responseType: 'blob'
    }).subscribe(blob =>
      this.downloadBlob(blob, 'purchase-report.csv')
    );
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* =========================================================
     Errors
     ========================================================= */

  private handleHttpError(err: HttpErrorResponse) {
    if (err.status === 401) this.handleUnauthorized();
    else this.errorMessage = 'Failed to load data';
  }

  private handleUnauthorized() {
    this.errorMessage = 'Unauthorized. Please login again.';
  }

  retryLoadData() {
    this.errorMessage = '';
    this.loadDashboardData();
  }
}
