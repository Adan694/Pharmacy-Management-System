import { Component } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/authservice';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pharmacist-sidebar',
  imports: [RouterModule, RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
    constructor(private auth: AuthService, private router: Router) {}
  
logout() {
    this.auth.logout();
    window.location.href = '/login';
  }
}
