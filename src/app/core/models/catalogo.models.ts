export interface CategoriaProducto {
  id: number;
  slug: string;
  nombre: string;
  descripcion: string;
  imagenUrl: string;
  icono: string;
  orden: number;
  activo: boolean;
}

export interface Producto {
  id: number;
  codigo: string;
  categoriaId: number;
  categoriaSlug: string;
  categoriaNombre: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioAnterior?: number;
  porcentajeDescuento?: number;
  imagenUrl: string;
  activo: boolean;
  destacado: boolean;
  esNuevo: boolean;
  nivelPicante: number;
  tiempoPreparacion: number;
  ventas: number;
  etiquetas: string[];
}

export interface ConfigWeb {
  deliveryFee: number;
  freeDeliveryFrom: number;
  pedidoMinimo: number;
  whatsapp: string;
  direccion: string;
  horario: string;
  instagram: string;
  facebook: string;
  email: string;
  googleMapsUrl: string;
}

export interface ConfigPuntos {
  puntosPorSol: number;
  bloqueCanje: number;
  valorBloque: number;
  topePorcentaje: number;
  vencimientoDias: number;
}

export interface FiltroCatalogo {
  categoria: string;
  busqueda: string;
  orden: 'recomendado' | 'precio-asc' | 'precio-desc' | 'nuevo';
}
