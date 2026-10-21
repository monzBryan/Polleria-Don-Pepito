import { Component, input } from '@angular/core';
import { IMG } from '../../data/demo-data';
import { IconComponent } from './icon.component';
import { LogoComponent } from './logo.component';
import { ImageFallbackDirective } from '../directives/image-fallback.directive';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [IconComponent, LogoComponent, ImageFallbackDirective],
  template: `
    <section class="auth">
      <div class="auth__visual">
        <img
          [src]="image()"
          alt="Pollería Don Pepito"
          appImageFallback
        />
        <div class="auth__shade"></div>

        <div class="auth__brand">
          <app-logo variant="cream" size="sm" />
        </div>

        <div class="auth__copy">
          <span class="eyebrow eyebrow--gold">{{ eyebrow() }}</span>
          <h1 class="display display--sm">{{ title() }}</h1>
          <p>{{ subtitle() }}</p>

          <blockquote>
            <app-icon name="lucideQuote" size="24" />
            <p>{{ quote() }}</p>
            <cite>{{ quoteAuthor() }}</cite>
          </blockquote>
        </div>

        <div class="auth__benefits">
          <span><app-icon name="lucideGift" size="15" /> Suma puntos</span>
          <span><app-icon name="lucideBike" size="15" /> Delivery propio</span>
          <span><app-icon name="lucideFlame" size="15" /> Hecho al carbón</span>
        </div>
      </div>

      <div class="auth__panel">
        <div class="auth__box">
          <ng-content />
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .auth {
        display: grid;
        grid-template-columns: 1.05fr 0.95fr;
        min-height: calc(100vh - var(--header-h));
        background: var(--cream);
      }

      .auth__visual {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 620px;
        padding: clamp(28px, 4vw, 48px);
        overflow: hidden;
        color: var(--cream);
        isolation: isolate;
      }

      .auth__visual > img {
        position: absolute;
        inset: 0;
        z-index: -2;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .auth__shade {
        position: absolute;
        inset: 0;
        z-index: -1;
        background:
          linear-gradient(180deg, rgba(10, 10, 11, 0.42) 0%, rgba(10, 10, 11, 0.55) 42%, rgba(10, 10, 11, 0.92) 100%),
          radial-gradient(circle at 20% 20%, rgba(200, 16, 46, 0.25), transparent 40%);
      }

      .auth__brand {
        align-self: flex-start;
      }

      .auth__copy {
        max-width: 520px;
        padding-block: 32px;
      }

      .auth__copy h1 {
        font-size: clamp(2.7rem, 4.4vw, 4.1rem);
        line-height: 0.98;
        color: var(--cream);
      }

      .auth__copy > p {
        max-width: 42ch;
        margin-top: 14px;
        color: rgba(255, 248, 238, 0.65);
        font-size: 13.5px;
        line-height: 1.7;
      }

      blockquote {
        margin: 30px 0 0;
        padding: 16px 18px;
        border-left: 2px solid var(--gold);
        background: rgba(255, 248, 238, 0.06);
        backdrop-filter: blur(8px);
      }

      blockquote > app-icon {
        color: var(--gold);
        opacity: 0.7;
      }

      blockquote p {
        margin-top: 6px;
        color: rgba(255, 248, 238, 0.8);
        font-family: var(--font-display);
        font-size: 16px;
        font-style: italic;
        line-height: 1.5;
      }

      blockquote cite {
        display: block;
        margin-top: 8px;
        color: var(--gold);
        font-size: 8.5px;
        font-style: normal;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .auth__benefits {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .auth__benefits span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 6px 10px;
        border: 1px solid rgba(255, 248, 238, 0.18);
        border-radius: var(--radius-pill);
        color: rgba(255, 248, 238, 0.72);
        font-size: 9px;
        font-weight: 800;
        backdrop-filter: blur(8px);
      }

      .auth__benefits app-icon {
        color: var(--gold);
      }

      .auth__panel {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: clamp(30px, 5vw, 64px);
      }

      .auth__box {
        width: min(430px, 100%);
      }

      @media (max-width: 960px) {
        .auth {
          grid-template-columns: 1fr;
        }
        .auth__visual {
          min-height: 360px;
          padding: 26px;
        }
        .auth__copy {
          padding-block: 22px;
        }
        .auth__copy h1 {
          font-size: clamp(2.2rem, 7vw, 3rem);
        }
        blockquote {
          display: none;
        }
        .auth__panel {
          padding: 32px 20px 48px;
        }
      }

      @media (max-width: 560px) {
        .auth__visual {
          min-height: 280px;
        }
        .auth__copy > p {
          display: none;
        }
      }
    `,
  ],
})
export class AuthShellComponent {
  readonly eyebrow = input('Pollería Don Pepito');
  readonly title = input('El sabor que se comparte.');
  readonly subtitle = input(
    'Pollo a la brasa al carbón, recetas de familia y el cariño de siempre.',
  );
  readonly image = input(IMG.restaurante);
  readonly quote = input(
    'El pollo llega caliente, jugoso y con ese sabor al carbón que no encuentro en otro lado.',
  );
  readonly quoteAuthor = input('María Quispe · Vecina de Ica');
}
