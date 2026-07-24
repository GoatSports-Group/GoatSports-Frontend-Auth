import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private activeToasts = signal<Toast[]>([]);
  toasts = this.activeToasts.asReadonly();
  private nextId = 0;

  show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
    const id = this.nextId++;
    const toast: Toast = { id, message, type };
    this.activeToasts.update(list => [...list, toast]);

    setTimeout(() => {
      this.activeToasts.update(list => list.filter(t => t.id !== id));
    }, duration);
  }
}
