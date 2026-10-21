import { Component, computed, input } from '@angular/core';
import { EstadoPedido } from '../../core/models';
import { ESTADOS_PEDIDO } from '../../core/utils/order-status';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [],
  template: `
    <span
      class="status"
      [class.status--sm]="size() === 'sm'"
      [style.--status-color]="info().color"
    >
      <span class="status__dot"></span>
      {{ info().label }}
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 10px;
        border-radius: var(--radius-pill);
        background: color-mix(in srgb, var(--status-color) 11%, white);
        color: var(--status-color);
        font-size: 10.5px;
        font-weight: 800;
        white-space: nowrap;
      }

      .status--sm {
        padding: 3px 8px;
        font-size: 9.5px;
      }

      .status__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--status-color) 14%, transparent);
      }
    `,
  ],
})
export class StatusBadgeComponent {
  readonly estado = input.required<EstadoPedido>();
  readonly size = input<'sm' | 'md'>('md');
  readonly info = computed(
    () => ESTADOS_PEDIDO[this.estado()] ?? ESTADOS_PEDIDO.pendiente,
  );
}
