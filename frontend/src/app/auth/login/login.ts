import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  login() {
    this.http.post<any>('http://localhost:5046/api/auth/login', {
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('role', res.role);
        localStorage.setItem('email', res.email);

        // role-based redirect
        if (res.role === 'Admin') this.router.navigate(['/admin']);
        else if (res.role === 'Pharmacist') this.router.navigate(['/pharmacist']);
        else if (res.role === 'Cashier') this.router.navigate(['/cashier']);
      },
       error: (err) => {
      alert(err.error?.message || 'Invalid email or password');
    }
    });
  }
}
