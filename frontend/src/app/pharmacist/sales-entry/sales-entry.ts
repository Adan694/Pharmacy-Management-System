import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PharmacistService } from '../../shared/services/pharmacistservice';
import { Sidebar } from '../sidebar/sidebar';
import { Toast } from '../../shared/toast/toast';

interface RecentSale {
  time: Date;
  medicine: string;
  quantity: number;
  amount: number;
  payment: string;
}

@Component({
  selector: 'app-sales-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, Toast],
  templateUrl: './sales-entry.html',
  styleUrls: ['./sales-entry.css']
})
export class SalesEntry implements OnInit, AfterViewInit {
  @ViewChild('toast') toast!: Toast;

  // Form fields
  medicines: any[] = [];
  selectedMedicine: any = null;
  quantity = 1;
  price = 0;
  discount = 0;
  paymentType = 'Cash';
  customerName = '';
  customerContact = '';
  loading = false;
  
  // Display fields
  currentTime = new Date();
  recentSales: RecentSale[] = [];
  receiptNumber: string = '';
  
  // Local storage key
  private readonly RECENT_SALES_KEY = 'pharmacy_recent_sales';

  constructor(private pharmacistService: PharmacistService) {}

  ngOnInit() {
    this.loadMedicines();
    this.loadRecentSalesFromStorage();
    this.generateReceiptNumber();
    
    // Update time every minute
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  ngAfterViewInit() {
    console.log('Toast component loaded');
  }

  // ========== MEDICINE METHODS ==========
  loadMedicines() {
    this.pharmacistService.getInventory().subscribe({
      next: (res) => {
        // Map medicine data to ensure consistent structure
        this.medicines = res.map(medicine => ({
          id: medicine.id,
          name: medicine.name || medicine.medicineName || 'Unknown Medicine',
          brand: medicine.brand || 'Generic',
          category: medicine.category || 'General',
          price: medicine.price || medicine.unitPrice || 0,
          quantity: medicine.quantity || medicine.stock || 0,
          expiryDate: medicine.expiryDate || medicine.expirationDate
        }));
        console.log('Loaded and mapped medicines:', this.medicines);
      },
      error: (error) => {
        console.error('Error loading medicines:', error);
        this.toast.showToast('Error loading medicines', 'error');
      }
    });
  }

  onMedicineSelect() {
    if (this.selectedMedicine) {
      this.price = this.selectedMedicine.price || 0;
      this.quantity = 1;
      this.discount = 0;
      console.log('Selected medicine:', this.selectedMedicine.name, 'Price:', this.price);
    }
  }

  getSelectedPrice(): number {
    return this.selectedMedicine ? (this.selectedMedicine.price || 0) : 0;
  }

  getAvailableStock(): number {
    return this.selectedMedicine ? (this.selectedMedicine.quantity || 0) : 0;
  }

  getRemainingStock(): number {
    return this.getAvailableStock() - this.quantity;
  }

  getStockPercentage(): number {
    const total = this.getAvailableStock();
    return total > 0 ? (this.getRemainingStock() / total) * 100 : 0;
  }

  getStockStatusMessage(): string {
    const remaining = this.getRemainingStock();
    if (remaining <= 0) return '⚠️ Out of stock after sale';
    if (remaining < 10) return '⚠️ Low stock after sale';
    if (remaining < 20) return '⚠️ Moderate stock after sale';
    return '✅ Adequate stock remaining';
  }

  isExpired(medicine: any): boolean {
    if (!medicine.expiryDate) return false;
    const expiryDate = new Date(medicine.expiryDate);
    return expiryDate < new Date();
  }

  // ========== QUANTITY METHODS ==========
  increaseQuantity() {
    if (this.quantity < this.getAvailableStock()) {
      this.quantity++;
      this.calculateTotal();
    }
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
      this.calculateTotal();
    }
  }

  calculateTotal() {
    // Ensure quantity doesn't exceed available stock
    if (this.quantity > this.getAvailableStock()) {
      this.quantity = this.getAvailableStock();
    }
  }

  // ========== CALCULATION METHODS ==========
  calculateSubtotal(): number {
    return this.price * this.quantity;
  }

  calculateFinalAmount(): number {
    const subtotal = this.calculateSubtotal();
    return Math.max(0, subtotal - this.discount);
  }

  generateReceiptNumber(): void {
    const date = new Date();
    const timestamp = Math.floor(date.getTime() / 1000).toString().slice(-6); // Use seconds, not milliseconds
    this.receiptNumber = `RCP-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${timestamp}`;
  }

  // ========== SALE SUBMISSION ==========
  submitSale() {
    if (!this.isFormValid()) {
      this.toast.showToast('Please fill all required fields correctly', 'error');
      return;
    }

    if (this.quantity > this.getAvailableStock()) {
      this.toast.showToast(`Only ${this.getAvailableStock()} units available in stock`, 'error');
      return;
    }

    this.loading = true;

    const payload = {
      ProductId: this.selectedMedicine.id,
      Medicine: this.selectedMedicine.name, // Make sure this is included
      Quantity: this.quantity,
      Price: this.price,
      PaymentType: this.paymentType,
      Discount: this.discount,
      Customer: this.customerName || 'Walk-in Customer',
      CustomerContact: this.customerContact,
      TotalAmount: this.calculateFinalAmount()
    };

    console.log('Submitting sale:', payload);

    this.pharmacistService.createSale(payload).subscribe({
      next: (res) => {
        this.toast.showToast('✅ Sale completed successfully!', 'success');
        this.loading = false;

        // Add to recent sales
        this.addToRecentSales(payload);
        
        // Reset form for next sale
        this.resetFormForNext();
        
        // Generate new receipt number
        this.generateReceiptNumber();
        
        // Refresh medicines to update stock
        this.loadMedicines();
      },
      error: (err) => {
        console.error('Sale error:', err);
        this.toast.showToast(err.error?.message || 'Failed to complete sale', 'error');
        this.loading = false;
      }
    });
  }

  isFormValid(): boolean {
    return !!this.selectedMedicine && 
           this.quantity > 0 && 
           this.quantity <= this.getAvailableStock() && 
           this.price > 0 && 
           !!this.paymentType;
  }

  // ========== FORM RESET METHODS ==========
  resetFormForNext() {
    // Keep customer info, reset medicine details
    this.selectedMedicine = null;
    this.quantity = 1;
    this.price = 0;
    this.discount = 0;
  }

  resetForm() {
    this.selectedMedicine = null;
    this.quantity = 1;
    this.price = 0;
    this.discount = 0;
    this.paymentType = 'Cash';
    this.customerName = '';
    this.customerContact = '';
  }

  // ========== RECENT SALES (LOCALSTORAGE) ==========
  loadRecentSalesFromStorage() {
    console.log('Loading recent sales from localStorage...');
    try {
      const storedSales = localStorage.getItem(this.RECENT_SALES_KEY);
      
      if (storedSales) {
        const parsedSales = JSON.parse(storedSales);
        console.log('Found sales in storage:', parsedSales);
        
        this.recentSales = parsedSales.map((sale: any) => ({
          time: new Date(sale.time),
          medicine: sale.medicine || 'Unknown',
          quantity: sale.quantity || 1,
          amount: sale.amount || sale.TotalAmount || 0,
          payment: sale.payment || sale.PaymentType || 'Cash'
        })).sort((a: RecentSale, b: RecentSale) => 
          new Date(b.time).getTime() - new Date(a.time).getTime()
        );
        
        console.log('Loaded recent sales:', this.recentSales.length);
      } else {
        this.recentSales = [];
        console.log('No recent sales found in storage');
      }
    } catch (error) {
      console.error('Error loading recent sales from storage:', error);
      this.recentSales = [];
    }
  }

  saveRecentSalesToStorage() {
    try {
      // Convert to plain objects (Date to ISO string) and limit to last 20 sales
      const salesToStore = this.recentSales
        .slice(0, 20)
        .map(sale => ({
          time: sale.time.toISOString(),
          medicine: sale.medicine,
          quantity: sale.quantity,
          amount: sale.amount,
          payment: sale.payment
        }));
      
      localStorage.setItem(this.RECENT_SALES_KEY, JSON.stringify(salesToStore));
      console.log('Saved to localStorage:', salesToStore.length, 'sales');
    } catch (error) {
      console.error('Error saving recent sales to storage:', error);
    }
  }

  addToRecentSales(payload: any) {
    const saleRecord: RecentSale = {
      time: new Date(),
      medicine: payload.Medicine || this.selectedMedicine?.name || 'Unknown',
      quantity: payload.Quantity,
      amount: payload.TotalAmount,
      payment: payload.PaymentType
    };
    
    console.log('Adding to recent sales:', saleRecord);
    
    // Add to beginning of array
    this.recentSales.unshift(saleRecord);
    
    // Keep only last 20 sales
    if (this.recentSales.length > 20) {
      this.recentSales.pop();
    }
    
    // Save to localStorage
    this.saveRecentSalesToStorage();
  }

  // ========== UTILITY METHODS ==========
  addAnotherItem() {
    this.toast.showToast('Multi-item feature coming soon!', 'info');
  }

  printReceipt() {
    window.print();
  }
}