import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrls: ['./toast.css'],
  standalone: true,
  imports:[CommonModule]
})
export class Toast {
  message = '';
  type: 'success' | 'error' | 'info' = 'info';
  visible = false;

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) { // changed to 3 seconds
    this.message = message;
    this.type = type;
    this.visible = true;

    setTimeout(() => {
      this.visible = false;
    }, duration);
  }
}
