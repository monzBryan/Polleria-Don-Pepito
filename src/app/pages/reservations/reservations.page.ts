import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AMBIENTES,
  AmbienteMesa,
  Reserva,
} from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { SalonService } from '../../core/services/salon.service';
import { ToastService } from '../../core/services/toast.service';
import { formatDate, normalizePhone } from '../../core/utils/format';
import { IconComponent } from '../../shared/components/icon.component';
import { ImageFallbackDirective } from '../../shared/directives/image-fallback.directive';
import { IMG } from '../../data/demo-data';

function datePlus(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildHours(): string[] {
  const hours: string[] = [];
  for (let minutes = 12 * 60; minutes <= 22 * 60 + 30; minutes += 30) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    hours.push(`${h}:${m}`);
  }
  return hours;
}

@Component({
  selector: 'app-reservations-page',
  standalone: true,
  imports: [RouterLink, IconComponent, ImageFallbackDirective],
  template: `
    <section class="res-hero">
      <div class="container">
        <nav class="crumbs" aria-label="Ruta de navegación">
          <a routerLink="/">Inicio</a>
          <app-icon name="lucideChevronRight" size="13" />
          <span>Reservas</span>
        </nav>

        <div class="res-hero__grid">
          <div>
            <span class="eyebrow eyebrow--gold">Tu mesa te espera</span>
            <h1 class="display display--xl">
              Reserva sin<br />
              <em>complicaciones.</em>
            </h1>
            <p>
              Elige el día, la hora y el ambiente. Nosotros preparamos la mesa y
              tú solo traes las ganas de compartir.
            </p>
            <ul class="res-hero__perks">
              <li><app-icon name="lucideCheck" size="14" /> Confirmación con código</li>
              <li><app-icon name="lucideCheck" size="14" /> Sin costo de reserva</li>
              <li><app-icon name="lucideCheck" size="14" /> Salón, terraza o VIP</li>
            </ul>
          </div>
          <div class="res-hero__media">
            <img [src]="img.restaurante" alt="Mesa preparada en Don Pepito" appImageFallback />
            <div class="res-hero__badge">
              <app-icon name="lucideCalendar" size="19" />
              <div>
                <strong>Reserva hoy</strong>
                <span>Atención de 12:00 a 22:30</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--cream">
      <div class="container">
        @if (!auth.isLoggedIn()) {
          <div class="auth-gate">
            <span class="auth-gate__icon"><app-icon name="lucideLockKeyhole" size="26" /></span>
            <span class="eyebrow">Un paso antes</span>
            <h2 class="section-title">Inicia sesión para reservar</h2>
            <p>
              Así podemos guardar tu reserva en tu cuenta, avisarte si algo
              cambia y tener tus datos listos para la próxima vez.
            </p>
            <div class="auth-gate__actions">
              <a
                routerLink="/login"
                [queryParams]="{ redirect: '/reservas' }"
                class="btn btn--primary btn--lg"
              >
                <app-icon name="lucideLogIn" size="18" />
                Iniciar sesión
              </a>
              <a routerLink="/register" class="btn btn--outline btn--lg">
                Crear una cuenta
              </a>
            </div>
            <small>¿Solo quieres pedir delivery? <a routerLink="/carta">Revisa la carta</a>.</small>
          </div>
        } @else if (reservaCreada(); as reserva) {
          <div class="success">
            <span class="success__icon"><app-icon name="lucideCheckCircle2" size="34" /></span>
            <span class="eyebrow">Reserva recibida</span>
            <h2 class="section-title">¡Te esperamos, {{ reserva.clienteNombre.split(' ')[0] }}!</h2>
            <p>
              Guardamos tu solicitud para el {{ fechaBonita(reserva.fecha) }} a
              las {{ reserva.hora }}. Te confirmaremos por WhatsApp al
              {{ reserva.clienteTelefono }}.
            </p>
            <div class="success__code">
              <small>Código de reserva</small>
              <strong>{{ reserva.codigo }}</strong>
            </div>
            <div class="success__details">
              <div>
                <app-icon name="lucideUsers" size="17" />
                <span>{{ reserva.personas }} personas</span>
              </div>
              <div>
                <app-icon name="lucideUtensilsCrossed" size="17" />
                <span>{{ ambienteLabel(reserva.ambiente) }}</span>
              </div>
              <div>
                <app-icon name="lucideCalendar" size="17" />
                <span>{{ fechaBonita(reserva.fecha) }}</span>
              </div>
            </div>
            <div class="success__actions">
              <button type="button" class="btn btn--primary" (click)="nuevaReserva()">
                Hacer otra reserva
              </button>
              <a routerLink="/cuenta" class="btn btn--outline">Ir a mi cuenta</a>
              <a [href]="whatsapp()" target="_blank" rel="noopener" class="btn btn--ghost">
                <app-icon name="brandWhatsapp" size="17" />
                Consultar
              </a>
            </div>
          </div>
        } @else {
          <div class="res-grid">
            <form class="res-form" (submit)="enviar($event)">
              <div class="res-form__head">
                <span class="eyebrow">Paso único</span>
                <h2 class="section-title">Arma tu reserva</h2>
                <p>Los campos con * son obligatorios.</p>
              </div>

              <div class="res-form__row">
                <label class="field">
                  <span class="field-label">Nombre completo *</span>
                  <input
                    class="input"
                    type="text"
                    [value]="nombre()"
                    (input)="nombre.set($any($event.target).value)"
                    autocomplete="name"
                    placeholder="Nombre de quien reserva"
                  />
                </label>
                <label class="field">
                  <span class="field-label">Teléfono *</span>
                  <input
                    class="input"
                    type="tel"
                    [value]="telefono()"
                    (input)="telefono.set($any($event.target).value)"
                    autocomplete="tel"
                    placeholder="9 dígitos"
                    maxlength="12"
                  />
                </label>
              </div>

              <div class="res-form__row">
                <label class="field">
                  <span class="field-label">Fecha *</span>
                  <input
                    class="input"
                    type="date"
                    [value]="fecha()"
                    [min]="minFecha"
                    (change)="fecha.set($any($event.target).value)"
                  />
                </label>
                <label class="field">
                  <span class="field-label">Hora *</span>
                  <select
                    class="select"
                    [value]="hora()"
                    (change)="hora.set($any($event.target).value)"
                  >
                    @for (item of horas; track item) {
                      <option [value]="item">{{ item }}</option>
                    }
                  </select>
                </label>
                <label class="field">
                  <span class="field-label">Personas *</span>
                  <select
                    class="select"
                    [value]="personas()"
                    (change)="setPersonas($any($event.target).value)"
                  >
                    @for (n of personasOpciones; track n) {
                      <option [value]="n">{{ n }} {{ n === 1 ? 'persona' : 'personas' }}</option>
                    }
                  </select>
                </label>
              </div>

              <div class="field">
                <span class="field-label">Ambiente *</span>
                <div class="ambientes">
                  @for (opcion of ambientes; track opcion.id) {
                    <button
                      type="button"
                      class="ambiente"
                      [class.ambiente--active]="ambienteActual() === opcion.id"
                      (click)="ambiente.set(opcion.id)"
                    >
                      <app-icon [name]="opcion.icono" size="20" />
                      <strong>{{ opcion.label }}</strong>
                      <small>{{ opcion.descripcion }}</small>
                      <span [class.is-low]="salon.disponibilidad(opcion.id) < personas()">
                        {{ salon.disponibilidad(opcion.id) }} asientos libres
                      </span>
                    </button>
                  }
                </div>
              </div>

              <label class="field">
                <span class="field-label">Notas especiales</span>
                <textarea
                  class="textarea"
                  rows="3"
                  [value]="notas()"
                  (input)="notas.set($any($event.target).value)"
                  placeholder="Cumpleaños, silla para bebé, preferencia de mesa..."
                ></textarea>
              </label>

              @if (error()) {
                <div class="res-error" role="alert">
                  <app-icon name="lucideCircleAlert" size="18" />
                  <span>{{ error() }}</span>
                </div>
              }

              <button type="submit" class="btn btn--primary btn--lg res-form__submit" [disabled]="enviando()">
                @if (enviando()) {
                  <app-icon name="lucideLoaderCircle" size="18" class="spin" />
                  Enviando reserva...
                } @else {
                  Confirmar reserva
                  <app-icon name="lucideArrowRight" size="18" />
                }
              </button>
              <small class="res-form__legal">
                Al reservar aceptas nuestras
                <a routerLink="/legal/terminos">condiciones</a> y el
                <a routerLink="/legal/privacidad">tratamiento de datos</a>.
              </small>
            </form>

            <aside class="res-summary">
              <span class="eyebrow">Tu reserva</span>
              <h3>{{ nombre() || 'Tu nombre' }}</h3>
              <div class="res-summary__rows">
                <div>
                  <app-icon name="lucideCalendar" size="17" />
                  <span>{{ fechaBonita(fecha()) }}</span>
                </div>
                <div>
                  <app-icon name="lucideClock" size="17" />
                  <span>{{ hora() }}</span>
                </div>
                <div>
                  <app-icon name="lucideUsers" size="17" />
                  <span>{{ personas() }} {{ personas() === 1 ? 'persona' : 'personas' }}</span>
                </div>
                <div>
                  <app-icon name="lucideUtensilsCrossed" size="17" />
                  <span>{{ ambienteLabel(ambienteActual()) }}</span>
                </div>
              </div>
              <div class="res-summary__note">
                <app-icon name="lucideInfo" size="17" />
                <p>
                  La reserva queda pendiente hasta que el equipo la confirme por
                  WhatsApp. No se cobra ningún adelanto.
                </p>
              </div>
              <div class="res-summary__contact">
                <app-icon name="lucidePhone" size="16" />
                <div>
                  <small>¿Necesitas ayuda?</small>
                  <a href="tel:+51956000001">+51 956 000 001</a>
                </div>
              </div>
            </aside>
          </div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .res-hero {
        padding: 28px 0 64px;
        background:
          radial-gradient(circle at 82% 20%, rgba(232, 181, 77, 0.14), transparent 34%),
          var(--ink);
        color: var(--cream);
      }

      .crumbs {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-bottom: 32px;
        color: rgba(255, 248, 238, 0.55);
        font-size: 11.5px;
      }

      .crumbs a {
        color: rgba(255, 248, 238, 0.75);
      }

      .res-hero__grid {
        display: grid;
        grid-template-columns: 1.05fr 0.95fr;
        gap: clamp(32px, 5vw, 76px);
        align-items: center;
      }

      .res-hero h1 {
        margin: 18px 0 20px;
      }

      .res-hero h1 em {
        color: var(--gold);
        font-style: italic;
      }

      .res-hero__grid > div > p {
        max-width: 46ch;
        color: rgba(255, 248, 238, 0.7);
        font-size: 15px;
        line-height: 1.8;
      }

      .res-hero__perks {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 20px;
        margin: 24px 0 0;
        padding: 0;
        list-style: none;
      }

      .res-hero__perks li {
        display: flex;
        align-items: center;
        gap: 6px;
        color: rgba(255, 248, 238, 0.7);
        font-size: 11px;
      }

      .res-hero__perks app-icon {
        color: var(--gold);
      }

      .res-hero__media {
        position: relative;
      }

      .res-hero__media img {
        width: 100%;
        aspect-ratio: 4 / 3;
        border-radius: var(--radius-xl);
        object-fit: cover;
        box-shadow: var(--shadow-lg);
      }

      .res-hero__badge {
        position: absolute;
        left: -18px;
        bottom: 22px;
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 13px 16px;
        border-radius: var(--radius-md);
        background: var(--cream);
        color: var(--ink);
        box-shadow: var(--shadow-md);
      }

      .res-hero__badge app-icon {
        color: var(--red);
      }

      .res-hero__badge div {
        display: grid;
        gap: 1px;
      }

      .res-hero__badge strong {
        font-size: 12px;
      }

      .res-hero__badge span {
        color: var(--muted);
        font-size: 9.5px;
      }

      .auth-gate,
      .success {
        max-width: 680px;
        margin: 0 auto;
        padding: 46px 40px;
        border: 1px solid var(--line);
        border-radius: var(--radius-xl);
        background: var(--white);
        text-align: center;
        box-shadow: var(--shadow-sm);
      }

      .auth-gate__icon,
      .success__icon {
        display: grid;
        place-items: center;
        width: 66px;
        height: 66px;
        margin: 0 auto 22px;
        border-radius: 50%;
        background: rgba(200, 16, 46, 0.08);
        color: var(--red);
      }

      .success__icon {
        background: rgba(47, 143, 91, 0.1);
        color: #2F8F5B;
      }

      .auth-gate h2,
      .success h2 {
        margin: 10px 0 12px;
      }

      .auth-gate > p,
      .success > p {
        max-width: 48ch;
        margin: 0 auto;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.75;
      }

      .auth-gate__actions,
      .success__actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
        margin: 24px 0 14px;
      }

      .auth-gate small {
        color: var(--muted);
        font-size: 10.5px;
      }

      .auth-gate small a {
        color: var(--red);
        font-weight: 700;
      }

      .success__code {
        display: inline-grid;
        gap: 2px;
        margin: 24px 0 18px;
        padding: 14px 30px;
        border: 1px dashed var(--line-strong);
        border-radius: var(--radius-md);
        background: var(--cream);
      }

      .success__code small {
        color: var(--muted);
        font-size: 8.5px;
        font-weight: 800;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .success__code strong {
        color: var(--red);
        font-family: var(--font-display);
        font-size: 24px;
        letter-spacing: 0.04em;
      }

      .success__details {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
      }

      .success__details div {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-radius: var(--radius-pill);
        background: var(--cream);
        color: var(--ink-soft);
        font-size: 10.5px;
      }

      .success__details app-icon {
        color: var(--red);
      }

      .res-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
        gap: 24px;
        align-items: start;
      }

      .res-form {
        display: grid;
        gap: 18px;
        padding: 32px;
        border: 1px solid var(--line);
        border-radius: var(--radius-xl);
        background: var(--white);
      }

      .res-form__head h2 {
        margin: 6px 0 4px;
      }

      .res-form__head p {
        margin: 0;
        color: var(--muted);
        font-size: 11px;
      }

      .res-form__row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      .res-form__row:has(.field:nth-child(3)) {
        grid-template-columns: 1fr 1fr 1fr;
      }

      .ambientes {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .ambiente {
        display: grid;
        gap: 4px;
        padding: 15px;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--cream);
        color: var(--ink);
        text-align: left;
        cursor: pointer;
        transition: var(--transition);
      }

      .ambiente:hover {
        border-color: var(--line-strong);
      }

      .ambiente--active {
        border-color: var(--red);
        background: var(--white);
        box-shadow: 0 0 0 2px rgba(200, 16, 46, 0.08);
      }

      .ambiente app-icon {
        color: var(--red);
      }

      .ambiente strong {
        font-size: 11.5px;
      }

      .ambiente small {
        color: var(--muted);
        font-size: 9px;
        line-height: 1.45;
      }

      .ambiente span {
        margin-top: 3px;
        color: #2F8F5B;
        font-size: 8.5px;
        font-weight: 800;
        text-transform: uppercase;
      }

      .ambiente span.is-low {
        color: var(--red);
      }

      .res-error {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        padding: 11px 13px;
        border-radius: var(--radius-sm);
        background: rgba(200, 16, 46, 0.07);
        color: var(--red);
        font-size: 11px;
        line-height: 1.5;
      }

      .res-form__submit {
        width: 100%;
        justify-content: center;
      }

      .res-form__legal {
        color: var(--muted);
        font-size: 9.5px;
        text-align: center;
      }

      .res-form__legal a {
        color: var(--red);
      }

      .res-summary {
        position: sticky;
        top: 100px;
        padding: 26px;
        border-radius: var(--radius-xl);
        background: var(--ink);
        color: var(--cream);
      }

      .res-summary h3 {
        margin: 8px 0 20px;
        font-family: var(--font-display);
        font-size: 24px;
        font-weight: 600;
      }

      .res-summary__rows {
        display: grid;
        gap: 0;
        border-top: 1px solid rgba(255, 248, 238, 0.14);
      }

      .res-summary__rows div {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 11px 0;
        border-bottom: 1px solid rgba(255, 248, 238, 0.14);
        color: rgba(255, 248, 238, 0.8);
        font-size: 11.5px;
      }

      .res-summary__rows app-icon {
        color: var(--gold);
      }

      .res-summary__note {
        display: flex;
        gap: 9px;
        margin-top: 18px;
        padding: 12px 13px;
        border-radius: var(--radius-sm);
        background: rgba(255, 248, 238, 0.06);
        color: var(--gold);
      }

      .res-summary__note p {
        margin: 0;
        color: rgba(255, 248, 238, 0.6);
        font-size: 9.5px;
        line-height: 1.6;
      }

      .res-summary__contact {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid rgba(255, 248, 238, 0.14);
        color: var(--gold);
      }

      .res-summary__contact div {
        display: grid;
        gap: 1px;
      }

      .res-summary__contact small {
        color: rgba(255, 248, 238, 0.5);
        font-size: 8.5px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .res-summary__contact a {
        color: var(--cream);
        font-size: 11.5px;
        font-weight: 700;
      }

      @media (max-width: 900px) {
        .res-hero__grid {
          grid-template-columns: 1fr;
        }

        .res-hero__media {
          max-width: 540px;
        }

        .res-grid {
          grid-template-columns: 1fr;
        }

        .res-summary {
          position: static;
        }
      }

      @media (max-width: 620px) {
        .auth-gate,
        .success {
          padding: 34px 20px;
        }

        .res-form {
          padding: 22px 18px;
        }

        .res-form__row,
        .res-form__row:has(.field:nth-child(3)) {
          grid-template-columns: 1fr;
        }

        .ambientes {
          grid-template-columns: 1fr;
        }

        .res-hero__badge {
          left: 10px;
          bottom: 10px;
        }

        .success__actions > * {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
})
export class ReservationsPageComponent {
  readonly auth = inject(AuthService);
  readonly salon = inject(SalonService);
  private readonly toast = inject(ToastService);

  readonly img = IMG;
  readonly ambientes = AMBIENTES;
  readonly horas = buildHours();
  readonly personasOpciones = Array.from({ length: 12 }, (_, index) => index + 1);
  readonly minFecha = datePlus(0);

  readonly nombre = signal('');
  readonly telefono = signal('');
  readonly fecha = signal(datePlus(1));
  readonly hora = signal('20:00');
  readonly personas = signal(2);
  readonly ambiente = signal<AmbienteMesa>('salon');
  readonly notas = signal('');
  readonly enviando = signal(false);
  readonly error = signal('');
  readonly reservaCreada = signal<Reserva | null>(null);

  readonly ambienteActual = computed(() => this.ambiente());

  constructor() {
    effect(() => {
      const perfil = this.auth.perfil();
      if (!perfil) return;
      if (!this.nombre()) this.nombre.set(perfil.nombre);
      if (!this.telefono()) this.telefono.set(perfil.telefono);
    });
  }

  setPersonas(value: string): void {
    const numero = Number(value);
    this.personas.set(Number.isFinite(numero) ? Math.min(12, Math.max(1, numero)) : 2);
  }

  ambienteLabel(value: AmbienteMesa): string {
    return AMBIENTES.find((ambiente) => ambiente.id === value)?.label ?? value;
  }

  fechaBonita(value: string): string {
    return formatDate(new Date(`${value}T12:00:00`));
  }

  whatsapp(): string {
    return 'https://wa.me/51956000001?text=' + encodeURIComponent('Hola, tengo una consulta sobre mi reserva.');
  }

  async enviar(event: Event): Promise<void> {
    event.preventDefault();
    if (this.enviando()) return;
    this.error.set('');
    const telefono = normalizePhone(this.telefono());
    if (!this.nombre().trim()) {
      this.error.set('Ingresa el nombre de la persona que reserva.');
      return;
    }
    if (telefono.length !== 9) {
      this.error.set('Ingresa un teléfono de 9 dígitos.');
      return;
    }
    this.enviando.set(true);
    try {
      const reserva = await this.salon.crearReserva({
        clienteNombre: this.nombre(),
        clienteTelefono: telefono,
        fecha: this.fecha(),
        hora: this.hora(),
        personas: this.personas(),
        ambiente: this.ambiente(),
        notas: this.notas(),
      });
      this.reservaCreada.set(reserva);
      this.toast.success('Te confirmaremos por WhatsApp.', 'Reserva registrada');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'No pudimos registrar tu reserva.',
      );
    } finally {
      this.enviando.set(false);
    }
  }

  nuevaReserva(): void {
    this.reservaCreada.set(null);
    this.notas.set('');
    this.error.set('');
    window.scrollTo({ top: 420, behavior: 'smooth' });
  }
}
