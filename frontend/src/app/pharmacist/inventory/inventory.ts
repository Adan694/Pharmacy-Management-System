import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../sidebar/sidebar';
import { PharmacistService } from '../../shared/services/pharmacistservice';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-pharmacist-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.css']
})
export class PharmacistInventory implements OnInit {
  medicines: any[] = [];
  showModal = false;
  edit: any = {};
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  saveSuccess = false;
  
  // Statistics
  okCount = 0;
  nearExpiryCount = 0;
  expiredCount = 0;
  
  // For date validation
  today = new Date().toISOString().split('T')[0];

  constructor(private pharmacistService: PharmacistService) {}

  ngOnInit() {
    this.loadInventory();
  }

  loadInventory() {
  this.isLoading = true;
  this.errorMessage = '';
  
  console.log('Loading inventory...');
  
  this.pharmacistService.getInventory().pipe(
    catchError(error => {
      console.error('Error loading inventory:', error);
      console.error('Error status:', error.status);
      console.error('Error message:', error.message);
      this.errorMessage = 'Failed to load inventory. Please try again.';
      return of([]);
    }),
    finalize(() => {
      this.isLoading = false;
      console.log('Loading completed');
    })
  ).subscribe({
    next: (res) => {
      console.log('✅ API Response received:', res);
      console.log('Response type:', typeof res);
      console.log('Is array?', Array.isArray(res));
      
      if (res && Array.isArray(res)) {
        console.log('Number of items:', res.length);
        console.log('First item keys:', Object.keys(res[0]));
        console.log('First item full data:', res[0]);
        
        // Log each medicine individually
        res.forEach((medicine, index) => {
          console.log(`Medicine ${index + 1}:`, {
            id: medicine.id,
            name: medicine.name,
            brand: medicine.brand,
            category: medicine.category,
            quantity: medicine.quantity,
            expiryDate: medicine.expiryDate
          });
        });
      }
      
      this.medicines = res || [];
      this.calculateStatistics();
    },
    error: (err) => {
      console.error('❌ Subscription error:', err);
    }
  });
}
  calculateStatistics() {
    this.okCount = 0;
    this.nearExpiryCount = 0;
    this.expiredCount = 0;
    
    this.medicines.forEach(medicine => {
      if (this.isExpired(medicine.expiryDate)) {
        this.expiredCount++;
      } else if (this.isNearExpiry(medicine.expiryDate)) {
        this.nearExpiryCount++;
      } else {
        this.okCount++;
      }
    });
  }

  isExpired(date: string | Date): boolean {
    try {
      return new Date(date) < new Date();
    } catch {
      return false;
    }
  }

  isNearExpiry(date: string | Date): boolean {
    try {
      const expiryDate = new Date(date);
      const now = new Date();
      
      // Reset times to compare dates only
      expiryDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays > 0 && diffDays <= 30;
    } catch {
      return false;
    }
  }

  getDaysLeft(date: string | Date): number {
    try {
      const expiryDate = new Date(date);
      const now = new Date();
      
      // Reset times to compare dates only
      expiryDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      
      const diffTime = expiryDate.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return -1;
    }
  }

 openUpdateModal(med: any) {
    this.edit = { ...med };

    // Format date for input[type="date"]
    if (med.expiryDate) {
        const date = new Date(med.expiryDate);
        this.edit.expiryDate = !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
    }

    this.showModal = true;
    this.saveSuccess = false;
    this.errorMessage = '';

    // 🔹 Disable background scroll
    document.body.style.overflow = 'hidden';
}

closeModal() {
  this.showModal = false;
  this.edit = {};
  this.errorMessage = '';
  this.saveSuccess = false;

  // Restore background scroll
  document.body.style.overflow = '';
}



  validateForm(): boolean {
    // Check quantity
    if (this.edit.quantity === null || this.edit.quantity === undefined || this.edit.quantity === '') {
      this.errorMessage = 'Quantity is required';
      return false;
    }
    
    const quantity = Number(this.edit.quantity);
    if (isNaN(quantity) || quantity < 0) {
      this.errorMessage = 'Quantity must be a positive number';
      return false;
    }
    
    // Check expiry date
    if (!this.edit.expiryDate) {
      this.errorMessage = 'Expiry date is required';
      return false;
    }
    
    const expiryDate = new Date(this.edit.expiryDate);
    if (isNaN(expiryDate.getTime())) {
      this.errorMessage = 'Invalid expiry date';
      return false;
    }
    
    // Optional: Check if expiry date is in the past
    if (expiryDate < new Date()) {
      this.errorMessage = 'Expiry date cannot be in the past';
      return false;
    }
    
    return true;
  }

  updateMedicine() {
  if (!this.validateForm()) {
    return;
  }

  this.isSaving = true;
  this.errorMessage = '';

  this.pharmacistService.updateStock(this.edit.id, {
    quantity: Number(this.edit.quantity),
    expiryDate: this.edit.expiryDate
  }).pipe(
    catchError(error => {
      console.error('Error updating medicine:', error);
      this.errorMessage = error.message || 'Failed to update medicine. Please try again.';
      this.saveSuccess = false;
      return of(null);
    }),
    finalize(() => {
      this.isSaving = false;
    })
  ).subscribe(response => {
    if (response !== null) {
      this.saveSuccess = true;

      // Update local medicine array
      const index = this.medicines.findIndex(m => m.id === this.edit.id);
      if (index !== -1) {
        this.medicines[index] = {
          ...this.medicines[index],
          quantity: Number(this.edit.quantity),
          expiryDate: this.edit.expiryDate
        };
        this.calculateStatistics();
      }

      // ✅ Close modal after short delay (can be 0.8–1s)
      setTimeout(() => {
        this.closeModal();
      }, 800);
    }
  });
}


  // Utility method for badge styling
  getStatusClass(medicine: any): string {
    if (this.isExpired(medicine.expiryDate)) {
      return 'expired';
    } else if (this.isNearExpiry(medicine.expiryDate)) {
      return 'warning';
    } else {
      return 'ok';
    }
  }

  getStatusText(medicine: any): string {
    if (this.isExpired(medicine.expiryDate)) {
      return 'Expired';
    } else if (this.isNearExpiry(medicine.expiryDate)) {
      return 'Near Expiry';
    } else {
      return 'OK';
    }
  }

  // For display purposes
  formatDate(date: string | Date): string {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  }
}