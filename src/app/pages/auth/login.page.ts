import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthShellComponent } from '../../shared/components/auth-shell.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [RouterLink, AuthShellComponent, IconComponent],
  template: `
    <app-auth-shell
      eyebrow="Bienvenido de vuelta"
      title="Tu mesa está lista."
      subtitle="Inicia sesión para pedir más rápido, revisar tus pedidos y canjear tus puntos."
      quote="Pedí el combo familiar para el cumpleaños de mi mamá y quedaron todos encantados. Llegó puntual y bien empacado."
      quoteAuthor="Carlos Mendoza · Cliente frecuente"
    >
      <div class="form-head">
        <span class="eyebrow">Iniciar sesión</span>
        <h2>Hola de nuevo</h2>
        <p>Ingresa con tu correo y contraseña para continuar.</p>
      </div>

      <form class="form" (submit)="entrar($event)" novalidate>
        @if (error()) {
          <div class="alert" role="alert">
            <app-icon name="lucideCircleAlert" size="17" />
            <span>{{ error() }}</span>
          </div>
        }

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
          <span class="field-label">Contraseña</span>
          <span class="input-wrap">
            <app-icon name="lucideLockKeyhole" size="16" />
            <input
              class="input"
              [type]="verPassword() ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Tu contraseña"
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

        <button
          type="submit"
          class="btn btn--primary btn--block btn--lg"
          [disabled]="enviando()"
        >
          @if (enviando()) {
            <app-icon name="lucideLoaderCircle" size="18" class="spin" />
            Ingresando...
          } @else {
            Entrar a mi cuenta
            <app-icon name="lucideArrowRight" size="17" />
          }
        </button>
      </form>

      <div class="divider-text"><span>o prueba la demo</span></div>

      <div class="demo">
        <button type="button" class="demo__btn" (click)="usarDemo('cliente')">
          <span class="demo__icon"><app-icon name="lucideUser" size="16" /></span>
          <span>
            <strong>Cliente demo</strong>
            <small>cliente@demo.pe · demo1234</small>
          </span>
          <app-icon name="lucideArrowRight" size="14" />
        </button>
        <button type="button" class="demo__btn" (click)="usarDemo('admin')">
          <span class="demo__icon demo__icon--gold">
            <app-icon name="lucideShieldCheck" size="16" />
          </span>
          <span>
            <strong>Admin demo</strong>
            <small>admin@donpepito.pe · admin123</small>
          </span>
          <app-icon name="lucideArrowRight" size="14" />
        </button>
      </div>

      <p class="switch">
        ¿Aún no tienes cuenta?
        <a routerLink="/register" [queryParams]="redirectParams()">Crear una gratis</a>
      </p>
    </app-auth-shell>
  `,
  styles: [
    `
      .form-head {
        margin-bottom: 24px;
      }

      .form-head h2 {
        margin-top: 2px;
        font-family: var(--font-display);
        font-size: clamp(2rem, 3.4vw, 2.7rem);
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
        gap: 14px;
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
        transition: var(--transition);
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

      .divider-text {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 20px 0 14px;
        color: var(--muted-2);
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .divider-text::before,
      .divider-text::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--line);
      }

      .demo {
        display: grid;
        gap: 8px;
      }

      .demo__btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 11px;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: var(--white);
        text-align: left;
        transition: var(--transition);
      }

      .demo__btn:hover {
        border-color: var(--red);
        background: var(--red-soft);
      }

      .demo__icon {
        display: grid;
        place-items: center;
        flex: none;
        width: 32px;
        height: 32px;
        border-radius: 9px;
        background: var(--red-soft);
        color: var(--red);
      }

      .demo__icon--gold {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .demo__btn > span:nth-child(2) {
        display: flex;
        flex: 1;
        flex-direction: column;
        line-height: 1.25;
      }

      .demo__btn strong {
        font-size: 10.5px;
        font-weight: 800;
      }

      .demo__btn small {
        color: var(--muted);
        font-size: 9px;
      }

      .demo__btn > app-icon {
        color: var(--muted-2);
      }

      .switch {
        margin-top: 20px;
        color: var(--muted);
        font-size: 11.5px;
        text-align: center;
      }

      .switch a {
        color: var(--red);
        font-weight: 800;
        text-decoration: underline;
      }
    `,
  ],
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly email = signal('');
  readonly password = signal('');
  readonly verPassword = signal(false);
  readonly enviando = signal(false);
  readonly error = signal('');

  readonly redirect = computed(
    () => this.router.parseUrl(this.router.url).queryParams['redirect'] as string | undefined,
  );

  readonly redirectParams = computed(() => {
    const redirect = this.redirect();
    return redirect ? { redirect } : {};
  });

  async entrar(event?: Event): Promise<void> {
    event?.preventDefault();
    if (!this.email().trim() || !this.password()) {
      this.error.set('Ingresa tu correo y contraseña.');
      return;
    }
    this.error.set('');
    this.enviando.set(true);
    try {
      const perfil = await this.auth.login(this.email(), this.password());
      const nombre = perfil.nombre.split(/\s+/)[0];
      this.toast.success(`Bienvenido, ${nombre}.`);
      const destino =
        this.redirect() ?? (perfil.rol === 'admin' ? '/admin' : '/cuenta');
      await this.router.navigateByUrl(destino);
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'No pudimos iniciar sesión. Inténtalo de nuevo.',
      );
    } finally {
      this.enviando.set(false);
    }
  }

  usarDemo(tipo: 'cliente' | 'admin'): void {
    if (tipo === 'admin') {
      this.email.set('admin@donpepito.pe');
      this.password.set('admin123');
    } else {
      this.email.set('cliente@demo.pe');
      this.password.set('demo1234');
    }
    void this.entrar();
  }
}
