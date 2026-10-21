import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IMG } from '../../data/demo-data';
import { IconComponent } from '../../shared/components/icon.component';
import { ImageFallbackDirective } from '../../shared/directives/image-fallback.directive';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [RouterLink, IconComponent, ImageFallbackDirective],
  template: `
    <section class="about-hero">
      <div class="container">
        <nav class="crumbs" aria-label="Ruta de navegación">
          <a routerLink="/">Inicio</a>
          <app-icon name="lucideChevronRight" size="13" />
          <span>Nosotros</span>
        </nav>

        <div class="about-hero__grid">
          <div class="about-hero__copy">
            <span class="eyebrow eyebrow--gold">Desde 2012 · Ica, Perú</span>
            <h1 class="display display--xl">
              Una mesa larga,<br />
              <em>una sola receta.</em>
            </h1>
            <p>
              Don Pepito nació de un horno prestado, una receta familiar y las
              ganas de que Ica tuviera su propio lugar para compartir. Doce años
              después, seguimos encendiendo la brasa todas las mañanas.
            </p>
            <div class="about-hero__ctas">
              <a routerLink="/carta" class="btn btn--primary btn--lg">
                Probar la carta
                <app-icon name="lucideArrowRight" size="18" />
              </a>
              <a routerLink="/contacto" class="btn btn--outline-light btn--lg">
                <app-icon name="lucideMapPin" size="18" />
                Cómo llegar
              </a>
            </div>
          </div>

          <div class="about-hero__media">
            <img [src]="img.restaurante" alt="Salón de Pollería Don Pepito" appImageFallback />
            <div class="about-hero__stamp">
              <app-icon name="lucideFlame" size="18" />
              <strong>12</strong>
              <span>años al carbón</span>
            </div>
          </div>
        </div>
      </div>

      <div class="container about-stats">
        <div><strong>2012</strong><span>primera brasa encendida</span></div>
        <div><strong>+48 mil</strong><span>pedidos compartidos</span></div>
        <div><strong>24 h</strong><span>de marinado por lote</span></div>
        <div><strong>100%</strong><span>pollo fresco de la región</span></div>
      </div>
    </section>

    <section class="section story">
      <div class="container story__grid">
        <div class="story__media">
          <img [src]="img.polloEntero" alt="Pollo entero a la brasa" loading="lazy" appImageFallback />
          <img
            class="story__small"
            [src]="img.polloPexels"
            alt="Detalle del pollo dorado"
            loading="lazy"
            appImageFallback
          />
          <span class="story__quote">
            <app-icon name="lucideQuote" size="22" />
            “Si no lo serviría en mi mesa, no sale de la cocina.”
          </span>
        </div>

        <div class="story__copy">
          <span class="eyebrow">Nuestra historia</span>
          <h2 class="section-title">Empezó como un domingo en familia.</h2>
          <p class="section-lead">
            Pepito aprendió a preparar pollo a la brasa junto a su padre, en el
            patio de la casa. La receta viajó de generación en generación hasta
            convertirse en el corazón de la pollería.
          </p>
          <p>
            Hoy trabajamos con productores de la región, elegimos pollos frescos
            cada mañana y mantenemos el mismo marinado de 24 horas. La leña, el
            punto del carbón y la paciencia no se negocian.
          </p>
          <p>
            Cada plato sale con papas crocantes, ensalada del día y nuestras
            salsas preparadas en casa. Porque el sabor de un buen domingo no
            debería depender del calendario.
          </p>
          <div class="story__signature">
            <span class="story__avatar">DP</span>
            <div>
              <strong>Familia Don Pepito</strong>
              <small>Cocina de barrio, hecha con orgullo</small>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--cream values">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Lo que nos mueve</span>
            <h2 class="section-title">Tres cosas que nunca cambian</h2>
          </div>
          <p class="section-head__note">
            No inventamos tendencias. Cuidamos lo que ya sabemos hacer bien.
          </p>
        </div>

        <div class="values__grid">
          <article>
            <span class="values__icon"><app-icon name="lucideFlame" size="24" /></span>
            <span class="values__num">01</span>
            <h3>Fuego de verdad</h3>
            <p>
              Brasa de leña y carbón, sin atajos. El ahumado lento es lo que le
              da a nuestro pollo ese aroma que se reconoce desde la vereda.
            </p>
          </article>
          <article>
            <span class="values__icon"><app-icon name="lucideHeartHandshake" size="24" /></span>
            <span class="values__num">02</span>
            <h3>Trato de barrio</h3>
            <p>
              Conocemos a nuestros clientes por su nombre y recordamos cómo les
              gusta su salsa. La hospitalidad no es un guion: es costumbre.
            </p>
          </article>
          <article>
            <span class="values__icon"><app-icon name="lucideLeaf" size="24" /></span>
            <span class="values__num">03</span>
            <h3>Producto local</h3>
            <p>
              Compramos a productores de Ica y alrededores. Menos distancia,
              más frescura y una cadena que también hace crecer al barrio.
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="section process">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Del patio a tu mesa</span>
            <h2 class="section-title">Así se hace nuestro pollo</h2>
          </div>
        </div>

        <ol class="process__list">
          <li>
            <span class="process__dot"><app-icon name="lucideChefHat" size="22" /></span>
            <small>Paso 01</small>
            <h3>Marinado 24 horas</h3>
            <p>Ajíes, especias y paciencia. El sabor entra antes de tocar el fuego.</p>
          </li>
          <li>
            <span class="process__dot"><app-icon name="lucideFlame" size="22" /></span>
            <small>Paso 02</small>
            <h3>Brasa lenta</h3>
            <p>Doramos al carbón, girando a mano para que la piel quede crujiente.</p>
          </li>
          <li>
            <span class="process__dot"><app-icon name="lucideUtensilsCrossed" size="22" /></span>
            <small>Paso 03</small>
            <h3>Guarniciones del día</h3>
            <p>Papas cortadas a mano, ensalada fresca y salsas recién batidas.</p>
          </li>
          <li>
            <span class="process__dot"><app-icon name="lucideBike" size="22" /></span>
            <small>Paso 04</small>
            <h3>Caliente hasta tu puerta</h3>
            <p>Empacamos para mantener el calor y salimos apenas está listo.</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="gallery">
      <div class="container">
        <div class="gallery__grid">
          <figure>
            <img [src]="img.polloArroz" alt="Pollo a la brasa con arroz" loading="lazy" appImageFallback />
            <figcaption>El clásico de la casa</figcaption>
          </figure>
          <figure>
            <img [src]="img.parrilla" alt="Parrilla mixta" loading="lazy" appImageFallback />
            <figcaption>Parrillas al carbón</figcaption>
          </figure>
          <figure>
            <img [src]="img.chicha" alt="Chicha morada" loading="lazy" appImageFallback />
            <figcaption>Chicha morada del día</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <section class="section about-cta">
      <div class="container about-cta__inner">
        <div>
          <span class="eyebrow eyebrow--gold">Te esperamos</span>
          <h2 class="display display--md">La mesa ya está puesta.</h2>
          <p>
            Ven a compartir en familia, celebrar con amigos o simplemente darte
            el gusto. También llevamos todo hasta tu puerta.
          </p>
        </div>
        <div class="about-cta__actions">
          <a routerLink="/reservas" class="btn btn--gold btn--lg">Reservar una mesa</a>
          <a routerLink="/carta" class="btn btn--outline-light btn--lg">
            Pedir delivery
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .about-hero {
        padding: 28px 0 0;
        background:
          radial-gradient(circle at 78% 18%, rgba(232, 181, 77, 0.14), transparent 32%),
          var(--ink);
        color: var(--cream);
      }

      .crumbs {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-bottom: 34px;
        color: rgba(255, 248, 238, 0.55);
        font-size: 11.5px;
      }

      .crumbs a {
        color: rgba(255, 248, 238, 0.75);
      }

      .about-hero__grid {
        display: grid;
        grid-template-columns: 1.05fr 0.95fr;
        gap: clamp(32px, 5vw, 76px);
        align-items: center;
      }

      .about-hero__copy h1 {
        margin: 18px 0 22px;
      }

      .about-hero__copy h1 em {
        color: var(--gold);
        font-style: italic;
      }

      .about-hero__copy > p {
        max-width: 50ch;
        color: rgba(255, 248, 238, 0.72);
        font-size: 15.5px;
        line-height: 1.8;
      }

      .about-hero__ctas {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 28px;
      }

      .about-hero__media {
        position: relative;
      }

      .about-hero__media img {
        width: 100%;
        aspect-ratio: 4 / 4.7;
        border-radius: var(--radius-xl);
        object-fit: cover;
        box-shadow: var(--shadow-lg);
      }

      .about-hero__stamp {
        position: absolute;
        right: -16px;
        top: 28px;
        display: grid;
        place-items: center;
        gap: 1px;
        width: 102px;
        padding: 16px 10px;
        border-radius: 50%;
        background: var(--gold);
        color: var(--ink);
        text-align: center;
        box-shadow: var(--shadow-md);
      }

      .about-hero__stamp strong {
        font-family: var(--font-display);
        font-size: 28px;
        line-height: 1;
      }

      .about-hero__stamp span {
        font-size: 8.5px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .about-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        margin-top: 58px;
        border-top: 1px solid rgba(255, 248, 238, 0.14);
      }

      .about-stats div {
        display: grid;
        gap: 4px;
        padding: 22px 20px;
        border-right: 1px solid rgba(255, 248, 238, 0.14);
      }

      .about-stats div:last-child {
        border-right: 0;
      }

      .about-stats strong {
        color: var(--gold);
        font-family: var(--font-display);
        font-size: 25px;
        font-weight: 600;
      }

      .about-stats span {
        color: rgba(255, 248, 238, 0.55);
        font-size: 10.5px;
      }

      .story__grid {
        display: grid;
        grid-template-columns: 0.95fr 1.05fr;
        gap: clamp(34px, 6vw, 86px);
        align-items: center;
      }

      .story__media {
        position: relative;
        padding-bottom: 56px;
      }

      .story__media > img:first-child {
        width: 100%;
        aspect-ratio: 4 / 4.4;
        border-radius: var(--radius-xl);
        object-fit: cover;
      }

      .story__small {
        position: absolute;
        right: -22px;
        bottom: 0;
        width: 46%;
        aspect-ratio: 1 / 1;
        border: 8px solid var(--cream);
        border-radius: var(--radius-lg);
        object-fit: cover;
        box-shadow: var(--shadow-md);
      }

      .story__quote {
        position: absolute;
        left: 18px;
        bottom: 18px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        max-width: 250px;
        padding: 14px 16px;
        border-radius: var(--radius-md);
        background: var(--ink);
        color: var(--cream);
        font-family: var(--font-display);
        font-size: 13px;
        font-style: italic;
        line-height: 1.5;
      }

      .story__quote app-icon {
        color: var(--gold);
        flex: none;
      }

      .story__copy h2 {
        margin: 10px 0 18px;
      }

      .story__copy p {
        color: var(--muted);
        font-size: 14px;
        line-height: 1.8;
      }

      .story__signature {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 24px;
        padding-top: 22px;
        border-top: 1px solid var(--line);
      }

      .story__avatar {
        display: grid;
        place-items: center;
        width: 46px;
        height: 46px;
        border-radius: 50%;
        background: var(--red);
        color: var(--white);
        font-family: var(--font-display);
        font-size: 15px;
        font-weight: 700;
      }

      .story__signature div {
        display: grid;
        gap: 2px;
      }

      .story__signature strong {
        font-size: 12.5px;
      }

      .story__signature small {
        color: var(--muted);
        font-size: 10.5px;
      }

      .section-head__note {
        max-width: 34ch;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.6;
      }

      .values__grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
      }

      .values article {
        position: relative;
        padding: 30px 26px;
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        background: var(--white);
        transition: var(--transition);
      }

      .values article:hover {
        border-color: var(--red);
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
      }

      .values__icon {
        display: grid;
        place-items: center;
        width: 52px;
        height: 52px;
        margin-bottom: 22px;
        border-radius: 50%;
        background: rgba(200, 16, 46, 0.08);
        color: var(--red);
      }

      .values__num {
        position: absolute;
        top: 24px;
        right: 24px;
        color: var(--line-strong);
        font-family: var(--font-display);
        font-size: 26px;
        font-weight: 600;
      }

      .values h3 {
        margin: 0 0 8px;
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 600;
      }

      .values p {
        margin: 0;
        color: var(--muted);
        font-size: 12.5px;
        line-height: 1.75;
      }

      .process {
        background: var(--white);
      }

      .process__list {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .process__list li {
        position: relative;
        padding: 0 22px 0 0;
      }

      .process__list li::after {
        content: '';
        position: absolute;
        top: 27px;
        left: 54px;
        right: 10px;
        height: 1px;
        background: var(--line-strong);
      }

      .process__list li:last-child::after {
        display: none;
      }

      .process__dot {
        display: grid;
        place-items: center;
        width: 54px;
        height: 54px;
        margin-bottom: 18px;
        border: 1px solid var(--line-strong);
        border-radius: 50%;
        background: var(--cream);
        color: var(--red);
      }

      .process__list small {
        display: block;
        margin-bottom: 5px;
        color: var(--red);
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .process__list h3 {
        margin: 0 0 7px;
        font-family: var(--font-display);
        font-size: 19px;
        font-weight: 600;
      }

      .process__list p {
        margin: 0;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.7;
      }

      .gallery {
        padding: 0 0 80px;
      }

      .gallery__grid {
        display: grid;
        grid-template-columns: 1.2fr 1fr 1fr;
        gap: 14px;
      }

      .gallery figure {
        position: relative;
        margin: 0;
        overflow: hidden;
        border-radius: var(--radius-lg);
      }

      .gallery img {
        width: 100%;
        height: 300px;
        object-fit: cover;
        transition: transform 600ms var(--ease-out);
      }

      .gallery figure:hover img {
        transform: scale(1.04);
      }

      .gallery figcaption {
        position: absolute;
        inset: auto 0 0;
        padding: 32px 16px 14px;
        background: linear-gradient(transparent, rgba(10, 10, 11, 0.78));
        color: var(--cream);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
      }

      .about-cta {
        background:
          radial-gradient(circle at 86% 20%, rgba(232, 181, 77, 0.12), transparent 36%),
          var(--ink);
        color: var(--cream);
      }

      .about-cta__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 34px;
      }

      .about-cta h2 {
        margin: 10px 0;
      }

      .about-cta p {
        max-width: 50ch;
        margin: 0;
        color: rgba(255, 248, 238, 0.68);
        font-size: 14px;
        line-height: 1.7;
      }

      .about-cta__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        flex: none;
      }

      @media (max-width: 960px) {
        .about-hero__grid,
        .story__grid {
          grid-template-columns: 1fr;
        }

        .about-hero__media {
          max-width: 520px;
        }

        .values__grid {
          grid-template-columns: 1fr;
        }

        .process__list {
          grid-template-columns: repeat(2, 1fr);
          row-gap: 34px;
        }

        .process__list li:nth-child(2)::after {
          display: none;
        }

        .gallery__grid {
          grid-template-columns: 1fr 1fr;
        }

        .gallery figure:first-child {
          grid-column: 1 / -1;
        }

        .about-cta__inner {
          flex-direction: column;
          align-items: flex-start;
        }
      }

      @media (max-width: 640px) {
        .about-stats {
          grid-template-columns: 1fr 1fr;
        }

        .about-stats div:nth-child(2) {
          border-right: 0;
        }

        .about-stats div:nth-child(-n + 2) {
          border-bottom: 1px solid rgba(255, 248, 238, 0.14);
        }

        .story__small {
          display: none;
        }

        .story__quote {
          left: 12px;
          bottom: 12px;
          max-width: calc(100% - 24px);
        }

        .process__list {
          grid-template-columns: 1fr;
        }

        .process__list li::after {
          display: none;
        }

        .gallery__grid {
          grid-template-columns: 1fr;
        }

        .gallery figure:first-child {
          grid-column: auto;
        }

        .gallery img {
          height: 240px;
        }

        .about-cta__actions > * {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
})
export class AboutPageComponent {
  readonly img = IMG;
}
