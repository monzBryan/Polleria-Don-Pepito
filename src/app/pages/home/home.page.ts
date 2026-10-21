import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { PointsService } from '../../core/services/points.service';
import { SiteConfigService } from '../../core/services/site-config.service';
import { DEMO_TESTIMONIOS, IMG } from '../../data/demo-data';
import { ProductCardComponent } from '../../shared/components/product-card.component';
import { IconComponent } from '../../shared/components/icon.component';
import { LogoComponent } from '../../shared/components/logo.component';
import { SolesPipe } from '../../shared/pipes/soles.pipe';
import { ImageFallbackDirective } from '../../shared/directives/image-fallback.directive';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    RouterLink,
    ProductCardComponent,
    IconComponent,
    LogoComponent,
    SolesPipe,
    ImageFallbackDirective,
  ],
  template: `
    <section class="hero">
      <div class="container hero__grid">
        <div class="hero__copy">
          <span class="eyebrow eyebrow--gold">Pollería artesanal · Ica</span>
          <h1 class="display display--xl hero__title">
            El sabor que
            <em>se comparte.</em>
          </h1>
          <p class="hero__lead">
            Pollo a la brasa marinado 24 horas, dorado lentamente al carbón y
            acompañado de nuestras salsas de la casa. Así se come en Don Pepito.
          </p>

          <div class="hero__ctas">
            <a routerLink="/carta" class="btn btn--primary btn--lg">
              Explorar la carta
              <app-icon name="lucideArrowRight" size="18" />
            </a>
            <a
              [href]="waLink()"
              target="_blank"
              rel="noopener"
              class="btn btn--outline-light btn--lg"
            >
              <app-icon name="brandWhatsapp" size="18" />
              Pedir por WhatsApp
            </a>
          </div>

          <div class="hero__trust">
            <div>
              <span><app-icon name="lucideFlame" size="18" /></span>
              <p><strong>Leña de verdad</strong><small>Ahumado lento al carbón</small></p>
            </div>
            <div>
              <span><app-icon name="lucideBike" size="18" /></span>
              <p><strong>Delivery propio</strong><small>Caliente hasta tu puerta</small></p>
            </div>
            <div>
              <span><app-icon name="lucideGift" size="18" /></span>
              <p><strong>Puntos en cada pedido</strong><small>Tu fidelidad se premia</small></p>
            </div>
          </div>
        </div>

        <div class="hero__media">
          <div class="hero__frame" aria-hidden="true"></div>
          <img
            [src]="img.polloEntero"
            alt="Pollo a la brasa de Don Pepito"
            fetchpriority="high"
            decoding="async"
            appImageFallback
          />
          <div class="hero__seal">
            <app-icon name="lucideFlame" size="20" />
            <strong>100%</strong>
            <span>al carbón</span>
          </div>
          <div class="hero__float">
            <span class="hero__float-tag">El más pedido</span>
            <strong>Combo familiar</strong>
            <p>
              <app-icon name="lucideStar" size="13" />
              Favorito de la casa · para 4
            </p>
            <div class="hero__float-price">
              <span>S/ 79.90</span>
              <s>S/ 89.90</s>
            </div>
          </div>
        </div>
      </div>

      <div class="container hero__stats">
        <div><strong>+12</strong><span>años en Ica</span></div>
        <div><strong>45 min</strong><span>delivery promedio</span></div>
        <div><strong>24 h</strong><span>de marinado</span></div>
        <div><strong>100%</strong><span>sabor de casa</span></div>
      </div>
    </section>

    <section class="section favorites">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Los favoritos</span>
            <h2 class="section-title">Lo que todos piden</h2>
          </div>
          <a routerLink="/carta" class="link-arrow">
            Ver carta completa
            <app-icon name="lucideArrowRight" size="16" />
          </a>
        </div>

        <div class="product-grid">
          @for (producto of favoritos(); track producto.id) {
            <app-product-card [producto]="producto" />
          }
        </div>
      </div>
    </section>

    <section id="categorias" class="section section--cream categories">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">Para cada antojo</span>
            <h2 class="section-title">Recorre nuestra carta</h2>
          </div>
          <p class="categories__note">
            Del clásico pollo a la brasa a los criollos que saben a domingo.
          </p>
        </div>

        <div class="cat-grid">
          @for (categoria of categorias(); track categoria.id; let i = $index) {
            <a
              class="cat-card"
              [class.cat-card--big]="i === 0"
              [class.cat-card--wide]="i === 5"
              [routerLink]="['/carta']"
              [queryParams]="{ categoria: categoria.slug }"
            >
              <img
                [src]="categoria.imagenUrl"
                [alt]="categoria.nombre"
                loading="lazy"
                appImageFallback
              />
              <div class="cat-card__shade"></div>
              <div class="cat-card__content">
                <span class="cat-card__icon">
                  <app-icon [name]="categoria.icono" size="18" />
                </span>
                <div>
                  <h3>{{ categoria.nombre }}</h3>
                  <p>{{ categoria.descripcion }}</p>
                </div>
                <span class="cat-card__count">
                  {{ categoria.total }}
                  {{ categoria.total === 1 ? 'plato' : 'platos' }}
                  <app-icon name="lucideArrowUpRight" size="14" />
                </span>
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <section id="nosotros" class="section story">
      <div class="container story__grid">
        <div class="story__media">
          <img
            class="story__img story__img--main"
            [src]="img.restaurante"
            alt="Interior de la pollería Don Pepito"
            loading="lazy"
            appImageFallback
          />
          <img
            class="story__img story__img--small"
            [src]="img.polloPexels"
            alt="Pollo dorado recién salido del horno"
            loading="lazy"
            appImageFallback
          />
          <div class="story__badge">
            <strong>12</strong>
            <span>años de<br />sabor</span>
          </div>
        </div>

        <div class="story__copy">
          <span class="eyebrow">Nuestra historia</span>
          <h2 class="section-title">
            Una receta de familia, servida con orgullo.
          </h2>
          <p class="section-lead">
            Don Pepito nació en 2012 con una idea simple: hacer el pollo a la
            brasa que se sirve en casa. La misma receta, el mismo cariño y la
            misma mesa larga para compartir.
          </p>
          <p class="story__text">
            Elegimos pollos frescos de la región, los marinamos por 24 horas con
            nuestra mezcla de ajíes y especias, y los doramos lentamente sobre
            leña. Cada plato sale con papas crocantes, ensalada fresca y nuestras
            salsas preparadas el mismo día.
          </p>

          <ul class="story__list">
            <li>
              <span><app-icon name="lucideCheck" size="14" /></span>
              Marinado 24 horas con receta de familia
            </li>
            <li>
              <span><app-icon name="lucideCheck" size="14" /></span>
              Leña seleccionada para un ahumado parejo
            </li>
            <li>
              <span><app-icon name="lucideCheck" size="14" /></span>
              Salsas y guarniciones preparadas del día
            </li>
          </ul>

          <div class="story__foot">
            <div class="story__signature">
              Familia Don Pepito
              <small>Desde 2012 · Ica, Perú</small>
            </div>
            <a routerLink="/carta" class="btn btn--dark">
              Conoce la carta
              <app-icon name="lucideArrowRight" size="16" />
            </a>
          </div>
        </div>
      </div>
    </section>

    <section id="puntos" class="section section--ink points">
      <div class="container points__grid">
        <div class="points__copy">
          <span class="eyebrow eyebrow--gold">Club Don Pepito</span>
          <h2 class="section-title">
            Come rico. Suma puntos.<br />
            Vuelve por más.
          </h2>
          <p class="section-lead">
            Cada pedido suma. Acumula puntos y canjéalos por descuentos. Sin
            letras chiquitas: solo más sabor para ti.
          </p>

          <div class="points__steps">
            <div class="points__step">
              <span>01</span>
              <div>
                <strong>Pide y acumula</strong>
                <p>Gana 1 punto por cada S/ 1 de consumo en la web.</p>
              </div>
            </div>
            <div class="points__step">
              <span>02</span>
              <div>
                <strong>Canjea cuando quieras</strong>
                <p>Cada 100 puntos equivalen a S/ 1 de descuento.</p>
              </div>
            </div>
            <div class="points__step">
              <span>03</span>
              <div>
                <strong>Beneficios para todos</strong>
                <p>Sin niveles: todos los miembros del club tienen los mismos beneficios.</p>
              </div>
            </div>
          </div>

          <div class="points__ctas">
            <a [routerLink]="ctaCuenta()" class="btn btn--gold">
              {{ auth.isLoggedIn() ? 'Ver mis puntos' : 'Crear cuenta gratis' }}
              <app-icon name="lucideArrowRight" size="16" />
            </a>
            <a routerLink="/legal/puntos" class="btn btn--outline-light">
              Cómo funciona
            </a>
          </div>
        </div>

        <div class="club-wrap">
          <div class="club-card">
            <div class="club-card__top">
              <app-logo variant="red" size="sm" link="/" />
              <span>Miembro</span>
            </div>
            <div class="club-card__chip" aria-hidden="true"></div>
            <p class="club-card__label">Club Don Pepito</p>
            <p class="club-card__name">{{ nombreClub() }}</p>

            <div class="club-card__points">
              <strong>{{ puntos() }}</strong>
              <span>puntos disponibles</span>
            </div>

            <div class="club-card__bottom">
              <div>
                <small>Membresía</small>
                <strong>Club Don Pepito</strong>
              </div>
              <div>
                <small>Equivalen a</small>
                <strong>{{ pointsService.equivalencia(puntos()) | soles }}</strong>
              </div>
            </div>
            <small class="club-card__hint">
              1 punto por cada S/ 1 · 100 puntos = S/ 1 de descuento.
            </small>
          </div>
          <span class="club-wrap__glow" aria-hidden="true"></span>
        </div>
      </div>
    </section>

    <section class="section testimonials">
      <div class="container">
        <div class="section-head section-head--center">
          <span class="eyebrow">Voces de la mesa</span>
          <h2 class="section-title">Historias que saben a hogar</h2>
          <p class="section-lead">
            Cada pedido tiene una historia. Estas son algunas de las que nos
            comparten nuestros clientes.
          </p>
        </div>

        <div class="testimonials__grid">
          @for (testimonio of testimonios; track testimonio.nombre) {
            <article class="testimonial">
              <div class="testimonial__stars">
                @for (estrella of [1, 2, 3, 4, 5]; track estrella) {
                  <app-icon name="lucideStar" size="14" />
                }
              </div>
              <p>“{{ testimonio.texto }}”</p>
              <div class="testimonial__author">
                <span>{{ testimonio.iniciales }}</span>
                <div>
                  <strong>{{ testimonio.nombre }}</strong>
                  <small>{{ testimonio.rol }}</small>
                </div>
              </div>
            </article>
          }
        </div>
      </div>
    </section>

    <section id="contacto" class="section contact">
      <div class="container contact__grid">
        <div class="contact__copy">
          <span class="eyebrow">Visítanos</span>
          <h2 class="section-title">Te esperamos en Ica.</h2>
          <p class="section-lead">
            Ven a comer al fresco, pide para llevar o recibe tu pedido en casa.
            Estamos cerca de ti, con el horno encendido todos los días.
          </p>

          <div class="contact__items">
            <div class="contact__item">
              <span><app-icon name="lucideMapPin" size="18" /></span>
              <div>
                <small>Dirección</small>
                <strong>{{ config().direccion }}</strong>
              </div>
            </div>
            <div class="contact__item">
              <span><app-icon name="lucideClock" size="18" /></span>
              <div>
                <small>Horario</small>
                <strong>{{ config().horario }}</strong>
              </div>
            </div>
            <div class="contact__item">
              <span><app-icon name="lucidePhone" size="18" /></span>
              <div>
                <small>Pedidos y reservas</small>
                <strong>{{ config().whatsapp }}</strong>
              </div>
            </div>
          </div>

          <div class="contact__ctas">
            <a
              [href]="config().googleMapsUrl"
              target="_blank"
              rel="noopener"
              class="btn btn--dark"
            >
              <app-icon name="lucideMapPin" size="16" />
              Cómo llegar
            </a>
            <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn--outline">
              <app-icon name="brandWhatsapp" size="16" />
              Escríbenos
            </a>
          </div>
        </div>

        <div class="contact__map">
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=-75.7440%2C-14.0735%2C-75.7330%2C-14.0675&amp;layer=mapnik&amp;marker=-14.07065%2C-75.73864"
            title="Ubicación de Pollería Don Pepito"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
          <div class="contact__map-card">
            <span class="contact__map-dot"></span>
            <div>
              <small>Delivery propio</small>
              <strong>45 min promedio</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .hero {
        position: relative;
        overflow: hidden;
        padding: clamp(56px, 7vw, 92px) 0 0;
        background:
          radial-gradient(circle at 84% 12%, rgba(232, 181, 77, 0.16), transparent 30%),
          radial-gradient(circle at 8% 82%, rgba(200, 16, 46, 0.22), transparent 36%),
          var(--ink);
        color: var(--cream);
      }

      .hero::before {
        content: '';
        position: absolute;
        inset: 0;
        opacity: 0.05;
        pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      }

      .hero__grid {
        position: relative;
        display: grid;
        grid-template-columns: 1.02fr 0.98fr;
        align-items: center;
        gap: clamp(32px, 5vw, 70px);
      }

      .hero__title {
        margin: 0;
        font-size: clamp(3.1rem, 6.2vw, 5.7rem);
        line-height: 0.94;
      }

      .hero__title em {
        display: block;
        color: var(--gold);
        font-style: italic;
        font-weight: 400;
      }

      .hero__lead {
        max-width: 47ch;
        margin: 24px 0 30px;
        color: rgba(255, 248, 238, 0.68);
        font-size: clamp(0.98rem, 1.4vw, 1.1rem);
        line-height: 1.75;
      }

      .hero__ctas {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .hero__trust {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-top: 44px;
        padding-top: 26px;
        border-top: 1px solid rgba(255, 248, 238, 0.12);
      }

      .hero__trust > div {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      .hero__trust > div > span {
        display: grid;
        place-items: center;
        flex: none;
        width: 36px;
        height: 36px;
        border: 1px solid rgba(232, 181, 77, 0.3);
        border-radius: 50%;
        color: var(--gold);
      }

      .hero__trust p {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
      }

      .hero__trust strong {
        color: var(--cream);
        font-size: 11.5px;
        font-weight: 800;
      }

      .hero__trust small {
        margin-top: 2px;
        color: rgba(255, 248, 238, 0.45);
        font-size: 9.5px;
        line-height: 1.35;
      }

      .hero__media {
        position: relative;
        isolation: isolate;
      }

      .hero__media > img {
        position: relative;
        z-index: 1;
        width: 100%;
        aspect-ratio: 4 / 4.6;
        max-height: 580px;
        border-radius: 34px;
        object-fit: cover;
        box-shadow: 0 40px 90px rgba(0, 0, 0, 0.45);
      }

      .hero__frame {
        position: absolute;
        inset: -16px -16px 26px 18px;
        z-index: 0;
        border: 1px solid rgba(232, 181, 77, 0.35);
        border-radius: 44px;
        transform: rotate(2.5deg);
      }

      .hero__seal {
        position: absolute;
        top: -22px;
        right: -14px;
        z-index: 3;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 96px;
        height: 96px;
        border-radius: 50%;
        background: var(--gold);
        color: var(--ink);
        box-shadow: 0 18px 40px rgba(232, 181, 77, 0.3);
        transform: rotate(6deg);
      }

      .hero__seal strong {
        font-family: var(--font-display);
        font-size: 21px;
        line-height: 1;
      }

      .hero__seal span {
        margin-top: 2px;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .hero__float {
        position: absolute;
        right: 18px;
        bottom: 24px;
        z-index: 3;
        width: min(250px, 78%);
        padding: 16px 18px;
        border: 1px solid rgba(255, 248, 238, 0.16);
        border-radius: 20px;
        background: rgba(10, 10, 11, 0.72);
        backdrop-filter: blur(16px);
        box-shadow: var(--shadow-lg);
      }

      .hero__float-tag {
        display: inline-block;
        margin-bottom: 6px;
        color: var(--gold);
        font-size: 8.5px;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .hero__float strong {
        display: block;
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 600;
      }

      .hero__float p {
        display: flex;
        align-items: center;
        gap: 5px;
        margin: 4px 0 10px;
        color: rgba(255, 248, 238, 0.55);
        font-size: 10px;
      }

      .hero__float p app-icon {
        color: var(--gold);
      }

      .hero__float-price {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }

      .hero__float-price span {
        color: var(--cream);
        font-size: 17px;
        font-weight: 800;
      }

      .hero__float-price s {
        color: rgba(255, 248, 238, 0.4);
        font-size: 11px;
      }

      .hero__stats {
        position: relative;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1px;
        margin-top: clamp(44px, 6vw, 72px);
        border-top: 1px solid rgba(255, 248, 238, 0.12);
        background: rgba(255, 248, 238, 0.12);
      }

      .hero__stats > div {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 22px 10px 26px;
        background: var(--ink);
      }

      .hero__stats strong {
        color: var(--gold);
        font-family: var(--font-display);
        font-size: clamp(26px, 3vw, 36px);
        font-weight: 600;
        line-height: 1;
      }

      .hero__stats span {
        color: rgba(255, 248, 238, 0.5);
        font-size: 9.5px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .section-head {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 34px;
      }

      .section-head--center {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .section-head--center .section-lead {
        margin-inline: auto;
      }

      .link-arrow {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding-bottom: 4px;
        border-bottom: 1px solid var(--line-strong);
        color: var(--ink);
        font-size: 12px;
        font-weight: 800;
        white-space: nowrap;
        transition: var(--transition);
      }

      .link-arrow:hover {
        border-color: var(--red);
        color: var(--red);
        gap: 10px;
      }

      .product-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 18px;
      }

      .categories__note {
        max-width: 32ch;
        color: var(--muted);
        font-size: 12.5px;
        line-height: 1.6;
        text-align: right;
      }

      .cat-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-auto-rows: 200px;
        gap: 14px;
      }

      .cat-card {
        position: relative;
        display: block;
        border-radius: var(--radius);
        overflow: hidden;
        isolation: isolate;
        background: var(--ink);
      }

      .cat-card--big {
        grid-column: span 2;
        grid-row: span 2;
      }

      .cat-card--wide {
        grid-column: span 2;
      }

      .cat-card img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 700ms var(--ease-out);
      }

      .cat-card:hover img {
        transform: scale(1.06);
      }

      .cat-card__shade {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(10, 10, 11, 0.06) 30%, rgba(10, 10, 11, 0.86));
      }

      .cat-card__content {
        position: absolute;
        inset: auto 0 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        padding: 18px;
        color: var(--cream);
      }

      .cat-card__icon {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border: 1px solid rgba(255, 248, 238, 0.25);
        border-radius: 50%;
        background: rgba(10, 10, 11, 0.35);
        color: var(--gold);
        backdrop-filter: blur(6px);
      }

      .cat-card h3 {
        font-family: var(--font-display);
        font-size: 21px;
        font-weight: 600;
        line-height: 1.05;
      }

      .cat-card--big h3 {
        font-size: 29px;
      }

      .cat-card p {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        max-width: 34ch;
        margin-top: 4px;
        color: rgba(255, 248, 238, 0.6);
        font-size: 10.5px;
        line-height: 1.5;
      }

      .cat-card__count {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--gold);
        font-size: 9.5px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .story__grid {
        display: grid;
        grid-template-columns: 0.92fr 1.08fr;
        align-items: center;
        gap: clamp(34px, 6vw, 78px);
      }

      .story__media {
        position: relative;
        padding-bottom: 50px;
        padding-right: 40px;
      }

      .story__img {
        border-radius: var(--radius-lg);
        object-fit: cover;
        box-shadow: var(--shadow);
      }

      .story__img--main {
        width: 100%;
        aspect-ratio: 4 / 4.6;
      }

      .story__img--small {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 52%;
        aspect-ratio: 1;
        border: 7px solid var(--cream);
      }

      .story__badge {
        position: absolute;
        top: 26px;
        left: -22px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border-radius: 14px;
        background: var(--gold);
        color: var(--ink);
        box-shadow: var(--shadow-gold);
      }

      .story__badge strong {
        font-family: var(--font-display);
        font-size: 30px;
        line-height: 1;
      }

      .story__badge span {
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.09em;
        line-height: 1.25;
        text-transform: uppercase;
      }

      .story__text {
        margin-top: 14px;
        color: var(--muted);
        font-size: 13.5px;
        line-height: 1.8;
      }

      .story__list {
        display: grid;
        gap: 9px;
        margin: 22px 0 26px;
      }

      .story__list li {
        display: flex;
        align-items: center;
        gap: 9px;
        color: var(--ink-muted);
        font-size: 12.5px;
        font-weight: 700;
      }

      .story__list li span {
        display: grid;
        place-items: center;
        flex: none;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--success-soft);
        color: var(--success);
      }

      .story__foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding-top: 20px;
        border-top: 1px solid var(--line);
      }

      .story__signature {
        display: flex;
        flex-direction: column;
        font-family: var(--font-display);
        font-size: 19px;
        font-style: italic;
        line-height: 1.2;
      }

      .story__signature small {
        margin-top: 3px;
        color: var(--muted-2);
        font-family: var(--font-body);
        font-size: 8.5px;
        font-style: normal;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .points {
        overflow: hidden;
      }

      .points__grid {
        display: grid;
        grid-template-columns: 1.05fr 0.95fr;
        align-items: center;
        gap: clamp(34px, 6vw, 80px);
      }

      .points__steps {
        display: grid;
        gap: 16px;
        margin: 28px 0;
      }

      .points__step {
        display: flex;
        align-items: flex-start;
        gap: 14px;
      }

      .points__step > span {
        display: grid;
        place-items: center;
        flex: none;
        width: 38px;
        height: 38px;
        border: 1px solid rgba(232, 181, 77, 0.35);
        border-radius: 50%;
        color: var(--gold);
        font-family: var(--font-display);
        font-size: 13px;
        font-weight: 600;
      }

      .points__step strong {
        display: block;
        font-family: var(--font-display);
        font-size: 17px;
        font-weight: 600;
      }

      .points__step p {
        margin-top: 2px;
        color: rgba(255, 248, 238, 0.55);
        font-size: 11.5px;
        line-height: 1.55;
      }

      .points__ctas {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .club-wrap {
        position: relative;
        display: flex;
        justify-content: center;
        padding: 20px;
      }

      .club-wrap__glow {
        position: absolute;
        inset: 8% 2%;
        z-index: 0;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(232, 181, 77, 0.35), transparent 65%);
        filter: blur(24px);
      }

      .club-card {
        position: relative;
        z-index: 1;
        width: min(410px, 100%);
        padding: 24px 24px 22px;
        border-radius: 26px;
        background:
          radial-gradient(circle at 82% 12%, rgba(255, 255, 255, 0.45), transparent 32%),
          linear-gradient(135deg, #f6d99a 0%, #e8b54d 48%, #c98d2b 100%);
        color: var(--ink);
        box-shadow: 0 34px 70px rgba(0, 0, 0, 0.38);
        transform: rotate(-2deg);
      }

      .club-card__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .club-card__top > span {
        padding: 4px 9px;
        border: 1px solid rgba(10, 10, 11, 0.22);
        border-radius: var(--radius-pill);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .club-card__chip {
        width: 38px;
        height: 28px;
        margin: 22px 0 18px;
        border-radius: 7px;
        background:
          linear-gradient(90deg, rgba(10, 10, 11, 0.22) 1px, transparent 1px) 0 0 / 9px 9px,
          linear-gradient(0deg, rgba(10, 10, 11, 0.22) 1px, transparent 1px) 0 0 / 9px 9px,
          rgba(255, 248, 238, 0.55);
      }

      .club-card__label {
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        opacity: 0.6;
      }

      .club-card__name {
        margin-top: 2px;
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .club-card__points {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin: 20px 0 18px;
      }

      .club-card__points strong {
        font-family: var(--font-display);
        font-size: 46px;
        font-weight: 600;
        line-height: 1;
        letter-spacing: -0.04em;
      }

      .club-card__points span {
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.65;
      }

      .club-card__bottom {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding-top: 14px;
        border-top: 1px solid rgba(10, 10, 11, 0.18);
      }

      .club-card__bottom div {
        display: flex;
        flex-direction: column;
      }

      .club-card__bottom small {
        font-size: 7.5px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        opacity: 0.55;
      }

      .club-card__bottom strong {
        font-size: 13px;
        font-weight: 900;
      }

      .club-card__progress {
        height: 5px;
        margin-top: 16px;
        border-radius: var(--radius-pill);
        background: rgba(10, 10, 11, 0.16);
        overflow: hidden;
      }

      .club-card__progress span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--ink);
        transition: width 500ms var(--ease-out);
      }

      .club-card__hint {
        display: block;
        margin-top: 8px;
        font-size: 8.5px;
        font-weight: 800;
        opacity: 0.6;
      }

      .testimonials {
        background:
          radial-gradient(circle at 8% 10%, rgba(232, 181, 77, 0.1), transparent 30%),
          var(--cream);
      }

      .testimonials__grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
      }

      .testimonial {
        display: flex;
        flex-direction: column;
        padding: 26px;
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        background: var(--white);
        box-shadow: var(--shadow-sm);
      }

      .testimonial__stars {
        display: flex;
        gap: 2px;
        margin-bottom: 14px;
        color: var(--gold-dark);
      }

      .testimonial p {
        flex: 1;
        color: var(--ink-muted);
        font-family: var(--font-display);
        font-size: 18px;
        font-style: italic;
        line-height: 1.5;
        letter-spacing: -0.01em;
      }

      .testimonial__author {
        display: flex;
        align-items: center;
        gap: 11px;
        margin-top: 22px;
        padding-top: 16px;
        border-top: 1px solid var(--line);
      }

      .testimonial__author > span {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: var(--ink);
        color: var(--gold);
        font-size: 11px;
        font-weight: 900;
      }

      .testimonial__author div {
        display: flex;
        flex-direction: column;
      }

      .testimonial__author strong {
        font-size: 11.5px;
        font-weight: 800;
      }

      .testimonial__author small {
        color: var(--muted-2);
        font-size: 9.5px;
        font-weight: 700;
        letter-spacing: 0.04em;
      }

      .contact__grid {
        display: grid;
        grid-template-columns: 1fr 1.05fr;
        align-items: center;
        gap: clamp(34px, 5vw, 68px);
      }

      .contact__items {
        display: grid;
        gap: 14px;
        margin: 26px 0;
      }

      .contact__item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .contact__item > span {
        display: grid;
        place-items: center;
        flex: none;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: var(--cream-2);
        color: var(--red);
      }

      .contact__item div {
        display: flex;
        flex-direction: column;
      }

      .contact__item small {
        color: var(--muted-2);
        font-size: 8.5px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .contact__item strong {
        margin-top: 1px;
        font-size: 13px;
        font-weight: 800;
      }

      .contact__ctas {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .contact__map {
        position: relative;
        height: 430px;
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow);
        background: var(--cream-2);
      }

      .contact__map iframe {
        width: 100%;
        height: 100%;
        border: 0;
        filter: saturate(0.85) contrast(0.95);
      }

      .contact__map-card {
        position: absolute;
        left: 16px;
        bottom: 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 15px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: var(--shadow);
        backdrop-filter: blur(10px);
      }

      .contact__map-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--success);
        box-shadow: 0 0 0 4px rgba(31, 122, 77, 0.16);
      }

      .contact__map-card div {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .contact__map-card small {
        color: var(--muted-2);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .contact__map-card strong {
        font-size: 12px;
        font-weight: 800;
      }

      @media (max-width: 1024px) {
        .hero__grid {
          grid-template-columns: 1fr;
        }
        .hero__media {
          max-width: 540px;
          margin-inline: auto;
        }
        .product-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .cat-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .cat-card--big {
          grid-row: span 1;
        }
        .cat-card--wide {
          grid-column: span 1;
        }
        .story__grid,
        .points__grid,
        .contact__grid {
          grid-template-columns: 1fr;
        }
        .story__media {
          max-width: 520px;
          margin-inline: auto;
        }
        .club-wrap {
          order: -1;
        }
        .testimonials__grid {
          grid-template-columns: 1fr;
        }
        .contact__map {
          height: 360px;
        }
      }

      @media (max-width: 760px) {
        .hero__stats {
          grid-template-columns: repeat(2, 1fr);
        }
        .hero__trust {
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .section-head {
          flex-direction: column;
          align-items: flex-start;
        }
        .categories__note {
          text-align: left;
        }
        .story__foot {
          flex-direction: column;
          align-items: flex-start;
        }
      }

      @media (max-width: 560px) {
        .hero {
          padding-top: 36px;
        }
        .hero__ctas .btn {
          width: 100%;
        }
        .hero__media > img {
          aspect-ratio: 4 / 4.4;
          border-radius: 24px;
        }
        .hero__float {
          right: 8px;
          bottom: 12px;
        }
        .hero__seal {
          width: 82px;
          height: 82px;
          top: -12px;
          right: -4px;
        }
        .product-grid {
          grid-template-columns: 1fr;
        }
        .cat-grid {
          grid-template-columns: 1fr;
          grid-auto-rows: 190px;
        }
        .cat-card--big {
          grid-column: span 1;
        }
        .story__media {
          padding-right: 24px;
        }
        .story__img--small {
          width: 46%;
          border-width: 5px;
        }
        .story__badge {
          left: -6px;
        }
        .club-card {
          transform: none;
        }
        .testimonial {
          padding: 20px;
        }
        .testimonial p {
          font-size: 16px;
        }
      }
    `,
  ],
})
export class HomePageComponent {
  private readonly catalog = inject(CatalogService);
  readonly auth = inject(AuthService);
  readonly pointsService = inject(PointsService);
  private readonly site = inject(SiteConfigService);

  readonly img = IMG;
  readonly testimonios = DEMO_TESTIMONIOS;

  readonly favoritos = computed(() => {
    const destacados = this.catalog.destacados();
    const resto = this.catalog
      .productosActivos()
      .filter((producto) => !destacados.some((item) => item.id === producto.id));
    return [...destacados, ...resto].slice(0, 8);
  });

  readonly categorias = computed(() =>
    this.catalog.categoriasActivas().map((categoria) => ({
      ...categoria,
      total: this.catalog
        .productosActivos()
        .filter((producto) => producto.categoriaId === categoria.id).length,
    })),
  );

  readonly config = computed(() => this.site.configWeb());
  readonly waLink = computed(() =>
    this.site.whatsappLink('Hola Don Pepito, quiero hacer un pedido.'),
  );

  readonly puntos = computed(() => this.auth.perfil()?.puntos ?? 0);
  readonly nombreClub = computed(
    () => this.auth.perfil()?.nombre ?? 'Tu nombre',
  );
  readonly ctaCuenta = computed(() =>
    this.auth.isLoggedIn() ? '/cuenta' : '/registro',
  );
}
