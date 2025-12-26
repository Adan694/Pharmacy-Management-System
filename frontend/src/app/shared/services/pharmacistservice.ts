import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PharmacistService {
  private apiUrl = 'http://localhost:5046/api/pharmacist';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getInventoryStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/inventory/stats`, {
      headers: this.getHeaders()
    });
  }
  getInventory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/inventory`, {
      headers: this.getHeaders()
    });
  }

  updateStock(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/inventory/${id}`, data, {
      headers: this.getHeaders()
    });
  }
   getAlerts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/alerts`, {
      headers: this.getHeaders()
    });
  }
 getTopSellingMedicines(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/sales/top-medicines`, {
    headers: this.getHeaders()
  });
}
createSale(data: any) {
  return this.http.post(
    `${this.apiUrl}/sales`,
    data,
    { headers: this.getHeaders() }
  );
}

getPurchases(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/purchases`, { headers: this.getHeaders() });
}

addPurchase(data: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/purchases`, data, { headers: this.getHeaders() });
}

receivePurchase(id: number): Observable<any> {
  return this.http.put(`${this.apiUrl}/purchases/${id}/receive`, {}, { headers: this.getHeaders() });
}
cancelPurchase(id: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/purchases/${id}/cancel`, 
      {}, 
      { headers: this.getHeaders() }
    );
  }

}
