import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { PharmacistService } from '../../shared/services/pharmacistservice';
import { Chart, registerables } from 'chart.js';
import { Sidebar } from '../sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pharmacistsales',
  templateUrl: './pharmacistsales.html',
  styleUrls: ['./pharmacistsales.css'],
  standalone: true,
  imports: [Sidebar, CommonModule, FormsModule]
})
export class PharmacistSales implements OnInit, AfterViewInit {

  topSales: any[] = [];

  @ViewChild('salesChart') salesChartRef!: ElementRef<HTMLCanvasElement>;
  chartInstance!: Chart;

  constructor(private pharmacistService: PharmacistService) {}

  ngOnInit() {
    Chart.register(...registerables);
  }

  ngAfterViewInit() {
    this.loadSalesData();
  }

  loadSalesData() {
    this.pharmacistService.getTopSellingMedicines().subscribe(data => {
      console.log('Backend Top Selling Medicines Data:', data); // <-- check data
      this.topSales = data;
      this.renderChart();
    }, error => {
      console.error('Error fetching top selling medicines:', error);
    });
  }

  renderChart() {
    if (!this.salesChartRef) return;

    const labels = this.topSales.map(d => d.product);
    const soldData = this.topSales.map(d => d.totalSold);
    const revenueData = this.topSales.map(d => d.revenue);

    console.log('Chart Labels:', labels);        // <-- check chart labels
    console.log('Quantity Sold Data:', soldData); // <-- check sold quantities
    console.log('Revenue Data:', revenueData);    // <-- check revenue values

    if (this.chartInstance) {
      this.chartInstance.destroy(); // destroy previous chart if exists
    }

    this.chartInstance = new Chart(this.salesChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Quantity Sold', data: soldData, backgroundColor: '#00a8cc' },
          { label: 'Revenue ($)', data: revenueData, backgroundColor: '#ff9800' }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}
