import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../shared/services/adminservice';
import { Sidebar } from '../Components/sidebar/sidebar';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule, Sidebar],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit {

  user = {
    name: '',
    email: '',
    password: '',
    role: 'Pharmacist'
  };

  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // Modal state
  showCreateModal: boolean = false;
  showPassword: boolean = false;

  // Stats
  totalUsers: number = 0;
  activeUsers: number = 0;
  inactiveUsers: number = 0;

  // Loading and error states
  loading: boolean = true;
  tableLoading: boolean = false;
  creatingUser: boolean = false;
  togglingUserId: number | null = null;
  error: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.tableLoading = true;
    this.error = null;
    
    this.adminService.getUsers().pipe(
      catchError((error) => {
        console.error('Failed to load users:', error);
        this.error = this.getErrorMessage(error);
        return of([]);
      }),
      finalize(() => {
        this.tableLoading = false;
        this.loading = false;
      })
    ).subscribe(res => {
      this.users = res;
      this.filteredUsers = [...res];
      this.calculateStats();
      this.calculatePagination();
    });
  }

  createUser() {
    if (!this.user.name || !this.user.email || !this.user.password || !this.user.role) {
      alert('Please fill all required fields');
      return;
    }

    this.creatingUser = true;
    
    this.adminService.createUser(this.user).pipe(
      catchError((error) => {
        console.error('Failed to create user:', error);
        alert('Failed to create user: ' + this.getErrorMessage(error));
        return of(null);
      }),
      finalize(() => {
        this.creatingUser = false;
      })
    ).subscribe(() => {
      alert('User created successfully');
      this.closeCreateModal();
      this.loadUsers();
    });
  }

  toggleStatus(id: number) {
    if (!confirm('Are you sure you want to change this user\'s status?')) return;

    this.togglingUserId = id;
    
    this.adminService.toggleUserStatus(id).pipe(
      catchError((error) => {
        console.error('Failed to toggle user status:', error);
        alert('Failed to change user status: ' + this.getErrorMessage(error));
        return of(null);
      }),
      finalize(() => {
        this.togglingUserId = null;
      })
    ).subscribe(() => {
      this.loadUsers();
    });
  }

  /** Modal Methods */
  openCreateModal() {
    this.showCreateModal = true;
    this.resetForm();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.showPassword = false;
    this.resetForm();
  }

  closeModalOnOverlay(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.closeCreateModal();
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  /** Calculate password strength */
  getPasswordStrength() {
    const password = this.user.password;
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return Math.min(strength, 4); // Max strength of 4
  }

  getPasswordStrengthClass() {
    const strength = this.getPasswordStrength();
    if (strength <= 1) return 'weak';
    if (strength === 2) return 'fair';
    if (strength === 3) return 'good';
    return 'strong';
  }

  getPasswordStrengthText() {
    const strength = this.getPasswordStrength();
    if (strength <= 1) return 'Weak - Add more characters and variety';
    if (strength === 2) return 'Fair - Could be stronger';
    if (strength === 3) return 'Good - Strong password';
    return 'Strong - Excellent password!';
  }

  /** Calculate user statistics */
  calculateStats() {
    this.totalUsers = this.users.length;
    this.activeUsers = this.users.filter(u => u.isActive).length;
    this.inactiveUsers = this.users.filter(u => !u.isActive).length;
  }

  /** Filter users based on search term */
  filterUsers() {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.calculatePagination();
  }

  /** Calculate pagination */
  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
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
    this.user = {
      name: '',
      email: '',
      password: '',
      role: 'Pharmacist'
    };
    this.showPassword = false;
  }

  /** Get error message */
  getErrorMessage(error: any): string {
    if (error.status === 401) {
      return 'Unauthorized. Please log in again.';
    } else if (error.status === 403) {
      return 'You do not have permission to perform this action.';
    } else if (error.status === 409) {
      return 'User with this email already exists.';
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
    this.loading = true;
    this.loadUsers();
  }
}