import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PharmacistService } from '../../shared/services/pharmacistservice';
import { Sidebar } from '../sidebar/sidebar';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-pharmacist-dashboard',
  standalone: true,
  imports: [CommonModule, Sidebar],
  templateUrl: './PharmacistDashboard.html',
  styleUrls: ['./PharmacistDashboard.css']
})
export class PharmacistDashboard implements OnInit, AfterViewInit {

  stats = {
    totalMedicines: 0,
    lowStock: 0,
    expired: 0,
    nearExpiry: 0
  };

  lowStockMeds: any[] = [];
  expiredMeds: any[] = [];
  recentUpdates: any[] = [];

  private pieChart: Chart | undefined;

  constructor(private pharmacistService: PharmacistService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  ngAfterViewInit() {
    this.initChart();
  }

  loadDashboard() {
    // Load stats
    this.pharmacistService.getInventoryStats().subscribe(res => {
      this.stats = res;
      this.updateChart();
    });

    // Load inventory for alerts
    this.pharmacistService.getInventory().subscribe(meds => {
      const today = new Date();
      this.lowStockMeds = meds.filter(m => m.quantity <= 5);
      this.expiredMeds = meds.filter(m => new Date(m.expiryDate) < today);

     this.recentUpdates = meds
  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  .slice(0, 5);

    });
  }

  initChart() {
    const ctx = (document.getElementById('inventoryChart') as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) return;

    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Healthy', 'Low Stock', 'Near Expiry', 'Expired'],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: ['#00a8cc', '#ff9800', '#ffb74d', '#e53935']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  updateChart() {
    if (!this.pieChart) return;
    const healthy = this.stats.totalMedicines - this.stats.lowStock - this.stats.nearExpiry - this.stats.expired;
    this.pieChart.data.datasets[0].data = [healthy, this.stats.lowStock, this.stats.nearExpiry, this.stats.expired];
    this.pieChart.update();
  }
}
