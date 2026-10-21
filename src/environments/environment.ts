import { generatedEnv } from './env.generated';

/**
 * Configuracion de la aplicacion.
 *
 * Las credenciales (Supabase, dominio publico, cuentas demo) NO viven en este
 * archivo: las inyecta tools/generate-env.mjs en build-time desde variables de
 * entorno del proveedor de hosting o desde .env.local. Ver .env.example.
 */
export const environment = {
  production: false,
  supabaseUrl: generatedEnv.supabaseUrl,
  supabaseAnonKey: generatedEnv.supabaseAnonKey,
  useDemoFallback: generatedEnv.useDemoFallback,
  siteUrl: generatedEnv.siteUrl,
  contact: {
    whatsapp: '51956000001',
    whatsappDisplay: '+51 956 000 001',
    phone: '+51 956 000 001',
    email: 'hola@donpepito.pe',
    address: 'Av. Los Maestros 100, Ica, Perú',
    hours: 'Lun a Dom · 12:00 – 23:00',
    instagram: 'https://instagram.com/donpepito',
    facebook: 'https://facebook.com/donpepito',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Av.+Los+Maestros+100,+Ica,+Peru',
    mapsEmbedUrl:
      'https://www.openstreetmap.org/export/embed.html?bbox=-75.7440%2C-14.0735%2C-75.7330%2C-14.0675&layer=mapnik&marker=-14.07065%2C-75.73864',
  },
  demo: generatedEnv.demo,
} as const;
