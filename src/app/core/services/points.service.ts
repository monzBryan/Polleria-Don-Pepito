import { computed, inject, Injectable } from '@angular/core';
import {
  descuentoPorPuntos,
  equivalenciaSoles,
  maxPuntosCanjeables,
  normalizarPuntos,
  puntosGanados,
} from '../utils/points';
import { SiteConfigService } from './site-config.service';

@Injectable({ providedIn: 'root' })
export class PointsService {
  private readonly site = inject(SiteConfigService);

  readonly config = computed(() => this.site.configPuntos());

  maxPuntos(subtotal: number, saldo: number): number {
    return maxPuntosCanjeables(subtotal, saldo, this.config());
  }

  normalizar(puntos: number): number {
    return normalizarPuntos(puntos, this.config());
  }

  descuento(puntos: number): number {
    return descuentoPorPuntos(puntos, this.config());
  }

  ganados(subtotal: number, descuento: number): number {
    return puntosGanados(subtotal, descuento, this.config());
  }

  equivalencia(puntos: number): number {
    return equivalenciaSoles(puntos, this.config());
  }
}
