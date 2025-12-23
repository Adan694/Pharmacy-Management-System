import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Sidebar } from '../Components/sidebar/sidebar';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.css']
})
export class Inventory implements OnInit {
  medicines: any[] = [];
  filteredMedicines: any[] = [];
  medicine = {
    name: '',
    brand: '',
    category: '',
    price: 0,
    quantity: 0,
    expiryDate: ''
  };
  today: string = '';

  showAddModal: boolean = false;
  showEditModal: boolean = false;

  editingMedicineId: number | null = null;
  editMedicine: any = {};
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  inventoryStats = {
    totalMedicines: 0,
    lowStock: 0,
    expired: 0,
    totalValue: 0
  };

  // Loading and error states
  loading: boolean = true;
  tableLoading: boolean = false;
  addingMedicine: boolean = false;
  updatingMedicine: boolean = false;
  error: string | null = null;

  private apiUrl = 'http://localhost:5046/api/admin/medicines';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  /** Generate headers with JWT token */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /** Load all data */
  loadDashboardData() {
    this.loading = true;
    this.error = null;
    this.loadMedicines();
  }

  /** Load all medicines */
  loadMedicines() {
    this.tableLoading = true;
    
    this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Failed to load medicines:', error);
        this.error = this.getErrorMessage(error);
        return of([]);
      }),
      finalize(() => {
        this.tableLoading = false;
        this.loading = false;
      })
    ).subscribe({
      next: res => {
        this.medicines = res;
        this.filteredMedicines = [...res];
        this.calculateInventoryStats();
        this.calculatePagination();
      }
    });
  }

  /** Check if a medicine is expired */
  isExpired(expiryDate: string | Date): boolean {
    return new Date(expiryDate) < new Date();
  }

  /** Add a new medicine */
   addMedicine() {
    this.addingMedicine = true;
    
    this.http.post(this.apiUrl, this.medicine, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Failed to add medicine:', error);
        alert('Failed to add medicine: ' + this.getErrorMessage(error));
        return of(null);
      }),
      finalize(() => {
        this.addingMedicine = false;
      })
    ).subscribe({
      next: (res: any) => {
        if (res) {
          alert('Medicine added successfully');
          this.loadMedicines();
          this.closeAddModal();
        }
      }   });
  }
  
  /** Delete a medicine */
  deleteMedicine(id: number) {
    if (!confirm('Are you sure you want to delete this medicine?')) return;

    this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Failed to delete medicine:', error);
        alert('Failed to delete medicine: ' + this.getErrorMessage(error));
        return of(null);
      })
    ).subscribe({
      next: () => this.loadMedicines()
    });
  }

  /** Start editing a medicine */
  // startEdit(med: any) {
  //   this.editingMedicineId = med.id;
  //   this.editMedicine = { ...med };
  //   // convert expiryDate to yyyy-MM-dd for input type="date"
  //   this.editMedicine.expiryDate = new Date(this.editMedicine.expiryDate).toISOString().split('T')[0];
  // }

  /** Cancel editing */
  cancelEdit() {
    this.editingMedicineId = null;
    this.editMedicine = {};
  }

  /** Update a medicine */
  // updateMedicine() {
  //   this.updatingMedicine = true;
    
  //   this.http.put(`${this.apiUrl}/${this.editingMedicineId}`, this.editMedicine, { headers: this.getHeaders() }).pipe(
  //     catchError((error) => {
  //       console.error('Failed to update medicine:', error);
  //       alert('Failed to update medicine: ' + this.getErrorMessage(error));
  //       return of(null);
  //     }),
  //     finalize(() => {
  //       this.updatingMedicine = false;
  //     })
  //   ).subscribe({
  //     next: (res: any) => {
  //       if (res) {
  //         alert('Medicine updated successfully');
  //         this.loadMedicines();
  //         this.cancelEdit();
  //       }
  //     }
  //   });
  // }

  /** Calculate inventory statistics */
  calculateInventoryStats() {
    this.inventoryStats.totalMedicines = this.medicines.length;
    this.inventoryStats.lowStock = this.medicines.filter(m => m.quantity <= 5).length;
    this.inventoryStats.expired = this.medicines.filter(m => this.isExpired(m.expiryDate)).length;
    this.inventoryStats.totalValue = this.medicines.reduce((total, m) => total + (m.price * m.quantity), 0);
  }

  /** Filter medicines based on search term */
  filterMedicines() {
    if (!this.searchTerm.trim()) {
      this.filteredMedicines = [...this.medicines];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredMedicines = this.medicines.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.brand.toLowerCase().includes(term) ||
        m.category.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.calculatePagination();
  }

  /** Calculate pagination */
  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredMedicines.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  /** Get current page medicines */
  getCurrentPageMedicines() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredMedicines.slice(startIndex, endIndex);
  }

  /** Next page */
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  /** Previous page */
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  /** Reset form */
  resetForm() {
    this.medicine = {
      name: '',
      brand: '',
      category: '',
      price: 0,
      quantity: 0,
      expiryDate: ''
    };
  }

  /** Get error message */
  getErrorMessage(error: any): string {
    if (error.status === 401) {
      return 'Unauthorized. Please log in again.';
    } else if (error.status === 403) {
      return 'You do not have permission to access this data.';
    } else if (error.status === 404) {
      return 'Data not found. Please try again later.';
    } else if (error.status >= 500) {
      return 'Server error. Please try again in a few moments.';
    } else if (error.status === 0) {
      return 'Network error. Please check your internet connection.';
    } else {
      return 'An error occurred. Please try again.';
    }
  }

  /** Retry loading data */
  retryLoadData() {
    this.error = null;
    this.loadDashboardData();
  }

   openAddModal() {
    this.showAddModal = true;
    // Reset form when opening modal
    this.resetForm();
  }

  /** Close Add Medicine Modal */
  closeAddModal() {
    this.showAddModal = false;
    this.resetForm();
  }

  /** Open Edit Medicine Modal */
  openEditModal(med: any) {
    this.showEditModal = true;
    this.startEdit(med);
  } closeEditModal() {
    this.showEditModal = false;
    this.cancelEdit();
  }

  /** Close modal when clicking on overlay */
  closeModalOnOverlay(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      if (this.showAddModal) this.closeAddModal();
      if (this.showEditModal) this.closeEditModal();
    }
  }
   startEdit(med: any) {
    this.editingMedicineId = med.id;
    this.editMedicine = { ...med };
    // convert expiryDate to yyyy-MM-dd for input type="date"
    this.editMedicine.expiryDate = new Date(this.editMedicine.expiryDate).toISOString().split('T')[0];
    this.showEditModal = true;
  }

  /** Update a medicine and close modal */
  updateMedicine() {
    this.updatingMedicine = true;
    
    this.http.put(`${this.apiUrl}/${this.editingMedicineId}`, this.editMedicine, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Failed to update medicine:', error);
        alert('Failed to update medicine: ' + this.getErrorMessage(error));
        return of(null);
      }),  finalize(() => {
        this.updatingMedicine = false;
      })
    ).subscribe({
      next: (res: any) => {
        if (res) {
          alert('Medicine updated successfully');
          this.loadMedicines();
          this.closeEditModal();
        }
      }
    });
  }

}