import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = 'http://localhost:5046/api/admin';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==================== USER MANAGEMENT ====================
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any[]>('getUsers', []))
    );
  }

  createUser(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any>('createUser'))
    );
  }

  toggleUserStatus(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/status`, {}, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any>('toggleUserStatus'))
    );
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any>('updateUser'))
    );
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any>('deleteUser'))
    );
  }

  // ==================== SALES MANAGEMENT ====================
  getSales(params?: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    cashier?: string;
  }): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
      if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
      if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.cashier) httpParams = httpParams.set('cashier', params.cashier);
    }

    return this.http.get<any>(`${this.apiUrl}/sales`, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      catchError(this.handleError<any>('getSales', { data: [], total: 0 }))
    );
  }

  getSaleById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/sales/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any>('getSaleById'))
    );
  }

  createSale(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/sales`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any>('createSale'))
    );
  }

  exportSales(params?: {
    startDate?: string;
    endDate?: string;
    cashier?: string;
  }): Observable<Blob> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
      if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
      if (params.cashier) httpParams = httpParams.set('cashier', params.cashier);
    }

    return this.http.get(`${this.apiUrl}/sales/export`, {
      headers: this.getHeaders(),
      params: httpParams,
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError<Blob>('exportSales'))
    );
  }

  // ==================== PURCHASE MANAGEMENT ====================
  getPurchases(params?: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    supplier?: string;
  }): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
      if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
      if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.supplier) httpParams = httpParams.set('supplier', params.supplier);
    }

    return this.http.get<any>(`${this.apiUrl}/purchases`, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      catchError(this.handleError<any>('getPurchases', { data: [], total: 0 }))
    );
  }

  getPurchaseById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/purchases/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any>('getPurchaseById'))
    );
  }

  createPurchase(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/purchases`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any>('createPurchase'))
    );
  }

  updatePurchaseStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/purchases/${id}/status`, { status }, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any>('updatePurchaseStatus'))
    );
  }

  exportPurchases(params?: {
    startDate?: string;
    endDate?: string;
    supplier?: string;
  }): Observable<Blob> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
      if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
      if (params.supplier) httpParams = httpParams.set('supplier', params.supplier);
    }

    return this.http.get(`${this.apiUrl}/purchases/export`, {
      headers: this.getHeaders(),
      params: httpParams,
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError<Blob>('exportPurchases'))
    );
  }

  // ==================== REPORTS & ANALYTICS ====================
  getReportsSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/summary`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any>('getReportsSummary', {
        todaySalesCount: 0,
        todaySalesAmount: 0,
        totalSalesCount: 0,
        totalOrdersCount: 0,
        totalPurchasesAmount: 0,
        monthSalesAmount: 0
      }))
    );
  }

  getMonthlySales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports/monthly-sales`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any[]>('getMonthlySales', []))
    );
  }

  getSalesByCategory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports/sales-by-category`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any[]>('getSalesByCategory', []))
    );
  }

  getTopProducts(limit: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reports/top-products?limit=${limit}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any[]>('getTopProducts', []))
    );
  }

  // getDashboardStats(): Observable<any> {
  //   return this.http.get<any>(`${this.apiUrl}/dashboard/stats`, {
  //     headers: this.getHeaders()
  //   }).pipe(
  //     catchError(this.handleError<any>('getDashboardStats', {}))
  //   );
  // }
getDashboardStats(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/reports/summary`, {
    headers: this.getHeaders()
  });
}

  // ==================== INVENTORY MANAGEMENT ====================
  getInventory(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    lowStock?: boolean;
  }): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.category) httpParams = httpParams.set('category', params.category);
      if (params.lowStock) httpParams = httpParams.set('lowStock', params.lowStock.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/medicines`, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      catchError(this.handleError<any>('getInventory', { data: [], total: 0 }))
    );
  }

  updateInventory(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/inventory/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any>('updateInventory'))
    );
  }

 getLowStockItems(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/medicines`, {
    headers: this.getHeaders()
  }).pipe(
    // Filter medicines with quantity <= 5 on the frontend
    map(medicines => {
      if (!medicines || !Array.isArray(medicines)) return [];
      return medicines.filter(medicine => 
        medicine.quantity !== undefined && 
        medicine.quantity !== null && 
        medicine.quantity <= 5
      );
    }),
    catchError(this.handleError<any[]>('getLowStockItems', []))
  );
}

  // ==================== CUSTOMER MANAGEMENT ====================
  getCustomers(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<any>(`${this.apiUrl}/customers`, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      catchError(this.handleError<any>('getCustomers', { data: [], total: 0 }))
    );
  }

  createCustomer(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/customers`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any>('createCustomer'))
    );
  }

  getCustomerById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customers/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any>('getCustomerById'))
    );
  }

  // ==================== SUPPLIER MANAGEMENT ====================
  getSuppliers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/suppliers`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any[]>('getSuppliers', []))
    );
  }

  createSupplier(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/suppliers`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError<any>('createSupplier'))
    );
  }

  // ==================== UTILITY METHODS ====================
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // Handle specific error cases
      if (error.status === 401) {
        // Unauthorized - redirect to login
        console.error('Unauthorized access - redirecting to login');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.status === 403) {
        console.error('Forbidden - insufficient permissions');
      } else if (error.status === 404) {
        console.error('Resource not found');
      } else if (error.status >= 500) {
        console.error('Server error occurred');
      }
      
      // Return a safe result
      return of(result as T);
    };
  }

  // Helper method for blob downloads
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Authentication check
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  // Get user role from token (simple implementation)
  getUserRole(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch {
      return null;
    }
  }

  getYearlySales(): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.apiUrl}/reports/yearly-sales`,
    { headers: this.getHeaders() }
  ).pipe(
    catchError(this.handleError<any[]>('getYearlySales', []))
  );
  }
  
  getMonthlyPurchases(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/reports/monthly-purchases`, {
    headers: this.getHeaders()
  });
}

getYearlyPurchases(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/reports/yearly-purchases`, {
    headers: this.getHeaders()
  });
}

}