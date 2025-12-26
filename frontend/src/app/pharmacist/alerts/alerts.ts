import { Component, OnInit } from '@angular/core';
import { PharmacistService } from '../../shared/services/pharmacistservice';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-alerts',
  imports: [FormsModule, CommonModule, Sidebar],
  templateUrl: './alerts.html',
  styleUrl: './alerts.css',
})
export class Alerts implements OnInit {
  alerts: any[] = [];
  filteredAlerts: any[] = [];
  currentFilter: string = 'all';

  constructor(private pharmacistService: PharmacistService) {}

  ngOnInit() {
    this.loadAlerts();
  }

  loadAlerts() {
    this.pharmacistService.getAlerts().subscribe(data => {
      this.alerts = data;
      this.applyFilter();
    });
  }

  setFilter(filter: string) {
    this.currentFilter = filter;
    this.applyFilter();
  }

  applyFilter() {
    if (this.currentFilter === 'all') {
      this.filteredAlerts = this.alerts;
    } else {
      this.filteredAlerts = this.alerts.filter(a => a.type === this.currentFilter);
    }
  }

  dismissAlert(id: number) {
    this.filteredAlerts = this.filteredAlerts.filter(a => a.id !== id);
    this.alerts = this.alerts.filter(a => a.id !== id);
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
