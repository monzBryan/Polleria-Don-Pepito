import { ConfigPuntos } from '../models';

export const CONFIG_PUNTOS_DEFAULT: ConfigPuntos = {
  puntosPorSol: 1,
  bloqueCanje: 100,
  valorBloque: 1,
  topePorcentaje: 50,
  vencimientoDias: 365,
};

export function normalizarPuntos(puntos: number, config: ConfigPuntos): number {
  const bloque = Math.max(1, config.bloqueCanje);
  const value = Math.max(0, Math.floor(puntos || 0));
  return Math.floor(value / bloque) * bloque;
}

export function maxPuntosCanjeables(
  subtotal: number,
  saldo: number,
  config: ConfigPuntos,
): number {
  const bloque = Math.max(1, config.bloqueCanje);
  const topeSoles = Math.max(0, subtotal) * (Math.max(0, config.topePorcentaje) / 100);
  const maxPorTope = Math.floor(topeSoles / Math.max(0.01, config.valorBloque)) * bloque;
  const maxPorSaldo = normalizarPuntos(saldo, config);
  return Math.max(0, Math.min(maxPorTope, maxPorSaldo));
}

export function descuentoPorPuntos(puntos: number, config: ConfigPuntos): number {
  const bloque = Math.max(1, config.bloqueCanje);
  const bloques = Math.floor(Math.max(0, puntos) / bloque);
  return Number((bloques * Math.max(0, config.valorBloque)).toFixed(2));
}

export function puntosGanados(
  subtotal: number,
  descuento: number,
  config: ConfigPuntos,
): number {
  const base = Math.max(0, subtotal - descuento);
  return Math.floor(base * Math.max(0, config.puntosPorSol));
}

export function equivalenciaSoles(puntos: number, config: ConfigPuntos): number {
  return descuentoPorPuntos(puntos, config);
}
