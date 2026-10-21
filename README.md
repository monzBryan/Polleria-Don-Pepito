# Pollería Don Pepito — Web

SPA Angular 22 de la pollería (carta, carrito, checkout, seguimiento de pedidos,
panel de administración) con datos de demostración y conexión opcional a
Supabase.

## Producción

| Dato | Valor |
|---|---|
| Dominio | https://polleria-don-pepito.vercel.app |
| Hosting | Vercel (servicio estático, preset Angular + Services) |
| Rewrite SPA | `vercel.json` envía todo el tráfico al servicio Angular, que resuelve `index.html` |
| Build | `npm ci && npm run build` → `dist/don-pepito-web/browser` |

Cada despliegue se publica con:

```bash
npx vercel deploy --prod --yes
```

## Credenciales y configuración

Ninguna credencial vive en el repositorio. `tools/generate-env.mjs` genera
`src/environments/env.generated.ts` (ignorado por Git) antes de `build`,
`start` y `test`, leyendo variables de entorno del hosting o `.env.local`:

| Variable | Uso |
|---|---|
| `SITE_URL` | Dominio público (canonical, Open Graph). En Vercel ya está configurada. |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Opcionales. Sin ellas la app compila en modo demo sin claves en el bundle. |
| `USE_DEMO_FALLBACK` | `true` por defecto: datos locales. |
| `DEMO_*` | Cuentas demo del login (`admin@donpepito.pe` / `admin123`, `cliente@demo.pe` / `demo1234`). |

Referencia: [.env.example](.env.example). Nunca uses la `service_role` key en
este frontend.

En Vercel las variables se administran con `vercel env add NOMBRE production`.
Crear el archivo `.env.local` para desarrollo local (no se versiona).

## Base de datos

Los scripts de Supabase están en [supabase/](supabase/) y su documentación en
[supabase/README.md](supabase/README.md). Para pasar de modo demo a datos
reales: configurar `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`USE_DEMO_FALLBACK=false` y volver a desplegar.

## Desarrollo

```bash
npm install        # genera también env.generated.ts
npm start          # http://localhost:4200
npm run build      # dist/don-pepito-web/browser
npm test -- --watch=false
```

## Generar código

```bash
ng generate component component-name
ng generate --help
```

Para más información sobre Angular CLI visita la
[documentación oficial](https://angular.dev/tools/cli).
