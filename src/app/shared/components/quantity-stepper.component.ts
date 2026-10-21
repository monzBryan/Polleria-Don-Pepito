import { Component, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-quantity-stepper',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="stepper" [class.stepper--sm]="size() === 'sm'">
      <button
        type="button"
        class="stepper__btn"
        [disabled]="value() <= min()"
        [attr.aria-label]="'Quitar una unidad de ' + label()"
        (click)="cambiar(-1)"
      >
        <app-icon name="lucideMinus" [size]="size() === 'sm' ? '13' : '15'" />
      </button>
      <span class="stepper__value" aria-live="polite">{{ value() }}</span>
      <button
        type="button"
        class="stepper__btn"
        [disabled]="value() >= max()"
        [attr.aria-label]="'Agregar una unidad de ' + label()"
        (click)="cambiar(1)"
      >
        <app-icon name="lucidePlus" [size]="size() === 'sm' ? '13' : '15'" />
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .stepper {
        display: inline-grid;
        grid-template-columns: 34px minmax(34px, auto) 34px;
        align-items: center;
        border: 1px solid var(--line-strong);
        border-radius: var(--radius-pill);
        background: var(--white);
        overflow: hidden;
      }

      .stepper--sm {
        grid-template-columns: 28px minmax(28px, auto) 28px;
      }

      .stepper__btn {
        display: grid;
        place-items: center;
        height: 34px;
        border: 0;
        background: transparent;
        color: var(--ink);
        cursor: pointer;
        transition: var(--transition);
      }

      .stepper--sm .stepper__btn {
        height: 28px;
      }

      .stepper__btn:hover:not(:disabled) {
        background: var(--cream-2);
        color: var(--red);
      }

      .stepper__btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .stepper__value {
        text-align: center;
        font-size: 13px;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
      }

      .stepper--sm .stepper__value {
        font-size: 12px;
      }
    `,
  ],
})
export class QuantityStepperComponent {
  readonly value = input(1);
  readonly min = input(1);
  readonly max = input(99);
  readonly size = input<'sm' | 'md'>('md');
  readonly label = input('producto');
  readonly valueChange = output<number>();

  cambiar(delta: number): void {
    const next = Math.min(this.max(), Math.max(this.min(), this.value() + delta));
    if (next !== this.value()) {
      this.valueChange.emit(next);
    }
  }
}
