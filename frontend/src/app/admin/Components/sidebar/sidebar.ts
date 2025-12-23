import { Component, HostListener, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../shared/services/authservice';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  // Sidebar states
  isSidebarOpen: boolean = true;
  isSidebarCollapsed: boolean = false;
  
  // User info
  user: any = null;
  
  // Screen size detection
  isMobile: boolean = false;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    // Check screen size on init
    this.checkScreenSize();
    
    // Load user info
    this.loadUserInfo();
    
    // Initialize sidebar state based on screen size
    this.initializeSidebarState();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
    this.initializeSidebarState();
  }

  /** Check current screen size */
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
  }

  /** Initialize sidebar state based on screen size */
  initializeSidebarState() {
    if (this.isMobile) {
      // On mobile: sidebar starts closed
      this.isSidebarOpen = false;
      this.isSidebarCollapsed = false;
    } else {
      // On desktop/tablet: sidebar open, collapsed on tablet
      this.isSidebarOpen = true;
      this.isSidebarCollapsed = window.innerWidth <= 1024 && window.innerWidth > 768;
    }
  }

  /** Toggle sidebar visibility */
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /** Close sidebar on mobile after clicking a link */
  closeMobileSidebar() {
    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }

  /** Load user information */
  loadUserInfo() {
    // Try to get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        this.user = JSON.parse(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
        this.user = null;
      }
    }
    
    // If not in localStorage, try to get from AuthService
    if (!this.user) {
      const authUser = this.auth.getUser();
      if (authUser) {
        this.user = authUser;
      }
    }
  }

  /** Get user initial for avatar */
  getUserInitial(): string {
    if (!this.user || !this.user.name) return 'U';
    return this.user.name.charAt(0).toUpperCase();
  }

  /** Logout function */
  logout() {
    this.auth.logout();
    window.location.href = '/login';
  }

  /** Handle escape key to close sidebar */
  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isMobile && this.isSidebarOpen) {
      this.isSidebarOpen = false;
    }
  }
}