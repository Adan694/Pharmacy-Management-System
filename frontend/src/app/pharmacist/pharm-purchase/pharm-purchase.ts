import { Component, HostListener, OnInit } from '@angular/core';
import { PharmacistService } from '../../shared/services/pharmacistservice';
import { Sidebar } from '../sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pharmacist-purchases',
  templateUrl: './pharm-purchase.html',
  styleUrls: ['./pharm-purchase.css'],
  imports: [Sidebar, CommonModule, FormsModule]
})
export class PharmPurchase implements OnInit {

  purchases: any[] = [];
  medicines: any[] = [];
  
  // Toast notification properties
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  // Add 'unitPrice' and 'notes' property to newPurchase
  newPurchase = {
    supplier: '',
    medicineId: 0,
    medicineName: '',
    quantity: 1,
    unitPrice: 0, // ADDED
    totalCost: 0,
    status: 'Pending',
    notes: ''  // Added notes property
  };

  // Pagination properties
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  filteredPurchases: any[] = [];

  // Modal property
  selectedPurchase: any = null;
  private scrollPosition = 0;

  constructor(private pharmacistService: PharmacistService) {}

  ngOnInit() {
    this.loadPurchases();
    this.loadMedicines();
  }

  loadPurchases() {
    this.pharmacistService.getPurchases().subscribe({
      next: (data) => {
        this.purchases = data;
        this.updatePagination();
        console.log('Purchases:', data);
      },
      error: (error) => {
        console.error('Error loading purchases:', error);
        this.showToastMessage('Error loading purchases', 'error');
      }
    });
  }

  loadMedicines() {
    this.pharmacistService.getInventory().subscribe({
      next: (data) => {
        this.medicines = data;
        console.log('Medicines:', data);
      },
      error: (error) => {
        console.error('Error loading medicines:', error);
        this.showToastMessage('Error loading medicines', 'error');
      }
    });
  }

  onMedicineChange() {
    if (this.newPurchase.medicineId === 0) {
      // New medicine, reset prices
      this.newPurchase.unitPrice = 0;
      this.newPurchase.totalCost = 0;
      this.newPurchase.medicineName = '';
    } else {
      const selected = this.medicines.find(m => m.id === +this.newPurchase.medicineId);
      if (selected) {
        this.newPurchase.medicineName = selected.name;
        this.newPurchase.unitPrice = selected.price || selected.unitPrice || 0;
        this.calculateTotalCost();
      }
    }
  }

  onQuantityChange() {
    this.calculateTotalCost();
  }

  onUnitPriceChange() {
    this.calculateTotalCost();
  }

  calculateTotalCost() {
    if (this.newPurchase.unitPrice > 0 && this.newPurchase.quantity > 0) {
      this.newPurchase.totalCost = this.newPurchase.unitPrice * this.newPurchase.quantity;
    } else {
      this.newPurchase.totalCost = 0;
    }
  }

  resetForm() {
    this.newPurchase = { 
      supplier: '', 
      medicineId: 0, 
      medicineName: '', 
      quantity: 1, 
      unitPrice: 0,
      totalCost: 0, 
      status: 'Pending',
      notes: ''
    };
    this.showToastMessage('Form reset successfully', 'success');
  }

  addPurchase() {
    // Validate form
    if (!this.newPurchase.supplier.trim()) {
      this.showToastMessage('Please enter supplier name', 'error');
      return;
    }

    if (this.newPurchase.medicineId === 0 && !this.newPurchase.medicineName.trim()) {
      this.showToastMessage('Please enter medicine name for new medicine', 'error');
      return;
    }

    if (this.newPurchase.medicineId !== 0 && !this.newPurchase.medicineName.trim()) {
      this.showToastMessage('Please select a medicine', 'error');
      return;
    }

    if (this.newPurchase.quantity < 1) {
      this.showToastMessage('Quantity must be at least 1', 'error');
      return;
    }

    if (this.newPurchase.unitPrice <= 0) {
      this.showToastMessage('Please enter a valid unit price', 'error');
      return;
    }

    // Determine medicine name
    const medicineName = this.newPurchase.medicineName.trim();

    const payload = {
      supplier: this.newPurchase.supplier.trim(),
      medicine: medicineName,
      quantity: this.newPurchase.quantity,
      unitPrice: this.newPurchase.unitPrice,
      totalCost: this.newPurchase.totalCost,
      status: this.newPurchase.status,
      notes: this.newPurchase.notes.trim(),
      date: new Date().toISOString(),
      orderNumber: this.generateOrderNumber()
    };

    this.pharmacistService.addPurchase(payload).subscribe({
      next: (res) => {
        console.log('Purchase added:', res);
        this.showToastMessage('Purchase added successfully!', 'success');
        
        this.resetForm();
        this.loadPurchases();
        this.loadMedicines();
      },
      error: (error) => {
        console.error('Error adding purchase:', error);
        this.showToastMessage('Error adding purchase', 'error');
      }
    });
  }

  // Pagination methods
  getPagedPurchases(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.purchases.slice(startIndex, endIndex);
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.purchases.length ? this.purchases.length : end;
  }

  getVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1, '...', this.totalPages - 3, this.totalPages - 2, this.totalPages - 1, this.totalPages);
      } else {
        pages.push(1, '...', this.currentPage - 1, this.currentPage, this.currentPage + 1, '...', this.totalPages);
      }
    }
    
    return pages;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.purchases.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  // Modal methods
  openPurchaseDetails(purchase: any): void {
    this.selectedPurchase = purchase;
    this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // Lock scroll
    document.body.classList.add('modal-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.selectedPurchase = null;
    
    // Restore scroll
    document.body.classList.remove('modal-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    
    // Restore scroll position
    window.scrollTo(0, this.scrollPosition);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (this.selectedPurchase) {
      this.closeModal();
    }
  }

  markReceived(purchaseId: number): void {
    this.pharmacistService.receivePurchase(purchaseId).subscribe({
      next: (res) => {
        this.showToastMessage('Purchase marked as received!', 'success');
        this.loadPurchases();
        this.closeModal();
      },
      error: (error) => {
        this.showToastMessage('Error updating purchase status', 'error');
      }
    });
  }

  cancelPurchase(purchaseId: number): void {
    if (confirm('Are you sure you want to cancel this purchase?')) {
      this.pharmacistService.cancelPurchase(purchaseId).subscribe({
        next: (res) => {
          this.showToastMessage('Purchase cancelled successfully!', 'success');
          this.loadPurchases();
          this.closeModal();
        },
        error: (error) => {
          this.showToastMessage('Error cancelling purchase', 'error');
        }
      });
    }
  }

  // Helper methods
  scrollToForm() {
    const formElement = document.querySelector('.purchase-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  isLowQuantity(purchase: any): boolean {
    return purchase.quantity < 10;
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return 'badge pending';
      case 'received': return 'badge received';
      case 'cancelled': return 'badge cancelled';
      default: return 'badge';
    }
  }

  getTotalQuantity(): number {
    return this.purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);
  }

  getTotalCost(): number {
    return this.purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
  }

  getTotalPurchases(): number {
    return this.purchases.length;
  }

  getTotalSpent(): number {
    return this.getTotalCost();
  }

  getPendingCount(): number {
    return this.purchases.filter(p => p.status === 'Pending').length;
  }

  getReceivedCount(): number {
    return this.purchases.filter(p => p.status === 'Received').length;
  }

  getCancelledCount(): number {
    return this.purchases.filter(p => p.status === 'Cancelled').length;
  }

  showToastMessage(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.hideToast();
    }, 3000);
  }

  hideToast() {
    this.showToast = false;
  }

  private generateOrderNumber(): string {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    const searchTerm = input.value.toLowerCase();
    console.log('Searching for:', searchTerm);
  }

  onStatusFilter(event: Event) {
    const select = event.target as HTMLSelectElement;
    const status = select.value;
    console.log('Filtering by status:', status);
  }

  getCalculatedUnitPrice(purchase: any): number {
    if (purchase.unitPrice) {
      return purchase.unitPrice;
    }
    if (purchase.totalCost && purchase.quantity && purchase.quantity > 0) {
      return purchase.totalCost / purchase.quantity;
    }
    return 0;
  }
}