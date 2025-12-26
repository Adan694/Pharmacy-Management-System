// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { AdminDashboard } from './admin/dashboard/dashboard';
import { authGuard } from './shared/guards/authguard';
import { Users } from './admin/users/users';
import { Inventory } from './admin/inventory/inventory';
import { Sales } from './admin/sales/sales';
import { Purchase } from './admin/purchase/purchase';
import { PharmacistDashboard } from './pharmacist/Pharmacistdashboard/Pharmacistdashboard';
import { PharmacistInventory } from './pharmacist/inventory/inventory';
import { Alerts } from './pharmacist/alerts/alerts';
import { PharmacistSales } from './pharmacist/pharmacistsales/pharmacistsales';
import { SalesEntry } from './pharmacist/sales-entry/sales-entry';
import { PharmPurchase } from './pharmacist/pharm-purchase/pharm-purchase';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'admin', component: AdminDashboard, canActivate: [authGuard],
    data: { roles: ['Admin'] }
  },
  { path: 'admin/users', component: Users },
  { path: 'admin/medicines', component: Inventory },
  {path: 'admin/sales', component: Sales},
  {path: 'admin/purchase', component: Purchase},

  {
    path: 'pharmacist', component: PharmacistDashboard, canActivate: [authGuard],
    data: { roles: ['Pharmacist'] }
  },
    {path: 'pharmacist/inventory', component: PharmacistInventory},
{ path: 'pharmacist/sales', component: PharmacistSales },
{ path: 'pharmacist/sales-entry', component: SalesEntry },
{ path: 'pharmacist/purchase', component: PharmPurchase },

  // { path: '**', redirectTo: 'login' },
    {path: 'pharmacist/alerts', component: Alerts },
  
];
