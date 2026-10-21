import { Component, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="empty">
      <span class="empty__icon">
        <app-icon [name]="icon()" size="30" />
      </span>
      <h3>{{ title() }}</h3>
      <p>{{ message() }}</p>
      @if (actionLabel()) {
        <button type="button" class="btn btn--primary" (click)="action.emit()">
          {{ actionLabel() }}
          <app-icon name="lucideArrowRight" size="16" />
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 52px 24px;
        text-align: center;
      }

      .empty__icon {
        display: grid;
        place-items: center;
        width: 78px;
        height: 78px;
        margin-bottom: 18px;
        border-radius: 50%;
        background: var(--cream-2);
        color: var(--red);
      }

      .empty h3 {
        margin: 0;
        font-family: var(--font-display);
        font-size: 23px;
        font-weight: 600;
      }

      .empty p {
        max-width: 360px;
        margin: 8px 0 20px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.6;
      }
    `,
  ],
})
export class EmptyStateComponent {
  readonly icon = input('lucidePackageOpen');
  readonly title = input('Nada por aquí');
  readonly message = input('');
  readonly actionLabel = input('');
  readonly action = output<void>();
}
