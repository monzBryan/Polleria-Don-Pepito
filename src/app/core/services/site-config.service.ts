import { computed, inject, Injectable, signal } from '@angular/core';
import { ConfigPuntos, ConfigWeb, TipoEntrega } from '../models';
import { DemoStoreService } from './demo-store.service';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SiteConfigService {
  private readonly demo = inject(DemoStoreService);
  private readonly supabase = inject(SupabaseService);

  private readonly remoteWeb = signal<ConfigWeb | null>(null);
  private readonly remotePuntos = signal<ConfigPuntos | null>(null);
  readonly integrationStatus = signal<'demo' | 'connected' | 'pending'>('demo');

  readonly configWeb = computed<ConfigWeb>(
    () => this.remoteWeb() ?? this.demo.configWeb(),
  );
  readonly configPuntos = computed<ConfigPuntos>(
    () => this.remotePuntos() ?? this.demo.configPuntos(),
  );
  readonly isDemo = computed(() => !this.remoteWeb() || environment.useDemoFallback);

  constructor() {
    if (!environment.useDemoFallback) {
      void this.cargarRemoto();
    }
  }

  async cargarRemoto(): Promise<void> {
    try {
      const [web, puntos] = await Promise.all([
        this.supabase.client.from('config_web').select('*').limit(1).maybeSingle(),
        this.supabase.client.from('config_puntos').select('*').limit(1).maybeSingle(),
      ]);
      if (web.error || puntos.error) {
        throw web.error ?? puntos.error;
      }
      if (web.data) {
        const row = web.data as Record<string, unknown>;
        this.remoteWeb.set({
          deliveryFee: Number(row['delivery_fee'] ?? 5),
          freeDeliveryFrom: Number(row['free_delivery_from'] ?? 80),
          pedidoMinimo: Number(row['pedido_minimo'] ?? 25),
          whatsapp: String(row['whatsapp'] ?? environment.contact.whatsapp),
          direccion: String(row['direccion'] ?? environment.contact.address),
          horario: String(row['horario'] ?? environment.contact.hours),
          instagram: String(row['instagram'] ?? environment.contact.instagram),
          facebook: String(row['facebook'] ?? environment.contact.facebook),
          email: String(row['email'] ?? environment.contact.email),
          googleMapsUrl: String(row['google_maps_url'] ?? environment.contact.mapsUrl),
        });
      }
      if (puntos.data) {
        const row = puntos.data as Record<string, unknown>;
        this.remotePuntos.set({
          puntosPorSol: Number(row['puntos_por_sol'] ?? 1),
          bloqueCanje: Number(row['bloque_canje'] ?? 100),
          valorBloque: Number(row['valor_bloque'] ?? 1),
          topePorcentaje: Number(row['tope_porcentaje'] ?? 50),
          vencimientoDias: Number(row['vencimiento_dias'] ?? 365),
        });
      }
      this.integrationStatus.set('connected');
    } catch {
      this.integrationStatus.set('pending');
    }
  }

  deliveryFee(subtotal: number, tipoEntrega: TipoEntrega): number {
    if (tipoEntrega !== 'delivery') return 0;
    const config = this.configWeb();
    return subtotal >= config.freeDeliveryFrom ? 0 : config.deliveryFee;
  }

  whatsappLink(message?: string): string {
    const phone = this.configWeb().whatsapp.replace(/\D/g, '');
    const text = message?.trim()
      ? `?text=${encodeURIComponent(message.trim())}`
      : '';
    return `https://wa.me/${phone}${text}`;
  }

  async guardarConfigWeb(config: ConfigWeb): Promise<void> {
    this.demo.guardarConfigWeb(config);
    if (!environment.useDemoFallback) {
      await this.supabase.client
        .from('config_web')
        .update({
          delivery_fee: config.deliveryFee,
          free_delivery_from: config.freeDeliveryFrom,
          pedido_minimo: config.pedidoMinimo,
          whatsapp: config.whatsapp,
          direccion: config.direccion,
          horario: config.horario,
          instagram: config.instagram,
          facebook: config.facebook,
          email: config.email,
        })
        .eq('id', 1);
    }
  }

  async guardarConfigPuntos(config: ConfigPuntos): Promise<void> {
    this.demo.guardarConfigPuntos(config);
    if (!environment.useDemoFallback) {
      await this.supabase.client
        .from('config_puntos')
        .update({
          puntos_por_sol: config.puntosPorSol,
          bloque_canje: config.bloqueCanje,
          valor_bloque: config.valorBloque,
          tope_porcentaje: config.topePorcentaje,
          vencimiento_dias: config.vencimientoDias,
        })
        .eq('id', 1);
    }
  }
}
