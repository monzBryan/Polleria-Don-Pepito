import { Injectable, signal } from '@angular/core';
import { uid } from '../utils/format';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  success(message: string, title = 'Listo'): void {
    this.show(message, 'success', title);
  }

  error(message: string, title = 'Algo salió mal'): void {
    this.show(message, 'error', title, 5600);
  }

  info(message: string, title = 'Información'): void {
    this.show(message, 'info', title);
  }

  warning(message: string, title = 'Atención'): void {
    this.show(message, 'warning', title, 5000);
  }

  show(message: string, type: ToastType = 'info', title = '', duration = 4200): void {
    const toast: Toast = {
      id: uid('toast'),
      type,
      title: title || this.defaultTitle(type),
      message,
      duration,
    };
    this.toasts.update((items) => [...items, toast].slice(-4));
    window.setTimeout(() => this.dismiss(toast.id), duration);
  }

  dismiss(id: string): void {
    this.toasts.update((items) => items.filter((item) => item.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }

  private defaultTitle(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'Listo';
      case 'error':
        return 'Algo salió mal';
      case 'warning':
        return 'Atención';
      default:
        return 'Información';
    }
  }
}
