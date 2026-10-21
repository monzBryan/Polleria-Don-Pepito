import { Component, inject } from '@angular/core';
import { ToastService, ToastType } from '../../core/services/toast.service';
import { IconComponent } from './icon.component';

const ICONS: Record<ToastType, string> = {
  success: 'lucideCheckCircle2',
  error: 'lucideXCircle',
  warning: 'lucideAlertTriangle',
  info: 'lucideInfo',
};

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="toasts" aria-live="polite" aria-atomic="false">
      @for (toast of service.toasts(); track toast.id) {
        <article
          [class]="'toast toast--' + toast.type"
          [style.--duration]="toast.duration + 'ms'"
          role="status"
        >
          <span class="toast__icon">
            <app-icon [name]="icons[toast.type]" size="20" />
          </span>
          <div class="toast__body">
            <strong>{{ toast.title }}</strong>
            <p>{{ toast.message }}</p>
          </div>
          <button
            type="button"
            class="toast__close"
            aria-label="Cerrar notificación"
            (click)="service.dismiss(toast.id)"
          >
            <app-icon name="lucideX" size="16" />
          </button>
          <span class="toast__progress"></span>
        </article>
      }
    </div>
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 16px 16px auto auto;
        z-index: var(--z-toast);
        pointer-events: none;
      }

      .toasts {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: min(380px, calc(100vw - 32px));
      }

      .toast {
        position: relative;
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 12px;
        align-items: start;
        padding: 14px 14px 16px;
        border-radius: var(--radius-sm);
        background: rgba(10, 10, 11, 0.92);
        color: var(--cream);
        box-shadow: var(--shadow-lg);
        backdrop-filter: blur(14px);
        overflow: hidden;
        pointer-events: auto;
        animation: toast-in 320ms var(--ease-out) both;
      }

      .toast--success {
        border-left: 3px solid #3ecf8e;
      }
      .toast--error {
        border-left: 3px solid #ff6b6b;
      }
      .toast--warning {
        border-left: 3px solid var(--gold);
      }
      .toast--info {
        border-left: 3px solid #6ea8ff;
      }

      .toast__icon {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
      }

      .toast--success .toast__icon {
        color: #3ecf8e;
      }
      .toast--error .toast__icon {
        color: #ff6b6b;
      }
      .toast--warning .toast__icon {
        color: var(--gold);
      }
      .toast--info .toast__icon {
        color: #6ea8ff;
      }

      .toast__body {
        min-width: 0;
        padding-top: 1px;
      }

      .toast__body strong {
        display: block;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.01em;
      }

      .toast__body p {
        margin: 3px 0 0;
        font-size: 12.5px;
        line-height: 1.45;
        color: rgba(255, 248, 238, 0.72);
      }

      .toast__close {
        display: grid;
        place-items: center;
        width: 26px;
        height: 26px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: rgba(255, 248, 238, 0.5);
        cursor: pointer;
        transition: var(--transition);
      }

      .toast__close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--white);
      }

      .toast__progress {
        position: absolute;
        inset: auto 0 0 0;
        height: 2px;
        background: currentColor;
        opacity: 0.4;
        transform-origin: left;
        animation: toast-progress var(--duration) linear forwards;
      }

      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translate3d(18px, -6px, 0) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }
      }

      @keyframes toast-progress {
        from {
          transform: scaleX(1);
        }
        to {
          transform: scaleX(0);
        }
      }

      @media (max-width: 640px) {
        :host {
          inset: 12px 12px auto 12px;
        }
        .toasts {
          width: 100%;
        }
      }
    `,
  ],
})
export class ToastContainerComponent {
  readonly service = inject(ToastService);
  readonly icons = ICONS;
}
