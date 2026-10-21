import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon.component';

type LegalTipo = 'terminos' | 'privacidad' | 'reclamos' | 'puntos';

interface SeccionLegal {
  titulo: string;
  parrafos: string[];
  lista?: string[];
}

const SECCIONES_TERMINOS: SeccionLegal[] = [
  {
    titulo: '1. Identificación del proveedor',
    parrafos: [
      'Pollería Don Pepito es un establecimiento de venta de pollos a la brasa, parrillas, combos y complementos ubicado en la ciudad de Ica, Perú. Para cualquier consulta puedes escribirnos por WhatsApp o correo electrónico a los canales publicados en este sitio.',
    ],
  },
  {
    titulo: '2. Pedidos y confirmación',
    parrafos: [
      'Los pedidos realizados por la web quedan sujetos a confirmación del local y a la disponibilidad de productos. Una vez confirmado el pedido recibirás un código de seguimiento con el que podrás consultar su estado.',
      'El tiempo estimado de preparación es referencial y puede variar según la demanda, la hora y la zona de reparto.',
    ],
  },
  {
    titulo: '3. Precios y promociones',
    parrafos: [
      'Los precios se muestran en soles peruanos con el impuesto incluido. Las promociones son válidas por tiempo limitado, no son acumulables salvo indicación expresa y están sujetas a disponibilidad.',
      'Nos reservamos el derecho de corregir errores evidentes de precio o descripción. Si ello ocurre, te contactaremos antes de procesar el pedido.',
    ],
  },
  {
    titulo: '4. Pagos',
    parrafos: [
      'Aceptamos efectivo, Yape, Plin y tarjeta. El pago con tarjeta puede realizarse al momento de la entrega o recojo. Para pagos en efectivo, procura contar con el monto exacto.',
    ],
  },
  {
    titulo: '5. Delivery y recojo',
    parrafos: [
      'El delivery tiene un costo que se muestra antes de confirmar el pedido y se exonera a partir del monto indicado en la web. El recojo es gratuito en el local.',
      'El cliente es responsable de proporcionar una dirección correcta y un número de teléfono disponible. Si no logramos contactarte o entregar el pedido por causas atribuibles al cliente, el pedido podrá darse por entregado.',
    ],
  },
  {
    titulo: '6. Cancelaciones y reembolsos',
    parrafos: [
      'Puedes solicitar la cancelación de un pedido mientras no haya entrado en preparación. Una vez iniciada la preparación, no procede la cancelación salvo error del local.',
      'Si un pedido no puede atenderse por falta de stock o un error nuestro, te ofreceremos un reemplazo o la devolución del monto pagado por el canal correspondiente.',
    ],
  },
  {
    titulo: '7. Puntos Don Pepito',
    parrafos: [
      'El programa de puntos se rige por las reglas publicadas en la sección "Puntos Don Pepito" de este sitio. Los puntos no son canjeables por dinero en efectivo y no son transferibles.',
    ],
  },
  {
    titulo: '8. Propiedad intelectual',
    parrafos: [
      'La marca, el logo, las fotografías, los textos y el diseño de este sitio son de titularidad de Pollería Don Pepito o se utilizan con autorización. No está permitido su uso comercial sin consentimiento previo por escrito.',
    ],
  },
  {
    titulo: '9. Ley aplicable',
    parrafos: [
      'Estos términos se rigen por la legislación peruana, en especial por el Código de Protección y Defensa del Consumidor (Ley 29571). Cualquier controversia se someterá a las autoridades competentes de la ciudad de Ica.',
    ],
  },
];

const SECCIONES_PRIVACIDAD: SeccionLegal[] = [
  {
    titulo: '1. Responsable del tratamiento',
    parrafos: [
      'Pollería Don Pepito es responsable de los datos personales que nos proporcionas al registrarte, realizar un pedido, reservar o contactarnos. Esta política describe qué datos recopilamos y cómo los usamos.',
    ],
  },
  {
    titulo: '2. Datos que recopilamos',
    parrafos: ['Podemos recopilar los siguientes datos:'],
    lista: [
      'Datos de identificación y contacto: nombre, correo electrónico, teléfono y dirección de entrega.',
      'Datos de cuenta: correo de acceso, rol y puntos acumulados. No almacenamos tu contraseña en texto plano.',
      'Datos de pedidos: productos, montos, método de pago, fecha, dirección y estado del pedido.',
      'Datos técnicos: información necesaria para el funcionamiento del carrito y la sesión, almacenada localmente en tu navegador.',
    ],
  },
  {
    titulo: '3. Finalidad del tratamiento',
    parrafos: ['Utilizamos tus datos para:'],
    lista: [
      'Procesar, preparar y entregar tus pedidos.',
      'Gestionar tu cuenta, tu historial y tu saldo de puntos.',
      'Contactarte para coordinar la entrega o atender consultas y reclamos.',
      'Enviarte comunicaciones relacionadas con tu pedido. Las comunicaciones promocionales requieren tu consentimiento.',
      'Cumplir obligaciones legales y de seguridad.',
    ],
  },
  {
    titulo: '4. Base legal',
    parrafos: [
      'Tratamos tus datos con base en la ejecución de la relación de consumo, tu consentimiento cuando corresponda y el cumplimiento de obligaciones legales, conforme a la Ley 29733, Ley de Protección de Datos Personales.',
    ],
  },
  {
    titulo: '5. Conservación y seguridad',
    parrafos: [
      'Conservamos los datos mientras mantengas una cuenta activa o durante el plazo necesario para atender obligaciones legales y de defensa frente a reclamos. Aplicamos medidas técnicas y organizativas razonables para proteger la información.',
    ],
  },
  {
    titulo: '6. Cookies y almacenamiento local',
    parrafos: [
      'Usamos almacenamiento local del navegador para recordar tu carrito, preferencias y sesión. No utilizamos cookies publicitarias de terceros. Puedes borrar estos datos desde la configuración de tu navegador, aunque algunas funciones podrían dejar de estar disponibles.',
    ],
  },
  {
    titulo: '7. Tus derechos',
    parrafos: [
      'Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición (ARCO) escribiéndonos a los canales de contacto publicados. También puedes solicitar la portabilidad y revocar tu consentimiento cuando sea aplicable.',
      'Si consideras que no hemos atendido adecuadamente tu solicitud, puedes acudir a la Autoridad Nacional de Protección de Datos Personales.',
    ],
  },
  {
    titulo: '8. Cambios en esta política',
    parrafos: [
      'Podemos actualizar esta política para reflejar cambios en nuestras prácticas o en la normativa. Publicaremos la versión vigente en esta página con su fecha de actualización.',
    ],
  },
];

const CONTENIDO: Record<'terminos' | 'privacidad', SeccionLegal[]> = {
  terminos: SECCIONES_TERMINOS,
  privacidad: SECCIONES_PRIVACIDAD,
};

const LEGALES = [
  { id: 'terminos', label: 'Términos y condiciones', icon: 'lucideFileText' },
  { id: 'privacidad', label: 'Política de privacidad', icon: 'lucideShieldCheck' },
  { id: 'reclamos', label: 'Libro de reclamaciones', icon: 'lucideMessageSquare' },
  { id: 'puntos', label: 'Puntos Don Pepito', icon: 'lucideGift' },
] as const;

interface FormularioReclamo {
  nombre: string;
  documento: string;
  domicilio: string;
  email: string;
  telefono: string;
  pedido: string;
  tipo: 'reclamo' | 'queja';
  detalle: string;
}

const FORM_INICIAL: FormularioReclamo = {
  nombre: '',
  documento: '',
  domicilio: '',
  email: '',
  telefono: '',
  pedido: '',
  tipo: 'reclamo',
  detalle: '',
};

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <section class="legal-hero">
      <div class="container legal-hero__inner">
        <span class="eyebrow eyebrow--gold">{{ eyebrow() }}</span>
        <h1>{{ titulo() }}</h1>
        <p>{{ descripcion() }}</p>
        <span class="legal-hero__date">
          <app-icon name="lucideCalendar" size="13" />
          Última actualización: 20 de octubre de 2026
        </span>
      </div>
    </section>

    <section class="section legal-body">
      <div class="container legal-grid">
        <aside class="legal-nav">
          <span class="legal-nav__title">Información legal</span>
          @for (item of legales; track item.id) {
            <a
              [routerLink]="['/legal', item.id]"
              [class.is-active]="tipoActual() === item.id"
            >
              <app-icon [name]="item.icon" size="16" />
              {{ item.label }}
              <app-icon name="lucideChevronRight" size="13" class="legal-nav__arrow" />
            </a>
          }

          <div class="legal-nav__help">
            <app-icon name="lucideCircleHelp" size="18" />
            <div>
              <strong>¿Necesitas ayuda?</strong>
              <p>Escríbenos por WhatsApp y te respondemos lo antes posible.</p>
            </div>
          </div>
        </aside>

        <div class="legal-card">
          @switch (tipoActual()) {
            @case ('reclamos') {
              <div class="legal-head">
                <span class="legal-head__icon">
                  <app-icon name="lucideMessageSquare" size="24" />
                </span>
                <div>
                  <span class="eyebrow">Libro de reclamaciones virtual</span>
                  <h2>Registra tu reclamo o queja</h2>
                  <p>
                    Conforme al Código de Protección y Defensa del Consumidor,
                    atendemos tu reclamo en un plazo máximo de 15 días hábiles.
                  </p>
                </div>
              </div>

              @if (reclamoEnviado()) {
                <div class="legal-success">
                  <span><app-icon name="lucideCheckCircle2" size="34" /></span>
                  <h3>Registramos tu reclamo</h3>
                  <p>
                    Tu constancia es
                    <strong>{{ codigoReclamo() }}</strong>. Conserva este código
                    para hacer seguimiento. También enviamos una copia al correo
                    registrado.
                  </p>
                  <div class="legal-success__actions">
                    <button type="button" class="btn btn--dark" (click)="nuevoReclamo()">
                      Registrar otro reclamo
                    </button>
                    <a routerLink="/" class="btn btn--outline">Volver al inicio</a>
                  </div>
                </div>
              } @else {
                <form class="claim-form" (submit)="enviarReclamo($event)">
                  <div class="claim-note">
                    <app-icon name="lucideInfo" size="16" />
                    <p>
                      Un <strong>reclamo</strong> es una disconformidad con el producto
                      o servicio. Una <strong>queja</strong> es un malestar con la
                      atención recibida. Ambos se atienden por el mismo canal.
                    </p>
                  </div>

                  <div class="form-grid">
                    <label class="field">
                      <span class="field-label">Nombre completo *</span>
                      <input
                        class="input"
                        type="text"
                        [value]="formulario().nombre"
                        (input)="setCampo('nombre', $any($event.target).value)"
                        placeholder="Ej. Ana Torres"
                      />
                    </label>
                    <label class="field">
                      <span class="field-label">DNI / CE *</span>
                      <input
                        class="input"
                        type="text"
                        inputmode="numeric"
                        maxlength="12"
                        [value]="formulario().documento"
                        (input)="setCampo('documento', $any($event.target).value)"
                        placeholder="8 dígitos"
                      />
                    </label>
                  </div>

                  <label class="field">
                    <span class="field-label">Domicilio *</span>
                    <input
                      class="input"
                      type="text"
                      [value]="formulario().domicilio"
                      (input)="setCampo('domicilio', $any($event.target).value)"
                      placeholder="Calle, número, distrito y provincia"
                    />
                  </label>

                  <div class="form-grid">
                    <label class="field">
                      <span class="field-label">Correo electrónico *</span>
                      <input
                        class="input"
                        type="email"
                        [value]="formulario().email"
                        (input)="setCampo('email', $any($event.target).value)"
                        placeholder="tucorreo@ejemplo.com"
                      />
                    </label>
                    <label class="field">
                      <span class="field-label">Teléfono</span>
                      <input
                        class="input"
                        type="tel"
                        maxlength="9"
                        [value]="formulario().telefono"
                        (input)="setCampo('telefono', $any($event.target).value)"
                        placeholder="9 dígitos"
                      />
                    </label>
                  </div>

                  <div class="form-grid">
                    <label class="field">
                      <span class="field-label">Tipo de solicitud *</span>
                      <select
                        class="input"
                        [value]="formulario().tipo"
                        (change)="setTipo($any($event.target).value)"
                      >
                        <option value="reclamo">Reclamo</option>
                        <option value="queja">Queja</option>
                      </select>
                    </label>
                    <label class="field">
                      <span class="field-label">Código de pedido (opcional)</span>
                      <input
                        class="input"
                        type="text"
                        [value]="formulario().pedido"
                        (input)="setCampo('pedido', $any($event.target).value)"
                        placeholder="DP-000000"
                      />
                    </label>
                  </div>

                  <label class="field">
                    <span class="field-label">Detalle del reclamo o queja *</span>
                    <textarea
                      class="input"
                      rows="5"
                      maxlength="800"
                      [value]="formulario().detalle"
                      (input)="setCampo('detalle', $any($event.target).value)"
                      placeholder="Cuéntanos qué ocurrió, cuándo y qué solución esperas."
                    ></textarea>
                    <span class="hint">{{ formulario().detalle.length }}/800 caracteres</span>
                  </label>

                  <label class="claim-check">
                    <input type="checkbox" [checked]="acepta()" (change)="acepta.set($any($event.target).checked)" />
                    <span>
                      Declaro que la información es veraz y autorizo el uso de mis
                      datos para atender este reclamo.
                    </span>
                  </label>

                  <button type="submit" class="btn btn--primary" [disabled]="enviando()">
                    @if (enviando()) {
                      <app-icon name="lucideLoaderCircle" size="16" class="spin" />
                      Enviando...
                    } @else {
                      <app-icon name="lucideSend" size="16" />
                      Enviar reclamo
                    }
                  </button>
                </form>
              }
            }

            @case ('puntos') {
              <div class="legal-head">
                <span class="legal-head__icon legal-head__icon--gold">
                  <app-icon name="lucideGift" size="24" />
                </span>
                <div>
                  <span class="eyebrow">Club Don Pepito</span>
                  <h2>Puntos Don Pepito</h2>
                  <p>
                    Un programa simple: comes rico, sumas puntos y canjeas
                    descuentos en tus próximos pedidos.
                  </p>
                </div>
              </div>

              <div class="points-steps">
                <article>
                  <span>01</span>
                  <h3>Pide y suma</h3>
                  <p>Gana 1 punto por cada S/ 1 de tu pedido, sin contar el delivery.</p>
                </article>
                <article>
                  <span>02</span>
                  <h3>Acumula</h3>
                  <p>Cada 100 puntos equivalen a S/ 1 de descuento directo.</p>
                </article>
                <article>
                  <span>03</span>
                  <h3>Canjea</h3>
                  <p>Usa tus puntos en el checkout. Puedes cubrir hasta el 50 % del subtotal.</p>
                </article>
              </div>

              <h3 class="legal-subtitle">Reglas del programa</h3>
              <ul class="legal-list">
                <li>Los puntos se acreditan al confirmar el pedido y se revierten si el pedido se cancela.</li>
                <li>El canje se realiza en bloques de 100 puntos. No se pueden canjear fracciones.</li>
                <li>El descuento máximo por pedido es el 50 % del subtotal de productos.</li>
                <li>Los puntos tienen una vigencia de 365 días desde que se ganan.</li>
                <li>Los puntos no son transferibles ni canjeables por dinero en efectivo.</li>
                <li>El registro de una cuenta nueva otorga 50 puntos de bienvenida, una sola vez.</li>
                <li>Todos los miembros tienen los mismos beneficios; el club no tiene niveles.</li>
              </ul>

              <div class="legal-cta">
                <div>
                  <strong>¿Listo para sumar?</strong>
                  <p>Haz tu pedido y empieza a acumular puntos hoy mismo.</p>
                </div>
                <a routerLink="/carta" class="btn btn--primary">
                  Ver la carta
                  <app-icon name="lucideArrowRight" size="16" />
                </a>
              </div>
            }

            @default {
              <div class="legal-content">
                @for (seccion of contenido(); track seccion.titulo) {
                  <section>
                    <h2>{{ seccion.titulo }}</h2>
                    @for (parrafo of seccion.parrafos; track $index) {
                      <p>{{ parrafo }}</p>
                    }
                    @if (seccion.lista?.length) {
                      <ul class="legal-list">
                        @for (item of seccion.lista; track $index) {
                          <li>{{ item }}</li>
                        }
                      </ul>
                    }
                  </section>
                }
              </div>
            }
          }

          <div class="legal-foot">
            <app-icon name="lucideCircleAlert" size="16" />
            <p>
              Si tienes dudas sobre este documento, escríbenos por WhatsApp o al
              correo de atención publicado en el sitio.
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .legal-hero {
        padding: clamp(44px, 6vw, 70px) 0 clamp(36px, 5vw, 54px);
        background:
          radial-gradient(circle at 85% 0%, rgba(232, 181, 77, 0.16), transparent 34%),
          var(--ink);
        color: var(--cream);
      }

      .legal-hero__inner {
        max-width: 760px;
      }

      .legal-hero h1 {
        margin: 8px 0 12px;
        font-family: var(--font-display);
        font-size: clamp(2.2rem, 5vw, 3.6rem);
        font-weight: 600;
        letter-spacing: -0.045em;
      }

      .legal-hero p {
        max-width: 620px;
        color: rgba(255, 248, 238, 0.58);
        font-size: 13.5px;
        line-height: 1.65;
      }

      .legal-hero__date {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 18px;
        padding: 6px 10px;
        border: 1px solid rgba(255, 248, 238, 0.14);
        border-radius: var(--radius-pill);
        color: rgba(255, 248, 238, 0.45);
        font-size: 9px;
        font-weight: 700;
      }

      .legal-body {
        padding-top: 30px;
      }

      .legal-grid {
        display: grid;
        grid-template-columns: 270px 1fr;
        align-items: start;
        gap: 24px;
      }

      .legal-nav {
        position: sticky;
        top: calc(var(--header-h) + 18px);
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .legal-nav__title {
        padding: 0 10px 8px;
        color: var(--muted-2);
        font-size: 8.5px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .legal-nav a {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 10px;
        border-radius: 10px;
        color: var(--muted);
        font-size: 11px;
        font-weight: 800;
        transition: var(--transition);
      }

      .legal-nav a:hover {
        background: var(--cream-2);
        color: var(--ink);
      }

      .legal-nav a.is-active {
        background: var(--ink);
        color: var(--cream);
      }

      .legal-nav__arrow {
        margin-left: auto;
        opacity: 0.45;
      }

      .legal-nav__help {
        display: flex;
        gap: 10px;
        margin-top: 18px;
        padding: 13px;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: var(--cream-2);
        color: var(--ink);
      }

      .legal-nav__help > app-icon {
        flex: none;
        color: var(--red);
      }

      .legal-nav__help strong {
        display: block;
        font-size: 10px;
      }

      .legal-nav__help p {
        margin-top: 2px;
        color: var(--muted);
        font-size: 8.5px;
        line-height: 1.5;
      }

      .legal-card {
        padding: clamp(22px, 3.4vw, 40px);
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        background: var(--white);
        box-shadow: var(--shadow-sm);
      }

      .legal-head {
        display: flex;
        gap: 14px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--line);
        margin-bottom: 24px;
      }

      .legal-head__icon {
        display: grid;
        place-items: center;
        flex: none;
        width: 52px;
        height: 52px;
        border-radius: 14px;
        background: var(--red-soft);
        color: var(--red);
      }

      .legal-head__icon--gold {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .legal-head h2 {
        margin: 2px 0 4px;
        font-family: var(--font-display);
        font-size: clamp(1.7rem, 3vw, 2.3rem);
        font-weight: 600;
        letter-spacing: -0.035em;
      }

      .legal-head p {
        color: var(--muted);
        font-size: 11.5px;
        line-height: 1.6;
      }

      .legal-content section {
        margin-bottom: 22px;
      }

      .legal-content h2 {
        margin-bottom: 7px;
        font-family: var(--font-display);
        font-size: 19px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .legal-content p,
      .legal-card > p {
        margin-bottom: 9px;
        color: var(--muted);
        font-size: 11.5px;
        line-height: 1.7;
      }

      .legal-list {
        display: grid;
        gap: 7px;
        margin: 9px 0;
        padding-left: 18px;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.65;
      }

      .legal-list li::marker {
        color: var(--red);
      }

      .legal-subtitle {
        margin: 24px 0 10px;
        font-family: var(--font-display);
        font-size: 19px;
        font-weight: 600;
      }

      .legal-foot {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-top: 26px;
        padding-top: 16px;
        border-top: 1px solid var(--line);
        color: var(--muted-2);
      }

      .legal-foot app-icon {
        flex: none;
        margin-top: 1px;
        color: var(--gold-dark);
      }

      .legal-foot p {
        font-size: 9.5px;
        line-height: 1.55;
      }

      .claim-form {
        display: grid;
        gap: 14px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .claim-note {
        display: flex;
        gap: 9px;
        padding: 12px;
        border-radius: 10px;
        background: var(--cream-2);
        color: var(--muted);
      }

      .claim-note app-icon {
        flex: none;
        margin-top: 1px;
        color: var(--gold-dark);
      }

      .claim-note p {
        font-size: 9.5px;
        line-height: 1.6;
      }

      .claim-note strong {
        color: var(--ink);
      }

      .claim-check {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        color: var(--muted);
        font-size: 9.5px;
        line-height: 1.55;
        cursor: pointer;
      }

      .claim-check input {
        flex: none;
        width: 15px;
        height: 15px;
        margin-top: 1px;
        accent-color: var(--red);
      }

      .claim-form > button {
        justify-self: start;
      }

      .legal-success {
        padding: 34px 20px;
        text-align: center;
      }

      .legal-success > span {
        display: inline-grid;
        place-items: center;
        width: 70px;
        height: 70px;
        margin-bottom: 14px;
        border-radius: 50%;
        background: var(--success-soft);
        color: var(--success);
      }

      .legal-success h3 {
        font-family: var(--font-display);
        font-size: 24px;
        font-weight: 600;
      }

      .legal-success p {
        max-width: 430px;
        margin: 7px auto 18px;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.65;
      }

      .legal-success p strong {
        color: var(--ink);
      }

      .legal-success__actions {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 8px;
      }

      .points-steps {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 9px;
        margin-bottom: 24px;
      }

      .points-steps article {
        padding: 15px;
        border: 1px solid var(--line);
        border-radius: 13px;
        background: var(--cream);
      }

      .points-steps span {
        color: var(--red);
        font-family: var(--font-display);
        font-size: 23px;
        font-weight: 600;
        opacity: 0.45;
      }

      .points-steps h3 {
        margin: 5px 0 3px;
        font-family: var(--font-display);
        font-size: 16px;
        font-weight: 600;
      }

      .points-steps p {
        color: var(--muted);
        font-size: 9.5px;
        line-height: 1.55;
      }

      .levels {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 9px;
      }

      .levels article {
        padding: 15px;
        border: 1px solid var(--line);
        border-radius: 12px;
      }

      .levels__badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: var(--radius-pill);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .levels__badge--bronze {
        background: #f5e9dc;
        color: #8a5a2b;
      }

      .levels__badge--red {
        background: var(--red-soft);
        color: var(--red);
      }

      .levels__badge--gold {
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .levels article strong {
        display: block;
        margin-top: 7px;
        font-size: 10.5px;
        font-weight: 900;
      }

      .levels article p {
        margin-top: 2px;
        color: var(--muted);
        font-size: 8.5px;
        line-height: 1.5;
      }

      .legal-cta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-top: 24px;
        padding: 16px;
        border-radius: 13px;
        background: var(--cream-2);
      }

      .legal-cta strong {
        font-family: var(--font-display);
        font-size: 18px;
        font-weight: 600;
      }

      .legal-cta p {
        color: var(--muted);
        font-size: 9.5px;
      }

      @media (max-width: 900px) {
        .legal-grid {
          grid-template-columns: 1fr;
        }
        .legal-nav {
          position: static;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .legal-nav__title,
        .legal-nav__help {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 600px) {
        .form-grid,
        .points-steps,
        .levels {
          grid-template-columns: 1fr;
        }
        .legal-head {
          flex-direction: column;
        }
        .legal-cta {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly legales = LEGALES;
  readonly formulario = signal<FormularioReclamo>({ ...FORM_INICIAL });
  readonly acepta = signal(false);
  readonly enviando = signal(false);
  readonly reclamoEnviado = signal(false);
  readonly codigoReclamo = signal('');

  readonly tipo = toSignal(
    this.route.data,
    { initialValue: { tipo: 'terminos' as LegalTipo } },
  );

  readonly tipoActual = computed<LegalTipo>(() => {
    const value = this.tipo()['tipo'];
    return value === 'privacidad' || value === 'reclamos' || value === 'puntos'
      ? value
      : 'terminos';
  });

  readonly contenido = computed(() =>
    this.tipoActual() === 'privacidad' ? CONTENIDO.privacidad : CONTENIDO.terminos,
  );

  readonly titulo = computed(() => {
    switch (this.tipoActual()) {
      case 'privacidad':
        return 'Política de privacidad';
      case 'reclamos':
        return 'Libro de reclamaciones';
      case 'puntos':
        return 'Puntos Don Pepito';
      default:
        return 'Términos y condiciones';
    }
  });

  readonly eyebrow = computed(() => {
    switch (this.tipoActual()) {
      case 'privacidad':
        return 'Tus datos, protegidos';
      case 'reclamos':
        return 'Atención al consumidor';
      case 'puntos':
        return 'Club Don Pepito';
      default:
        return 'Información legal';
    }
  });

  readonly descripcion = computed(() => {
    switch (this.tipoActual()) {
      case 'privacidad':
        return 'Conoce qué datos recopilamos, para qué los usamos y cómo puedes ejercer tus derechos.';
      case 'reclamos':
        return 'Registra tu reclamo o queja de forma virtual. Te damos una constancia con código de seguimiento.';
      case 'puntos':
        return 'Cómo ganar, acumular y canjear tus puntos en cada pedido.';
      default:
        return 'Las reglas claras para pedir, recibir y disfrutar tu pollo favorito.';
    }
  });

  constructor() {
    effect(() => {
      const perfil = this.auth.perfil();
      if (!perfil) return;
      this.formulario.update((form) => ({
        ...form,
        nombre: form.nombre || perfil.nombre,
        email: form.email || perfil.email,
        telefono: form.telefono || perfil.telefono,
      }));
    });
  }

  setCampo(campo: Exclude<keyof FormularioReclamo, 'tipo'>, value: string): void {
    this.formulario.update((form) => ({ ...form, [campo]: value }));
  }

  setTipo(value: string): void {
    const tipo = value === 'queja' ? 'queja' : 'reclamo';
    this.formulario.update((form) => ({ ...form, tipo }));
  }

  enviarReclamo(event: Event): void {
    event.preventDefault();
    const form = this.formulario();
    if (form.nombre.trim().length < 3) {
      this.toast.warning('Ingresa tu nombre completo.');
      return;
    }
    if (form.documento.replace(/\D/g, '').length < 8) {
      this.toast.warning('Ingresa un DNI o carné válido.');
      return;
    }
    if (form.domicilio.trim().length < 5) {
      this.toast.warning('Ingresa tu domicilio completo.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      this.toast.warning('Ingresa un correo electrónico válido.');
      return;
    }
    if (form.detalle.trim().length < 20) {
      this.toast.warning('Describe el detalle con al menos 20 caracteres.');
      return;
    }
    if (!this.acepta()) {
      this.toast.warning('Debes aceptar la declaración para continuar.');
      return;
    }

    this.enviando.set(true);
    setTimeout(() => {
      const codigo = `LR-${Date.now().toString().slice(-6)}`;
      this.codigoReclamo.set(codigo);
      this.reclamoEnviado.set(true);
      this.enviando.set(false);
      this.toast.success('Reclamo registrado correctamente.');
    }, 700);
  }

  nuevoReclamo(): void {
    this.formulario.set({ ...FORM_INICIAL });
    this.acepta.set(false);
    this.reclamoEnviado.set(false);
    this.codigoReclamo.set('');
  }
}
