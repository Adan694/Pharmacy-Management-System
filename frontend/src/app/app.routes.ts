// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { AdminDashboard } from './admin/dashboard/dashboard';
import { PharmacistDashboard } from './pharmacist/dashboard/dashboard';
import { authGuard } from './shared/guards/authguard';
import { Users } from './admin/users/users';
import { Inventory } from './admin/inventory/inventory';
import { Reports } from './admin/reports/reports';
import { Sales } from './admin/sales/sales';
import { Purchase } from './admin/purchase/purchase';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'admin', component: AdminDashboard, canActivate: [authGuard],
    data: { roles: ['Admin'] }
  },
  { path: 'admin/users', component: Users },
  { path: 'admin/medicines', component: Inventory },
  {path: 'admin/reports', component: Reports},
  {path: 'admin/sales', component: Sales},
  {path: 'admin/purchase', component: Purchase},

  {
    path: 'pharmacist', component: PharmacistDashboard, canActivate: [authGuard],
    data: { roles: ['Pharmacist'] } },
  { path: '**', redirectTo: 'login' }
];
