import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = 'http://localhost:5046/api/auth';

  private userSubject = new BehaviorSubject<any>(this.getUser());
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.api}/login`, { email, password })
      .pipe(
        tap(res => {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res));
          this.userSubject.next(res);
        })
      );
  }

  logout() {
    localStorage.clear();
    this.userSubject.next(null);
  }

  get token() {
    return localStorage.getItem('token');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  hasRole(role: string): boolean {
    return this.getUser()?.role === role;
  }
}
