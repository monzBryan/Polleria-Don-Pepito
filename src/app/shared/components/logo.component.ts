import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a
      class="brand"
      [class.brand--sm]="size() === 'sm'"
      [class.brand--lg]="size() === 'lg'"
      [routerLink]="link()"
      [attr.aria-label]="link() === '/' ? 'Don Pepito, ir al inicio' : 'Don Pepito'"
    >
      @switch (variant()) {
        @case ('gold') {
          <img
            src="/brand/logo-gold.png"
            alt="Don Pepito Pollería"
            width="848"
            height="708"
            decoding="async"
          />
        }
        @case ('cream') {
          <img
            src="/brand/logo-cream.png"
            alt="Don Pepito Pollería"
            width="848"
            height="708"
            decoding="async"
          />
        }
        @default {
          <img
            src="/brand/logo-transparent.png"
            alt="Don Pepito Pollería"
            width="848"
            height="708"
            decoding="async"
          />
        }
      }
    </a>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        height: 56px;
        transition: opacity var(--ease), transform var(--ease);
      }

      .brand:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }

      .brand img {
        height: 100%;
        width: auto;
        object-fit: contain;
      }

      .brand img.is-hidden {
        display: none;
      }

      .brand--sm {
        height: 40px;
      }

      .brand--lg {
        height: 76px;
      }

      @media (max-width: 640px) {
        .brand {
          height: 44px;
        }
        .brand--lg {
          height: 58px;
        }
      }
    `,
  ],
})
export class LogoComponent {
  readonly variant = input<'red' | 'gold' | 'cream'>('red');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly link = input('/');
}
