import { computed, effect, Injectable, signal } from '@angular/core';
import { CarritoItem, Producto } from '../models';

const STORAGE_KEY = 'dp_cart_v1';

function leerCarrito(): CarritoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is CarritoItem => {
        if (!item || typeof item !== 'object') return false;
        const value = item as Partial<CarritoItem>;
        return (
          typeof value.producto?.id === 'number' &&
          typeof value.cantidad === 'number' &&
          value.cantidad > 0
        );
      })
      .map((item) => ({ ...item, cantidad: Math.min(99, Math.floor(item.cantidad)) }));
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CarritoItem[]>(leerCarrito());

  readonly count = computed(() =>
    this.items().reduce((total, item) => total + item.cantidad, 0),
  );

  readonly subtotal = computed(() =>
    this.items().reduce(
      (total, item) => total + item.producto.precio * item.cantidad,
      0,
    ),
  );

  readonly isEmpty = computed(() => this.items().length === 0);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
      } catch {
        // Sin acción.
      }
    });
  }

  add(producto: Producto, cantidad = 1, nota = ''): void {
    const qty = Math.max(1, Math.min(99, Math.floor(cantidad)));
    const actual = this.items();
    const existente = actual.find((item) => item.producto.id === producto.id);
    if (existente) {
      this.items.set(
        actual.map((item) =>
          item.producto.id === producto.id
            ? {
                ...item,
                producto,
                cantidad: Math.min(99, item.cantidad + qty),
                nota: nota || item.nota,
              }
            : item,
        ),
      );
      return;
    }
    this.items.set([...actual, { producto, cantidad: qty, nota }]);
  }

  setCantidad(productoId: number, cantidad: number): void {
    const qty = Math.max(1, Math.min(99, Math.floor(cantidad)));
    this.items.update((items) =>
      items.map((item) =>
        item.producto.id === productoId ? { ...item, cantidad: qty } : item,
      ),
    );
  }

  increment(productoId: number): void {
    const item = this.items().find((entry) => entry.producto.id === productoId);
    if (item) this.setCantidad(productoId, item.cantidad + 1);
  }

  decrement(productoId: number): void {
    const item = this.items().find((entry) => entry.producto.id === productoId);
    if (!item) return;
    if (item.cantidad <= 1) {
      this.remove(productoId);
      return;
    }
    this.setCantidad(productoId, item.cantidad - 1);
  }

  setNota(productoId: number, nota: string): void {
    this.items.update((items) =>
      items.map((item) =>
        item.producto.id === productoId ? { ...item, nota: nota.trim() } : item,
      ),
    );
  }

  remove(productoId: number): void {
    this.items.update((items) =>
      items.filter((item) => item.producto.id !== productoId),
    );
  }

  clear(): void {
    this.items.set([]);
  }

  reemplazar(items: CarritoItem[]): void {
    this.items.set(items);
  }
}
