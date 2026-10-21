import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { normalizePhone } from '../../core/utils/format';
import { AuthShellComponent } from '../../shared/components/auth-shell.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [RouterLink, AuthShellComponent, IconComponent],
  template: `
    <app-auth-shell
      eyebrow="Únete al club"
      title="Cada pedido suma."
      subtitle="Crea tu cuenta gratis, recibe 50 puntos de bienvenida y empieza a disfrutar de beneficios en cada pedido."
      quote="Los anticuchos y la parrilla mixta son mi debilidad. Con los puntos ya me descontaron un pedido completo."
      quoteAuthor="Lucía Rojas · Amante de la parrilla"
    >
      @if (confirmacion()) {
        <div class="success">
          <span class="success__icon">
            <app-icon name="lucideMailCheck" size="28" />
          </span>
          <span class="eyebrow">Casi listo</span>
          <h2>Revisa tu correo</h2>
          <p>{{ confirmacion() }}</p>
          <a routerLink="/login" class="btn btn--primary btn--block">
            Ir a iniciar sesión
            <app-icon name="lucideArrowRight" size="16" />
          </a>
        </div>
      } @else {
        <div class="form-head">
          <span class="eyebrow">Crear cuenta</span>
          <h2>Bienvenido a la familia</h2>
          <p>Completa tus datos y empieza a sumar puntos desde hoy.</p>
        </div>

        <form class="form" (submit)="registrar($event)" novalidate>
          @if (error()) {
            <div class="alert" role="alert">
              <app-icon name="lucideCircleAlert" size="17" />
              <span>{{ error() }}</span>
            </div>
          }

          <label class="field">
            <span class="field-label">Nombre completo</span>
            <span class="input-wrap">
              <app-icon name="lucideUser" size="16" />
              <input
                class="input"
                type="text"
                autocomplete="name"
                placeholder="María Quispe"
                [value]="nombre()"
                (input)="nombre.set($any($event.target).value)"
                required
              />
            </span>
          </label>

          <div class="form-grid">
            <label class="field">
              <span class="field-label">Correo electrónico</span>
              <span class="input-wrap">
                <app-icon name="lucideMail" size="16" />
                <input
                  class="input"
                  type="email"
                  autocomplete="email"
                  placeholder="tucorreo@ejemplo.com"
                  [value]="email()"
                  (input)="email.set($any($event.target).value)"
                  required
                />
              </span>
            </label>

            <label class="field">
              <span class="field-label">Teléfono</span>
              <span class="input-wrap">
                <app-icon name="lucidePhone" size="16" />
                <input
                  class="input"
                  type="tel"
                  inputmode="numeric"
                  maxlength="9"
                  autocomplete="tel"
                  placeholder="987654321"
                  [value]="telefono()"
                  (input)="telefono.set($any($event.target).value)"
                  required
                />
              </span>
            </label>
          </div>

          <div class="form-grid">
            <label class="field">
              <span class="field-label">Contraseña</span>
              <span class="input-wrap">
                <app-icon name="lucideLockKeyhole" size="16" />
                <input
                  class="input"
                  [type]="verPassword() ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Mín. 8 caracteres"
                  [value]="password()"
                  (input)="password.set($any($event.target).value)"
                  required
                />
                <button
                  type="button"
                  class="input-action"
                  [attr.aria-label]="verPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  (click)="verPassword.set(!verPassword())"
                >
                  <app-icon
                    [name]="verPassword() ? 'lucideEyeOff' : 'lucideEye'"
                    size="16"
                  />
                </button>
              </span>
            </label>

            <label class="field">
              <span class="field-label">Confirmar contraseña</span>
              <span class="input-wrap">
                <app-icon name="lucideLockKeyhole" size="16" />
                <input
                  class="input"
                  [type]="verPassword() ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Repite tu contraseña"
                  [value]="confirmarPassword()"
                  (input)="confirmarPassword.set($any($event.target).value)"
                  required
                />
              </span>
            </label>
          </div>

          <label class="checkbox terms">
            <input
              type="checkbox"
              [checked]="terminos()"
              (change)="terminos.set($any($event.target).checked)"
            />
            <span>
              Acepto los
              <a routerLink="/legal/terminos" target="_blank">términos y condiciones</a>,
              la
              <a routerLink="/legal/privacidad" target="_blank">política de privacidad</a>
              y el
              <a routerLink="/legal/puntos" target="_blank">reglamento de puntos</a>.
            </span>
          </label>

          <button
            type="submit"
            class="btn btn--primary btn--block btn--lg"
            [disabled]="enviando()"
          >
            @if (enviando()) {
              <app-icon name="lucideLoaderCircle" size="18" class="spin" />
              Creando cuenta...
            } @else {
              Crear mi cuenta
              <app-icon name="lucideArrowRight" size="17" />
            }
          </button>
        </form>

        <div class="welcome-bonus">
          <span><app-icon name="lucideGift" size="18" /></span>
          <p>
            <strong>50 puntos de bienvenida</strong>
            Equivalentes a un descuento en tu primer pedido. Se acreditan al crear
            tu cuenta.
          </p>
        </div>

        <p class="switch">
          ¿Ya tienes cuenta?
          <a routerLink="/login" [queryParams]="redirectParams()">Iniciar sesión</a>
        </p>
      }
    </app-auth-shell>
  `,
  styles: [
    `
      .form-head {
        margin-bottom: 22px;
      }

      .form-head h2 {
        margin-top: 2px;
        font-family: var(--font-display);
        font-size: clamp(1.9rem, 3.2vw, 2.5rem);
        font-weight: 600;
        letter-spacing: -0.035em;
      }

      .form-head p {
        margin-top: 7px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.6;
      }

      .form {
        display: grid;
        gap: 12px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .input-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-wrap > app-icon {
        position: absolute;
        left: 13px;
        z-index: 1;
        color: var(--muted-2);
        pointer-events: none;
      }

      .input-wrap .input {
        padding-left: 38px;
        padding-right: 42px;
      }

      .input-action {
        position: absolute;
        right: 7px;
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--muted-2);
        cursor: pointer;
      }

      .input-action:hover {
        background: var(--cream-2);
        color: var(--ink);
      }

      .alert {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 10px 12px;
        border: 1px solid rgba(180, 35, 24, 0.2);
        border-radius: 10px;
        background: var(--danger-soft);
        color: var(--danger);
        font-size: 11px;
        font-weight: 600;
        line-height: 1.5;
      }

      .alert app-icon {
        flex: none;
        margin-top: 1px;
      }

      .terms {
        margin: 2px 0;
        font-size: 9.5px;
      }

      .terms a {
        color: var(--red);
        text-decoration: underline;
      }

      .welcome-bonus {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        margin-top: 14px;
        padding: 10px 12px;
        border-radius: 10px;
        background: var(--gold-soft);
      }

      .welcome-bonus > span {
        display: grid;
        place-items: center;
        flex: none;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--white);
        color: var(--gold-dark);
      }

      .welcome-bonus p {
        color: var(--gold-dark);
        font-size: 9.5px;
        line-height: 1.45;
      }

      .welcome-bonus strong {
        display: block;
        font-size: 10px;
        font-weight: 900;
      }

      .switch {
        margin-top: 18px;
        color: var(--muted);
        font-size: 11.5px;
        text-align: center;
      }

      .switch a {
        color: var(--red);
        font-weight: 800;
        text-decoration: underline;
      }

      .success {
        text-align: center;
      }

      .success__icon {
        display: grid;
        place-items: center;
        width: 74px;
        height: 74px;
        margin: 0 auto 18px;
        border-radius: 50%;
        background: var(--success-soft);
        color: var(--success);
      }

      .success h2 {
        margin: 3px 0 8px;
        font-size: clamp(2rem, 3vw, 2.5rem);
      }

      .success p {
        margin: 0 0 20px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.65;
      }

      @media (max-width: 560px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly nombre = signal('');
  readonly email = signal('');
  readonly telefono = signal('');
  readonly password = signal('');
  readonly confirmarPassword = signal('');
  readonly terminos = signal(false);
  readonly verPassword = signal(false);
  readonly enviando = signal(false);
  readonly error = signal('');
  readonly confirmacion = signal('');

  readonly redirect = computed(
    () => this.router.parseUrl(this.router.url).queryParams['redirect'] as string | undefined,
  );

  readonly redirectParams = computed(() => {
    const redirect = this.redirect();
    return redirect ? { redirect } : {};
  });

  async registrar(event?: Event): Promise<void> {
    event?.preventDefault();
    this.error.set('');

    if (this.nombre().trim().length < 2) {
      this.error.set('Ingresa tu nombre completo.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim())) {
      this.error.set('Ingresa un correo electrónico válido.');
      return;
    }
    if (normalizePhone(this.telefono()).length !== 9) {
      this.error.set('Ingresa un teléfono de 9 dígitos.');
      return;
    }
    if (this.password().length < 8) {
      this.error.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (this.password() !== this.confirmarPassword()) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    if (!this.terminos()) {
      this.error.set('Acepta los términos y condiciones para continuar.');
      return;
    }

    this.enviando.set(true);
    try {
      const result = await this.auth.register({
        nombre: this.nombre().trim(),
        email: this.email().trim(),
        telefono: normalizePhone(this.telefono()),
        password: this.password(),
      });

      if (result.requiresConfirmation) {
        this.confirmacion.set(
          result.message ??
            'Te enviamos un correo para confirmar tu cuenta. Después de confirmarlo, inicia sesión.',
        );
        return;
      }

      if (result.perfil) {
        this.toast.success(
          `Bienvenido, ${result.perfil.nombre.split(/\s+/)[0]}. Ya tienes 50 puntos.`,
        );
        await this.router.navigateByUrl(this.redirect() ?? '/cuenta');
      }
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'No pudimos crear tu cuenta. Inténtalo de nuevo.',
      );
    } finally {
      this.enviando.set(false);
    }
  }
}
