import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfigPuntos, ConfigWeb } from '../../../core/models';
import { SiteConfigService } from '../../../core/services/site-config.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon.component';
import { SolesPipe } from '../../../shared/pipes/soles.pipe';

type CampoTextoWeb =
  | 'whatsapp'
  | 'direccion'
  | 'horario'
  | 'instagram'
  | 'facebook'
  | 'email'
  | 'googleMapsUrl';

type CampoNumeroWeb = 'deliveryFee' | 'freeDeliveryFrom' | 'pedidoMinimo';
type CampoNumeroPuntos =
  | 'puntosPorSol'
  | 'bloqueCanje'
  | 'valorBloque'
  | 'topePorcentaje'
  | 'vencimientoDias';

@Component({
  selector: 'app-admin-settings-page',
  standalone: true,
  imports: [RouterLink, IconComponent, SolesPipe],
  template: `
    <div class="admin-page">
      <header class="page-head">
        <div class="page-head__info">
          <span class="eyebrow">Análisis</span>
          <h1>Configuración</h1>
          <p>Reglas de delivery, datos de contacto y programa de fidelidad.</p>
        </div>
        <div class="page-head__actions">
          <button type="button" class="btn btn--ghost btn--sm" (click)="restablecer()" [disabled]="guardando()">
            <app-icon name="lucideRotateCcw" size="14" />
            Descartar cambios
          </button>
          <button type="button" class="btn btn--primary btn--sm" (click)="guardar()" [disabled]="guardando()">
            <app-icon name="lucideSave" size="14" />
            {{ guardando() ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </header>

      @if (config.isDemo()) {
        <div class="demo-note">
          <app-icon name="lucideInfo" size="16" />
          <p>
            Los cambios se guardan en este navegador (modo demo). Al conectar Supabase se
            sincronizarán con la base de datos.
          </p>
        </div>
      }

      <div class="settings-layout">
        <div class="settings-main">
          <section class="admin-panel">
            <div class="admin-panel__head">
              <div class="panel-title">
                <span class="panel-title__icon"><app-icon name="lucideStore" size="17" /></span>
                <div>
                  <h2>Datos del local</h2>
                  <p>Cómo te contactan y dónde te encuentran.</p>
                </div>
              </div>
            </div>
            <div class="admin-panel__body">
              <div class="form-grid">
                <label class="field field--full">
                  <span class="field-label">Dirección</span>
                  <input
                    class="input"
                    type="text"
                    [value]="web().direccion"
                    (input)="webTexto('direccion', $any($event.target).value)"
                  />
                </label>
                <label class="field">
                  <span class="field-label">Horario de atención</span>
                  <input
                    class="input"
                    type="text"
                    [value]="web().horario"
                    (input)="webTexto('horario', $any($event.target).value)"
                  />
                </label>
                <label class="field">
                  <span class="field-label">WhatsApp</span>
                  <input
                    class="input"
                    type="tel"
                    [value]="web().whatsapp"
                    (input)="webTexto('whatsapp', $any($event.target).value)"
                  />
                </label>
                <label class="field">
                  <span class="field-label">Correo</span>
                  <input
                    class="input"
                    type="email"
                    [value]="web().email"
                    (input)="webTexto('email', $any($event.target).value)"
                  />
                </label>
                <label class="field">
                  <span class="field-label">Google Maps (URL)</span>
                  <input
                    class="input"
                    type="url"
                    [value]="web().googleMapsUrl"
                    (input)="webTexto('googleMapsUrl', $any($event.target).value)"
                  />
                </label>
              </div>
            </div>
          </section>

          <section class="admin-panel">
            <div class="admin-panel__head">
              <div class="panel-title">
                <span class="panel-title__icon"><app-icon name="lucideTruck" size="17" /></span>
                <div>
                  <h2>Delivery y pedido mínimo</h2>
                  <p>Se aplican automáticamente en el checkout.</p>
                </div>
              </div>
            </div>
            <div class="admin-panel__body">
              <div class="form-grid form-grid--3">
                <label class="field">
                  <span class="field-label">Costo de delivery (S/)</span>
                  <input
                    class="input"
                    type="number"
                    min="0"
                    step="0.5"
                    [value]="web().deliveryFee"
                    (input)="webNumero('deliveryFee', $any($event.target).value)"
                  />
                </label>
                <label class="field">
                  <span class="field-label">Delivery gratis desde (S/)</span>
                  <input
                    class="input"
                    type="number"
                    min="0"
                    step="1"
                    [value]="web().freeDeliveryFrom"
                    (input)="webNumero('freeDeliveryFrom', $any($event.target).value)"
                  />
                </label>
                <label class="field">
                  <span class="field-label">Pedido mínimo (S/)</span>
                  <input
                    class="input"
                    type="number"
                    min="0"
                    step="1"
                    [value]="web().pedidoMinimo"
                    (input)="webNumero('pedidoMinimo', $any($event.target).value)"
                  />
                </label>
              </div>
              <p class="form-hint">
                <app-icon name="lucideInfo" size="13" />
                Si el pedido alcanza el monto de envío gratis, el costo se muestra en S/0.00.
              </p>
            </div>
          </section>

          <section class="admin-panel">
            <div class="admin-panel__head">
              <div class="panel-title">
                <span class="panel-title__icon"><app-icon name="lucideShare2" size="17" /></span>
                <div>
                  <h2>Redes sociales</h2>
                  <p>Enlaces visibles en el pie del sitio.</p>
                </div>
              </div>
            </div>
            <div class="admin-panel__body">
              <div class="form-grid">
                <label class="field">
                  <span class="field-label">Instagram</span>
                  <div class="input-icon">
                    <app-icon name="brandInstagram" size="15" />
                    <input
                      class="input"
                      type="url"
                      [value]="web().instagram"
                      (input)="webTexto('instagram', $any($event.target).value)"
                    />
                  </div>
                </label>
                <label class="field">
                  <span class="field-label">Facebook</span>
                  <div class="input-icon">
                    <app-icon name="brandFacebook" size="15" />
                    <input
                      class="input"
                      type="url"
                      [value]="web().facebook"
                      (input)="webTexto('facebook', $any($event.target).value)"
                    />
                  </div>
                </label>
              </div>
            </div>
          </section>

          <section class="admin-panel">
            <div class="admin-panel__head">
              <div class="panel-title">
                <span class="panel-title__icon"><app-icon name="lucideGift" size="17" /></span>
                <div>
                  <h2>Programa de puntos</h2>
                  <p>Acumulación, canje y vigencia de los puntos.</p>
                </div>
              </div>
              <a routerLink="/legal/puntos" class="btn btn--ghost btn--sm" target="_blank">
                <app-icon name="lucideExternalLink" size="13" />
                Reglamento
              </a>
            </div>
            <div class="admin-panel__body">
              <div class="form-grid form-grid--3">
                <label class="field">
                  <span class="field-label">Puntos por cada S/1</span>
                  <input
                    class="input"
                    type="number"
                    min="1"
                    step="1"
                    [value]="puntos().puntosPorSol"
                    (input)="puntosNumero('puntosPorSol', $any($event.target).value)"
                  />
                </label>
                <label class="field">
                  <span class="field-label">Puntos por bloque</span>
                  <input
                    class="input"
                    type="number"
                    min="1"
                    step="10"
                    [value]="puntos().bloqueCanje"
                    (input)="puntosNumero('bloqueCanje', $any($event.target).value)"
                  />
                </label>
                <label class="field">
                  <span class="field-label">Valor del bloque (S/)</span>
                  <input
                    class="input"
                    type="number"
                    min="0"
                    step="0.5"
                    [value]="puntos().valorBloque"
                    (input)="puntosNumero('valorBloque', $any($event.target).value)"
                  />
                </label>
                <label class="field">
                  <span class="field-label">Tope de descuento (%)</span>
                  <input
                    class="input"
                    type="number"
                    min="1"
                    max="100"
                    step="5"
                    [value]="puntos().topePorcentaje"
                    (input)="puntosNumero('topePorcentaje', $any($event.target).value)"
                  />
                </label>
                <label class="field">
                  <span class="field-label">Vigencia (días)</span>
                  <input
                    class="input"
                    type="number"
                    min="1"
                    step="30"
                    [value]="puntos().vencimientoDias"
                    (input)="puntosNumero('vencimientoDias', $any($event.target).value)"
                  />
                </label>
              </div>
              <p class="form-hint">
                <app-icon name="lucideInfo" size="13" />
                El canje se aplica por bloques completos y nunca supera el
                {{ puntos().topePorcentaje }}% del subtotal.
              </p>
            </div>
          </section>
        </div>

        <aside class="settings-aside">
          <div class="preview-card">
            <div class="preview-card__head">
              <span class="eyebrow">Vista rápida</span>
              <h2>Así lo verá el cliente</h2>
            </div>

            <div class="preview-contact">
              <div>
                <app-icon name="lucideMapPin" size="15" />
                <span>{{ web().direccion || 'Dirección pendiente' }}</span>
              </div>
              <div>
                <app-icon name="lucideClock" size="15" />
                <span>{{ web().horario || 'Horario pendiente' }}</span>
              </div>
              <div>
                <app-icon name="brandWhatsapp" size="15" />
                <span>{{ web().whatsapp || 'WhatsApp pendiente' }}</span>
              </div>
            </div>

            <div class="preview-block">
              <span class="preview-block__title">Delivery</span>
              <div class="preview-line">
                <span>Costo</span>
                <strong>{{ web().deliveryFee | soles }}</strong>
              </div>
              <div class="preview-line">
                <span>Gratis desde</span>
                <strong>{{ web().freeDeliveryFrom | soles }}</strong>
              </div>
              <div class="preview-line">
                <span>Pedido mínimo</span>
                <strong>{{ web().pedidoMinimo | soles }}</strong>
              </div>
            </div>

            <div class="preview-block">
              <span class="preview-block__title">Simulador de puntos</span>
              <label class="field">
                <span class="field-label">Monto del pedido (S/)</span>
                <input
                  class="input"
                  type="number"
                  min="0"
                  step="10"
                  [value]="monto()"
                  (input)="monto.set(+$any($event.target).value)"
                />
              </label>
              <div class="sim">
                <div>
                  <small>Acumula</small>
                  <strong>{{ puntosGanados() }} pts</strong>
                </div>
                <div>
                  <small>Canje disponible</small>
                  <strong>{{ descuento() | soles }}</strong>
                </div>
              </div>
              <p class="preview-note">
                Equivale al {{ descuentoPorcentaje() }}% del pedido, con tope del
                {{ puntos().topePorcentaje }}%.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .demo-note {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        padding: 12px 14px;
        border: 1px solid rgba(184, 134, 11, 0.18);
        border-radius: 10px;
        background: var(--gold-soft);
        color: var(--gold-dark);
      }

      .demo-note p {
        margin: 0;
        color: var(--ink-soft);
        font-size: 10.5px;
        line-height: 1.55;
      }

      .settings-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 300px;
        align-items: start;
        gap: 14px;
      }

      .settings-main {
        display: grid;
        gap: 14px;
      }

      .panel-title {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      .panel-title__icon {
        display: grid;
        place-items: center;
        flex: none;
        width: 34px;
        height: 34px;
        border-radius: 9px;
        background: var(--cream-2);
        color: var(--red);
      }

      .panel-title h2 {
        margin: 0;
        font-family: var(--font-display);
        font-size: 16px;
        font-weight: 600;
      }

      .panel-title p {
        margin: 2px 0 0;
        color: var(--muted);
        font-size: 9px;
      }

      .form-grid--3 {
        grid-template-columns: repeat(3, 1fr);
      }

      .input-icon {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-icon app-icon {
        position: absolute;
        left: 11px;
        color: var(--muted);
        pointer-events: none;
      }

      .input-icon .input {
        padding-left: 34px;
      }

      .form-hint {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 8.5px;
        line-height: 1.5;
      }

      .form-hint app-icon {
        flex: none;
        margin-top: 1px;
        color: var(--gold-dark);
      }

      .settings-aside {
        position: sticky;
        top: 84px;
      }

      .preview-card {
        padding: 18px;
        border: 1px solid rgba(10, 10, 11, 0.08);
        border-radius: 14px;
        background: var(--ink);
        color: var(--cream);
      }

      .preview-card__head {
        padding-bottom: 13px;
        border-bottom: 1px solid rgba(255, 248, 238, 0.12);
      }

      .preview-card__head .eyebrow {
        color: var(--gold);
      }

      .preview-card__head h2 {
        margin: 4px 0 0;
        font-family: var(--font-display);
        font-size: 18px;
        font-weight: 600;
      }

      .preview-contact {
        display: grid;
        gap: 8px;
        padding: 13px 0;
        border-bottom: 1px solid rgba(255, 248, 238, 0.1);
      }

      .preview-contact div {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        color: rgba(255, 248, 238, 0.7);
        font-size: 9.5px;
        line-height: 1.45;
      }

      .preview-contact app-icon {
        flex: none;
        margin-top: 1px;
        color: var(--gold);
      }

      .preview-block {
        padding-top: 13px;
      }

      .preview-block + .preview-block {
        margin-top: 13px;
        border-top: 1px solid rgba(255, 248, 238, 0.1);
      }

      .preview-block__title {
        display: block;
        margin-bottom: 8px;
        color: rgba(255, 248, 238, 0.35);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .preview-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 3px 0;
        font-size: 9.5px;
      }

      .preview-line span {
        color: rgba(255, 248, 238, 0.55);
      }

      .preview-line strong {
        color: var(--cream);
        font-weight: 700;
      }

      .preview-card .field-label {
        color: rgba(255, 248, 238, 0.45);
      }

      .preview-card .input {
        border-color: rgba(255, 248, 238, 0.18);
        background: rgba(255, 255, 255, 0.06);
        color: var(--cream);
      }

      .sim {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 9px;
      }

      .sim > div {
        display: grid;
        gap: 2px;
        padding: 9px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.06);
      }

      .sim small {
        color: rgba(255, 248, 238, 0.4);
        font-size: 7.5px;
      }

      .sim strong {
        color: var(--gold);
        font-family: var(--font-display);
        font-size: 16px;
        font-weight: 600;
      }

      .preview-note {
        margin: 8px 0 0;
        color: rgba(255, 248, 238, 0.35);
        font-size: 8px;
        line-height: 1.5;
      }

      @media (max-width: 1080px) {
        .settings-layout {
          grid-template-columns: 1fr;
        }

        .settings-aside {
          position: static;
        }
      }

      @media (max-width: 720px) {
        .form-grid,
        .form-grid--3 {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminSettingsPageComponent {
  readonly config = inject(SiteConfigService);
  private readonly toast = inject(ToastService);

  readonly guardando = signal(false);
  readonly monto = signal(45);

  readonly web = signal<ConfigWeb>({ ...this.config.configWeb() });
  readonly puntos = signal<ConfigPuntos>({ ...this.config.configPuntos() });

  readonly puntosGanados = computed(() =>
    Math.floor(Math.max(0, this.monto()) * this.puntos().puntosPorSol),
  );

  readonly canjeBruto = computed(() =>
    Math.floor(this.puntosGanados() / this.puntos().bloqueCanje) *
    this.puntos().valorBloque,
  );

  readonly descuento = computed(() =>
    Math.min(
      this.canjeBruto(),
      (Math.max(0, this.monto()) * this.puntos().topePorcentaje) / 100,
    ),
  );

  readonly descuentoPorcentaje = computed(() =>
    this.monto() > 0 ? Math.round((this.descuento() / this.monto()) * 100) : 0,
  );

  webTexto(campo: CampoTextoWeb, valor: string): void {
    this.web.update((actual) => ({ ...actual, [campo]: valor }));
  }

  webNumero(campo: CampoNumeroWeb, valor: string): void {
    this.web.update((actual) => ({
      ...actual,
      [campo]: Math.max(0, Number(valor) || 0),
    }));
  }

  puntosNumero(campo: CampoNumeroPuntos, valor: string): void {
    this.puntos.update((actual) => ({
      ...actual,
      [campo]: Math.max(0, Number(valor) || 0),
    }));
  }

  restablecer(): void {
    this.web.set({ ...this.config.configWeb() });
    this.puntos.set({ ...this.config.configPuntos() });
    this.toast.info('Se restauraron los últimos valores guardados.');
  }

  async guardar(): Promise<void> {
    if (this.guardando()) return;
    if (this.web().pedidoMinimo <= 0 || this.puntos().bloqueCanje <= 0) {
      this.toast.error('El pedido mínimo y el bloque de canje deben ser mayores a cero.');
      return;
    }
    this.guardando.set(true);
    try {
      await Promise.all([
        this.config.guardarConfigWeb(this.web()),
        this.config.guardarConfigPuntos(this.puntos()),
      ]);
      this.toast.success('La configuración del sitio se actualizó.', 'Cambios guardados');
    } catch (error) {
      this.toast.error(
        error instanceof Error ? error.message : 'No pudimos guardar la configuración.',
      );
    } finally {
      this.guardando.set(false);
    }
  }
}
