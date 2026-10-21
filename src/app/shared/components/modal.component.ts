import {
  Component,
  effect,
  HostListener,
  input,
  output,
} from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (open()) {
      <div class="modal-overlay" (click)="cerrar()"></div>
      <div
        class="modal"
        [class.modal--sm]="size() === 'sm'"
        [class.modal--lg]="size() === 'lg'"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
      >
        <header class="modal__head">
          <div>
            @if (eyebrow()) {
              <span class="modal__eyebrow">{{ eyebrow() }}</span>
            }
            <h2>{{ title() }}</h2>
          </div>
          <button
            type="button"
            class="modal__close"
            aria-label="Cerrar"
            (click)="cerrar()"
          >
            <app-icon name="lucideX" size="19" />
          </button>
        </header>

        <div class="modal__body">
          <ng-content />
        </div>

        @if (footer()) {
          <footer class="modal__foot">
            <ng-content select="[modalFooter]" />
          </footer>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        position: relative;
        z-index: var(--z-modal);
      }

      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(10, 10, 11, 0.55);
        backdrop-filter: blur(4px);
        animation: fade-in 200ms ease both;
      }

      .modal {
        position: fixed;
        inset: 50% auto auto 50%;
        display: flex;
        flex-direction: column;
        width: min(620px, calc(100vw - 32px));
        max-height: min(86vh, 820px);
        border-radius: var(--radius-lg);
        background: var(--cream);
        box-shadow: var(--shadow-lg);
        overflow: hidden;
        transform: translate(-50%, -50%);
        animation: modal-in 300ms var(--ease-out) both;
      }

      .modal--sm {
        width: min(440px, calc(100vw - 32px));
      }

      .modal--lg {
        width: min(860px, calc(100vw - 32px));
      }

      .modal__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 22px 24px 16px;
        border-bottom: 1px solid var(--line);
      }

      .modal__eyebrow {
        display: block;
        margin-bottom: 3px;
        color: var(--red);
        font-size: 9.5px;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .modal__head h2 {
        margin: 0;
        font-family: var(--font-display);
        font-size: 25px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .modal__close {
        display: grid;
        place-items: center;
        flex: none;
        width: 36px;
        height: 36px;
        border: 1px solid var(--line);
        border-radius: 50%;
        background: var(--white);
        color: var(--ink);
        cursor: pointer;
        transition: var(--transition);
      }

      .modal__close:hover {
        border-color: var(--red);
        color: var(--red);
        transform: rotate(90deg);
      }

      .modal__body {
        flex: 1;
        padding: 22px 24px;
        overflow-y: auto;
      }

      .modal__foot {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        padding: 16px 24px 20px;
        border-top: 1px solid var(--line);
        background: var(--white);
      }

      @keyframes modal-in {
        from {
          opacity: 0;
          transform: translate(-50%, -48%) scale(0.97);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }

      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @media (max-width: 640px) {
        .modal {
          inset: auto 0 0 0;
          width: 100%;
          max-height: 92vh;
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          transform: none;
          animation: sheet-in 300ms var(--ease-out) both;
        }

        .modal__head {
          padding: 18px 18px 14px;
        }

        .modal__body {
          padding: 18px;
        }

        .modal__foot {
          padding: 14px 18px 18px;
        }

        @keyframes sheet-in {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      }
    `,
  ],
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input('Detalle');
  readonly eyebrow = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly footer = input(false);
  readonly closed = output<void>();

  constructor() {
    effect((onCleanup) => {
      if (!this.open()) return;
      document.body.classList.add('body-lock');
      onCleanup(() => document.body.classList.remove('body-lock'));
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.cerrar();
  }

  cerrar(): void {
    this.closed.emit();
  }
}
