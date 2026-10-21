# Pollería Don Pepito — Especificación de diseño

**Fecha:** 2026-10-20  
**Proyecto:** Web premium de pedidos, puntos y administración para Pollería Don Pepito (Ica, Perú).  
**Stack:** Angular 22 standalone + Signals + SCSS + Supabase (Auth, Postgres, RLS, RPC) + Chart.js + Lucide.  
**Estado:** Diseño aprobado. El SQL y la base de datos son responsabilidad de otro agente; este documento define el contrato que consume el frontend. Este proyecto no crea ni modifica archivos SQL.

---

## 1. Objetivo

Construir una web pública y un panel administrativo para una pollería de Ica, con:

- Catálogo de productos y combos con diseño premium.
- Carrito persistente y checkout con delivery o recojo.
- Registro/login con Supabase Auth, incluyendo registro inline al comprar.
- Programa de puntos (dinero virtual) con canje y acreditación automática.
- Seguimiento de pedidos.
- Panel admin con CRUD de productos/categorías, gestión de pedidos, clientes, puntos, mesas, reservas, usuarios y estadísticas.
- Base de datos existente + contrato web definido en este spec, implementado por el agente de SQL.
- Capa de datos tipada con fallback demo local para que el frontend sea navegable mientras el contrato no esté desplegado.

**Este proyecto no crea ni modifica archivos SQL ni ejecuta DDL/DML en Supabase.** Otro agente gestiona la base de datos; aquí solo se consume el contrato desde Angular.

---

## 2. Alcance

### Incluido

- Sitio público responsive (360–1440 px) con identidad visual premium.
- Marquees infinitos sin espacios en blanco.
- Catálogo con búsqueda, filtros, orden y vista rápida.
- Carrito con persistencia en `localStorage`.
- Checkout con validación de precios/stock en servidor.
- Auth con Supabase (email/password), perfiles y roles.
- Puntos: 1 sol = 1 punto; 100 puntos = S/ 1; tope 50 % del subtotal.
- Cuenta de cliente: perfil, saldo de puntos, historial, pedidos.
- Seguimiento de pedidos por código para el cliente autenticado.
- Reservas de mesa.
- Panel admin con dashboard y reportes.
- CRUD de productos, categorías, mesas, pedidos, clientes, puntos, reservas y usuarios.
- RLS para datos sensibles.
- Tests unitarios de lógica crítica y build de producción.
- README con pasos de instalación, variables de entorno y contrato de datos (sin SQL).

### Excluido

- Cobro real con pasarela (Mercado Pago, Culqi, Niubiz). El pago es simulado.
- Facturación electrónica SUNAT real.
- Envío de correos transaccionales propios (se usa el flujo de Supabase Auth).
- App móvil nativa.
- Optimización de rutas de delivery.
- Multi-sucursal o multi-tenant.
- Edición de contenido legal por admin.

---

## 3. Usuarios y roles

| Rol | Acceso |
|---|---|
| Visitante | Inicio, carta, promociones, nosotros, contacto, reservas, login/registro. Puede armar carrito; para confirmar pedido debe autenticarse. |
| Cliente | Todo lo anterior + checkout, cuenta, puntos, historial, seguimiento de sus pedidos, reservas. |
| Admin | Todo lo del cliente + `/admin` completo, CRUD, pedidos de todos los clientes, estadísticas y configuración de puntos. |

El rol vive en `public.perfiles.rol` (`cliente` / `admin`) y se valida con `fn_es_admin()`. El primer admin lo promueve el agente de SQL o el usuario directamente en Supabase; este proyecto no incluye ni ejecuta ese SQL.

---

## 4. Identidad visual

La experiencia de pedido toma como referencia la claridad de Rokys/Norkys, sin copiar su identidad, textos ni estructura. Don Pepito tendrá una dirección visual propia, más cálida y premium.

### 4.1 Paleta (contraste AA)

```scss
--ink:        #0A0A0B;
--ink-2:      #141416;
--ink-3:      #1D1D21;
--red:        #C8102E;
--red-dark:   #8B0A1F;
--red-bright: #E11D2E;
--gold:       #E8B54D;
--gold-soft:  #F3D28A;
--cream:      #FFF8EE;
--white:      #FFFFFF;
--muted:      #A8A29A;
--line:       rgba(232, 181, 77, 0.18);
```

- Texto sobre rojo: blanco. Texto sobre dorado: `--ink`. Texto sobre crema: `--ink`.
- Dorado solo como acento, bordes, iconos y texto sobre fondos oscuros.
- Estados: éxito `#2FBF71`, error `#FF5A6B`, advertencia `#F4B740`, info `#5AA9E6`.

### 4.2 Tipografía

- Títulos: **Fraunces** 600/700 (serif premium, con carácter artesanal).
- UI y cuerpo: **Manrope** 400/500/600/700.
- Carga con Google Fonts (`preconnect`) y fallback a `Georgia` / `system-ui`.

### 4.3 Componentes visuales

- Cards con radio 20–28 px, borde dorado sutil, sombra profunda y hover con elevación.
- Botón primario rojo con brillo y microanimación; secundario outline dorado.
- Fondo oscuro con grano sutil y gradientes radiales rojo/dorado.
- Líneas finas doradas como separadores.
- Imágenes 4:3 con zoom suave al hover y fallback local.
- Iconos **Lucide** (repositorio GitHub `lucide-icons/lucide`) en SVG. Sin emojis.

### 4.4 Logo

- Archivo original: `logo-don-pepito.png` (rojo sobre blanco).
- Se generarán:
  - `logo-don-pepito-transparent.png`: fondo transparente, recortado.
  - `logo-don-pepito-gold.png`: versión dorada para fondos oscuros.
  - Favicon y apple-touch-icon.
- En header sobre fondo oscuro se usará la versión dorada; sobre crema, la roja.

### 4.5 Marquees sin huecos

Componente reutilizable `app-marquee`:

- Dos grupos idénticos en una pista `width: max-content`.
- Animación `translate3d(-50%, 0, 0)` lineal e infinita.
- Cada grupo usa `flex-shrink: 0` y `padding-right` igual al `gap` para que el empalme sea exacto.
- Pausa al hover/focus.
- `prefers-reduced-motion`: animación desactivada y scroll horizontal accesible.
- Se usarán en: barra de anuncios superior, banda de marca bajo el hero y separadores de secciones.

---

## 5. Arquitectura Angular

### 5.1 Base técnica

- Angular 22.2.3, componentes standalone.
- `provideZonelessChangeDetection()` + Signals.
- SCSS modular con tokens.
- Router con lazy loading por feature y `withViewTransitions`.
- Reactive Forms para formularios.
- Sin Angular Material ni Tailwind: sistema visual propio.
- Sin SSR (SPA). SEO básico con `Title`, `Meta`, JSON-LD y `sitemap.xml`.

### 5.2 Dependencias

- `@supabase/supabase-js`
- `lucide-angular`
- `chart.js`
- Dependencias propias de Angular (router, forms, common).

### 5.3 Estructura

```text
src/
  app/
    core/
      supabase/supabase.service.ts
      auth/auth.service.ts
      auth/auth.guard.ts
      auth/admin.guard.ts
      cart/cart.service.ts
      points/points.service.ts
      data/products.service.ts
      data/categories.service.ts
      data/orders.service.ts
      data/reservations.service.ts
      data/admin.service.ts
      data/stats.service.ts
      data/site-config.service.ts
      ui/toast.service.ts
      ui/confirm.service.ts
      models/*.ts
      utils/errors.ts
      utils/format.ts
    shared/
      components/header/
      components/footer/
      components/marquee/
      components/product-card/
      components/quick-view/
      components/cart-drawer/
      components/auth-panel/
      components/icon/
      components/toast-host/
      components/confirm-dialog/
      components/skeleton/
      components/empty-state/
      components/stat-card/
      components/chart/
      components/section-heading/
      directives/reveal-on-scroll.directive.ts
      directives/img-fallback.directive.ts
      pipes/order-status.pipe.ts
      pipes/points.pipe.ts
    features/
      home/
      menu/
      promotions/
      about/
      contact/
      reservations/
      checkout/
      auth/
      account/
      order-tracking/
      legal/
      admin/
        admin.routes.ts
        layout/
        dashboard/
        products/
        categories/
        orders/
        customers/
        points/
        tables/
        reservations/
        users/
        reports/
        settings/
    app.routes.ts
    app.config.ts
    app.component.ts
  environments/
    environment.ts
  styles/
    _tokens.scss
    _mixins.scss
    _base.scss
    _components.scss
    _animations.scss
    styles.scss
  assets/
    brand/
    img/
```

### 5.4 Estado y servicios

- `SupabaseService`: cliente singleton, helpers de error y sesión.
- `AuthService`:
  - Signals: `session`, `profile`, `loading`, `isAuthenticated`, `isAdmin`.
  - Métodos: `init`, `signIn`, `signUp`, `signOut`, `refreshProfile`, `updateProfile`.
  - Escucha `onAuthStateChange`.
- `CartService`:
  - Signal `items`, computeds `count`, `subtotal`, `deliveryFee`, `total`.
  - Persistencia `don-pepito-cart-v1`.
  - Métodos `add`, `increment`, `decrement`, `remove`, `setNote`, `clear`.
- `PointsService`:
  - Carga `config_puntos`.
  - Calcula canje máximo, descuento y puntos a ganar.
- `SiteConfigService`: carga `config_web` (delivery, umbral gratis, WhatsApp, horario, dirección).
- Servicios de datos: consultas tipadas a Supabase y llamadas RPC, con fallback demo si el contrato aún no está desplegado.
- `ToastService` y `ConfirmService` para feedback y confirmaciones.

### 5.5 Modelos

Los modelos TypeScript reflejan los nombres reales de Postgres en `snake_case` (Supabase los devuelve así). Los precios se manejan en soles con dos decimales. El teléfono se normaliza a 9 dígitos. Se usan interfaces para:

- `Producto`, `CategoriaProducto`, `ConfigPuntos`, `ConfigWeb`.
- `Pedido`, `DetallePedido`, `PedidoDelivery`, `MetodoPago`.
- `Perfil`, `Cliente`, `TransaccionPuntos`.
- `Reserva`, `Mesa`, `Ambiente`, `EstadoMesa`.
- `DashboardData`, `TopProducto`, `VentaDia`, `MetodoPagoStat`.

---

## 6. Rutas y páginas

### 6.1 Públicas

| Ruta | Página | Contenido |
|---|---|---|
| `/` | Inicio | Hero, marquees, destacados, historia, puntos, combos, testimonios, ubicación. |
| `/carta` | Carta | Buscador, filtros por categoría, orden, grid, quick view, agregar al carrito. |
| `/promociones` | Promociones | Combos y ofertas con badges y CTA. |
| `/nosotros` | Nosotros | Historia, valores, proceso de leña, galería. |
| `/contacto` | Contacto | Datos demo, mapa, horario, zonas de delivery, WhatsApp. |
| `/reservas` | Reservas | Formulario de reserva (fecha, hora, personas, ambiente, notas). |
| `/checkout` | Checkout | Pasos de entrega, auth inline, pago, puntos y resumen. |
| `/auth` | Auth | Login/registro; acepta `?redirect=`. |
| `/cuenta` | Cuenta | Perfil, puntos, historial, pedidos. |
| `/pedido/:codigo` | Seguimiento | Timeline, detalle, puntos ganados, soporte. |
| `/terminos` | Términos | Contenido legal demo. |
| `/privacidad` | Privacidad | Contenido legal demo. |
| `/libro-de-reclamaciones` | Reclamaciones | Enlace oficial INDECOPI y datos de contacto. |

### 6.2 Admin (protegidas por `adminGuard`)

| Ruta | Página |
|---|---|
| `/admin` | Dashboard con KPIs y gráficos. |
| `/admin/productos` | CRUD de productos. |
| `/admin/categorias` | CRUD de categorías. |
| `/admin/pedidos` | Lista, filtros, detalle, estados, cancelación. |
| `/admin/clientes` | Clientes, puntos y ajustes. |
| `/admin/puntos` | Configuración y ledger de puntos. |
| `/admin/mesas` | CRUD de mesas y estados. |
| `/admin/reservas` | Gestión de reservas. |
| `/admin/usuarios` | Perfiles y roles. |
| `/admin/reportes` | Reportes por rango + CSV. |
| `/admin/configuracion` | Configuración web (delivery, contacto) y puntos. |

---

## 7. Experiencia pública

### 7.1 Inicio

1. Barra de anuncios con marquee: delivery, horario, puntos.
2. Header sticky: logo, navegación, cuenta, carrito con contador, CTA.
3. Hero oscuro:
   - Eyebrow “Pollería Don Pepito · Ica”.
   - Título “El sabor que reúne a Ica”.
   - Subtítulo sobre pollo al carbón y leña.
   - CTAs “Pedir ahora” y “Ver la carta”.
   - Badges de confianza: tradición, leña, delivery, rating.
   - Imagen principal + tarjetas flotantes (precio desde, puntos).
4. Marquee de marca.
5. Destacados: tabs (Más vendidos, Combos, Parrillas) con 4–6 productos.
6. Historia “Nuestro secreto” con imagen y estadísticas.
7. Programa de puntos con ejemplo de canje y CTA a registro.
8. Combo banner destacado.
9. Testimonios.
10. Ubicación, horario, zonas de delivery y WhatsApp.
11. Footer con logo, links, redes (Lucide), métodos de pago y libro de reclamaciones.

### 7.2 Carta

- Header compacto.
- Barra sticky de categorías con scroll horizontal.
- Buscador con debounce y botón limpiar.
- Selector de orden: recomendados, precio menor/mayor, nombre.
- Chips de filtros: destacados, picante, nuevos.
- Grid responsive de `ProductCard`:
  - Imagen, badges, nombre, descripción corta, precio, botón agregar.
  - Click abre quick view.
- Quick view: imagen, detalle, notas, cantidad, precio, agregar.
- Estado vacío con icono Lucide y CTA para limpiar filtros.
- Al agregar: toast + apertura del carrito (configurable).

### 7.3 Carrito

- Drawer lateral con overlay.
- Ítems con imagen, nombre, precio, stepper, nota y eliminar.
- Subtotal, delivery estimado, puntos a ganar.
- CTA “Ir a pagar”.
- Persistencia al recargar.
- Accesible: focus trap, Escape, `aria-modal`.

### 7.4 Checkout

Pasos:

1. **Entrega**
   - Delivery o recojo en tienda.
   - Delivery: distrito (Ica, La Tinguiña, Parcona, Subtanjalla, San Juan Bautista), dirección, referencia, teléfono.
   - Recojo: muestra dirección y horario.
   - Costo de delivery desde `config_web`; gratis desde el umbral configurado.
2. **Identificación**
   - Si no hay sesión: panel inline con tabs Login / Crear cuenta.
   - Registro: nombre, apellido, email, teléfono, DNI opcional, password.
   - Si Supabase exige confirmación de correo, mensaje claro y opción de iniciar sesión.
   - Si hay sesión: muestra nombre, email y puntos disponibles.
3. **Pago**
   - Efectivo, Yape, Plin, Tarjeta (simulados).
   - Yape/Plin: campo opcional de número de operación.
   - Tarjeta: aviso “Pago simulado, no se cobra”.
4. **Puntos**
   - Muestra saldo.
   - Input/stepper en bloques de 100.
   - Descuento calculado y tope del 50 %.
   - Puntos a ganar sobre el subtotal después del descuento (sin delivery).
5. **Resumen**
   - Ítems, subtotal, descuento, delivery, total.
   - Botón “Confirmar pedido”.
   - Al confirmar: RPC atómica, limpiar carrito y navegar a `/pedido/:codigo`.

Reglas:

- Cuenta obligatoria para confirmar (permite acumular puntos).
- El servidor valida productos, precios, stock, puntos, tope y método de pago.
- Errores se muestran en un resumen y toasts.

### 7.5 Cuenta

- Tarjeta de perfil con nombre, email, teléfono y rol.
- Tarjeta de puntos: saldo, equivalencia en soles, progreso al siguiente bloque, nivel (Criollo / Maestro / Leyenda).
- Historial de puntos con tipo, puntos, monto, saldo y fecha.
- Historial de pedidos con estado, total, fecha y link a seguimiento.
- Edición de perfil (nombre, teléfono, dirección).
- Logout.

### 7.6 Seguimiento

- Requiere sesión. Solo el dueño del pedido o un admin puede verlo; el código por sí solo no otorga acceso.
- Busca por `codigo_seguimiento`.
- Timeline: Confirmado → En preparación → En camino / Listo → Entregado.
- Detalle de productos, dirección, método de pago, total y puntos.
- Realtime con Supabase (`postgres_changes` sobre `pedido`), con fallback a refresco manual.
- Si el pedido no existe o no pertenece al usuario, estado “no encontrado”.

### 7.7 Reservas

- Fecha, hora, personas, ambiente (Salón, Terraza, VIP), notas.
- Requiere sesión; si no, CTA a auth con redirect.
- RPC `sp_web_crear_reserva`.
- Confirmación con código de reserva.

---

## 8. Panel administrativo

### 8.1 Layout

- Sidebar oscuro con logo, navegación agrupada e iconos Lucide.
- Topbar con búsqueda, fecha, notificaciones y menú de usuario.
- Responsive: sidebar colapsable/drawer en móvil.
- Breadcrumbs y títulos de página.

### 8.2 Dashboard

KPIs:

- Ventas del periodo.
- Pedidos.
- Ticket promedio.
- Clientes nuevos.
- Puntos emitidos.

Gráficos (Chart.js):

- Línea: ventas por día (14 días).
- Doughnut: métodos de pago.
- Barras horizontales: top 5 productos.
- Donut o barras: estados de pedidos.

Extras:

- Últimos pedidos con estado y total.
- Alerta de stock bajo.
- Accesos rápidos a productos y pedidos.

### 8.3 Productos

- Tabla con imagen, nombre, categoría, precio, stock, disponible, destacado y acciones.
- Filtros: búsqueda, categoría, disponibilidad, destacado.
- Modal de creación/edición:
  - Nombre, código, categoría, unidad, detalle, precio, precio anterior, costo.
  - Imagen URL + preview + fallback.
  - Stock, controla stock, stock mínimo.
  - Disponible, destacado, nuevo, nivel de picante, porcentaje de descuento.
  - Tipo de producto, afecto IGV, tiempo de preparación.
- Borrado lógico (`ESTADO = 'E'`) con confirmación.
- Toggle rápido de disponibilidad/destacado.

### 8.4 Categorías

- CRUD con nombre, descripción, área de despacho, orden de carta, imagen.
- Borrado lógico y validación de productos asociados.

### 8.5 Pedidos

- Tabla paginada con número, cliente, fecha, total, método, estado.
- Filtros por estado, fecha, canal y búsqueda por código.
- Drawer de detalle: cliente, items, notas, delivery, pago, puntos.
- Cambio de estado:
  - Confirmado → En preparación → En camino/Listo → Entregado.
  - Cancelar con motivo.
- RPC `sp_web_actualizar_estado_pedido` para mantener consistencia y reversión de puntos.

### 8.6 Clientes

- Tabla con nombre, documento, email, teléfono, puntos, pedidos, total gastado.
- Búsqueda.
- Detalle con historial de pedidos y movimientos de puntos.
- Ajuste manual de puntos (motivo obligatorio) vía RPC.

### 8.7 Puntos

- Configuración: puntos por sol, bloque de canje, valor del bloque, tope %, vencimiento.
- Ledger global con filtros por cliente/tipo/fecha.
- Top clientes por saldo.

### 8.8 Mesas

- Grid de mesas por ambiente con color de estado.
- CRUD: número, ambiente, tipo, capacidad, detalle, estado.
- Estados: Libre, Ocupada, Reservada, Por cobrar, Fuera de servicio.

### 8.9 Reservas

- Tabla con cliente, fecha, personas, ambiente, estado.
- Cambio de estado: Pendiente, Confirmada, Cancelada, Atendida.
- Asignación de mesa.

### 8.10 Usuarios

- Perfiles con nombre, email, rol, fecha de registro.
- Cambio de rol cliente/admin.
- No permitir que el admin se quite a sí mismo el rol (para evitar bloqueo).
- Búsqueda.

### 8.11 Reportes

- Rango de fechas.
- Ventas por día, por categoría, por método de pago.
- Top productos.
- Totales y ticket promedio.
- Exportación CSV generada en cliente.

### 8.12 Configuración

- `config_web`: costo de delivery, umbral de delivery gratis, pedido mínimo, WhatsApp, dirección, horario, redes.
- `config_puntos`: mismos campos que 8.7.
- Guardado con validación y toast.

---

## 9. Contrato de datos (gestionado por el agente de SQL)

> **Importante:** esta sección es informativa. El frontend no crea, modifica ni ejecuta SQL. El agente de base de datos implementa este contrato; si cambia nombres, solo se ajusta la capa `core/data` y los modelos TypeScript.

### 9.0 Contrato esperado por el frontend

Tablas leídas/escritas por la app:

- Catálogo: `producto`, `categoria_producto`, `unidad_medida`.
- Configuración: `config_web`, `config_puntos`.
- Identidad: `perfiles`, `cliente`, `persona`.
- Pedidos: `pedido`, `detalle_pedido`, `pedido_delivery`, `estado_pedido`, `tipo_pedido`.
- Puntos: `transaccion_puntos`.
- Salón: `reserva`, `mesa`, `ambiente`, `estado_mesa`, `tipo_mesa`.
- Pagos: `metodo_pago`.

RPCs esperadas:

- `sp_web_crear_pedido`
- `sp_web_crear_reserva`
- `sp_web_actualizar_perfil`
- `sp_web_actualizar_estado_pedido`
- `sp_admin_ajustar_puntos`
- `sp_admin_cambiar_rol`
- `sp_admin_dashboard`
- `fn_es_admin`
- `fn_cliente_actual`

Reglas de integración:

- Toda consulta pasa por servicios en `core/data/*`; ningún componente habla con Supabase directamente.
- Si una tabla/RPC no existe todavía, el servicio devuelve datos demo locales y marca `integrationStatus = 'pending'` para mostrar un aviso discreto.
- El fallback demo se activa con `environment.useDemoFallback` y nunca se usa en producción.
- El carrito y los formularios funcionan sin conexión; el checkout real requiere Supabase disponible.

### 9.1 Base existente

Se reutilizan las tablas de `supabase/01_modelo_restaurante_postgres.sql`:

- Catálogo: `categoria_producto`, `producto`, `unidad_medida`.
- Clientes: `persona`, `cliente`, `empresa`, `tipo_identidad`.
- Salón: `ambiente`, `mesa`, `estado_mesa`, `tipo_mesa`.
- Pedidos: `pedido`, `detalle_pedido`, `pedido_delivery`, `reserva`, `tipo_pedido`, `estado_pedido`.
- Pagos: `metodo_pago`, `venta`, `detalle_venta`, `pago_venta`, `caja`, `apertura_caja`.
- Puntos: `config_puntos`, `transaccion_puntos` (de `02_puntos_supabase_postgres.sql`).
- Auditoría: `auditoria`.

### 9.2 Cambios web esperados (los implementa el agente de SQL)

Cambios:

1. **Identidad web**
   - Insertar `TIPO_IDENTIDAD` `WEB` (si no existe).
   - Crear `perfiles`:
     - `id uuid PK references auth.users(id) on delete cascade`
     - `id_cliente int unique references cliente(id_cliente)`
     - `rol varchar(20) check ('cliente','admin') default 'cliente'`
     - `nombre`, `telefono`, `email`, `creado_en`, `actualizado_en`.
2. **Trigger de alta**
   - `on_auth_user_created` sobre `auth.users`.
   - Crea `PERSONA` (DNI si se envía; si no, documento `W` + fragmento de UUID con tipo `WEB`).
   - Crea `CLIENTE` con `uuid_auth = new.id`.
   - Crea `perfiles`.
   - Si el DNI está duplicado, cae a documento `WEB` para no romper el signup.
   - Trigger de actualización para sincronizar email.
3. **Usuario sistema web**
   - `TIPO_USUARIO` `WEB`, `CARGO` `SISTEMA WEB`, `CONTRATO` `SISTEMA`.
   - `PERSONA`/`EMPLEADO`/`USUARIO` de sistema (`logeo = 'web-sistema'`).
   - Se usa como `ID_Usuario` en pedidos y reservas web.
4. **Columnas nuevas**
   - Ampliar `persona.email` a `varchar(120)` para correos modernos.
   - `categoria_producto`: `imagen varchar(300)`, `icono varchar(50)`.
   - `producto`: `precio_anterior numeric(8,2)`, `destacado char(1) default 'N'`, `es_nuevo char(1) default 'N'`, `nivel_picante int default 0`, `porcentaje_descuento numeric(5,2) default 0`.
     - `precio` es el precio vigente que se cobra. `precio_anterior` y `porcentaje_descuento` son solo referencia visual de oferta; el checkout siempre usa `precio`.
   - `pedido`: `canal varchar(10) default 'POS'`, `codigo_seguimiento varchar(20) unique`, `costo_envio numeric(10,2) default 0`, `id_metodopago int references metodo_pago`, `puntos_usados int default 0`, `puntos_ganados int default 0`, `f_entrega_estimada timestamptz`.
5. **Estados de pedido web**
   - Insertar `CONFIRMADO`, `EN CAMINO`, `LISTO`, `ENTREGADO` con orden y color.
6. **Configuración web**
   - Tabla `config_web` con una sola fila (`id int primary key default 1 check (id = 1)`):
     - `delivery_fee`, `free_delivery_from`, `pedido_minimo`, `whatsapp`, `direccion`, `horario`, `instagram`, `facebook`, `actualizado_en`.
   - Seed de valores demo de Ica.
7. **Secuencia**
   - `seq_pedido_web` para numeración `WEB-YYMMDD-0001`.
8. **RPCs**
   - `sp_web_crear_pedido(...)` — atómica.
   - `sp_web_crear_reserva(...)`.
   - `sp_web_actualizar_perfil(p_nombre, p_telefono)` — solo campos permitidos del usuario autenticado.
   - `sp_web_actualizar_estado_pedido(...)` — solo admin.
   - `sp_admin_ajustar_puntos(...)` — solo admin.
   - `sp_admin_cambiar_rol(p_id, p_rol)` — solo admin; rechaza quitarse el rol admin a sí mismo.
   - `sp_admin_dashboard(p_desde, p_hasta)` — solo admin, retorna JSON.
   - `fn_es_admin()` y `fn_cliente_actual()`.
9. **RLS**
   - Activar RLS en **todas** las tablas de `public`, incluidas las del modelo POS.
   - Catálogo activo, `config_web` y `config_puntos` activos: lectura pública.
   - `perfiles`: lectura propia; admin lectura total. **Sin política de update directo**: el nombre/teléfono se cambia con `sp_web_actualizar_perfil` y el rol solo con `sp_admin_cambiar_rol`. Esto evita que un cliente se autoasigne `admin`.
   - `pedido`, `detalle_pedido`, `pedido_delivery`, `transaccion_puntos`, `reserva`, `cliente`, `persona`: lectura propia; admin lectura total.
   - Escrituras de cliente solo por RPC `SECURITY DEFINER`.
   - Administración de catálogo, mesas, reservas y configuración: políticas admin.
   - Tablas sensibles no usadas por la web (`usuario`, `empleado`, `auditoria`, `venta`, `detalle_venta`, `pago_venta`, `caja`, `apertura_caja`, `movimiento_caja`, etc.): RLS activo y sin políticas para `anon`/`authenticated` (denegado por defecto). Solo admin puede leer `auditoria` si se necesita.
   - Revocar `EXECUTE` de las funciones POS heredadas (`sp_login`, `sp_abrir_pedido`, `sp_agregar_detalle_pedido`, `sp_facturar_pedido`, `sp_anular_pedido`, `sp_aperturar_caja`, `sp_registrar_movimiento_caja`, `sp_cerrar_caja`, `sp_acreditar_puntos`, `sp_canjear_puntos`) a `anon` y `authenticated`; quedan disponibles solo para `service_role`/SQL Editor.
   - `sp_web_*` se otorgan solo a `authenticated`; `fn_es_admin` y `fn_cliente_actual` se otorgan a `authenticated` para las políticas.
10. **Índices**
    - `pedido(codigo_seguimiento)`, `pedido(canal, f_pedido)`, `pedido(id_cliente, f_pedido)`, `transaccion_puntos(id_cliente, feccre)`, `producto(destacado)`, `perfiles(rol)`.

### 9.3 Datos semilla esperados (los implementa el agente de SQL)

Categorías:

- Pollos a la brasa
- Combos
- Parrillas
- Criollos
- Entradas
- Bebidas
- Postres
- Salsas y extras

Productos (mínimo 24):

- Pollo entero, 1/2 pollo, 1/4 pollo.
- Combo familiar, combo dúo, combo personal.
- Parrilla mixta, anticuchos, chicharrón de calamar.
- Lomo saltado, arroz chaufa, ají de gallina, seco de res, cebiche.
- Papa a la huancaína, causa limeña.
- Chicha morada vaso/jarra, Inca Kola, pisco sour, cerveza.
- Suspiro limeño, arroz con leche.
- Salsas extra: ají, mayonesa, huancaína.

Cada producto incluye: código, categoría, unidad, precio, costo, detalle, imagen remota, destacado, nuevo, picante, tiempo de preparación, stock cuando aplica.

También se insertan:

- `tipo_identidad`: `DNI`, `RUC`, `CE`, `PAS`, `WEB`.
- `unidad_medida`: `UNIDAD`, `PORCION`, `JARRA`, `VASO`, `KILOGRAMO`, `LITRO`, `BOTELLA`.
- `tipo_pedido`: `EN SALON`, `PARA LLEVAR`, `DELIVERY`.
- `estado_pedido`: estados base y web.
- Métodos de pago (`EFECTIVO`, `YAPE`, `PLIN`, `TARJETA`).
- Ambientes, tipos de mesa, estados de mesa y mesas demo.
- `config_puntos` y `config_web` si no existen.

### 9.4 Promoción de admin (la ejecuta el agente de SQL / usuario)

El frontend solo verifica `perfiles.rol = 'admin'`. Para el primer admin, el agente de SQL o el usuario debe ejecutar la promoción correspondiente en Supabase. Este proyecto no incluye ni ejecuta ese SQL.

Requisitos para la demo:

1. El contrato de datos debe estar desplegado por el agente de SQL.
2. Registrar el usuario admin desde la web o Supabase Auth.
3. Promover el perfil a `admin` en Supabase.
4. Opcional demo: desactivar “Confirm email” en Supabase Auth.

### 9.5 RPC de pedido

`sp_web_crear_pedido` recibe:

```json
{
  "p_items": [{"id_producto": 1, "cantidad": 1, "nota": "sin ají"}],
  "p_tipo_entrega": "delivery",
  "p_direccion": "Av. Los Maestros 100",
  "p_referencia": "Frente al parque",
  "p_telefono": "956000001",
  "p_metodo_pago": "yape",
  "p_notas": "Tocar el timbre",
  "p_puntos_usados": 200,
  "p_distrito_id": 1
}
```

Validaciones:

- Sesión activa y perfil con cliente.
- Productos activos, disponibles y con stock suficiente.
- Cantidades positivas.
- Subtotal mayor o igual a `config_web.pedido_minimo`.
- Puntos múltiplo del bloque, saldo suficiente y tope del 50 %.
- Método de pago existente.
- Delivery con dirección, distrito y teléfono de 9 dígitos.

Cálculos:

- Subtotal = suma de precio × cantidad.
- Delivery = `config_web.delivery_fee` si aplica; gratis desde `free_delivery_from`.
- Descuento = bloques de puntos × valor.
- Total = subtotal − descuento + delivery.
- IGV incluido: `subtotal_neto = total / 1.18`, `igv = total − subtotal_neto`.
- Puntos ganados = `floor((subtotal − descuento) × puntos_por_sol)`.

Efectos:

- Inserta `PEDIDO`, `DETALLE_PEDIDO`, `PEDIDO_DELIVERY`.
- Descuenta stock y registra `MOVIMIENTO_INVENTARIO` si controla stock.
- Descuenta puntos usados y acredita ganados en `CLIENTE` + `TRANSACCION_PUNTOS`.
- Retorna `id_pedido`, `numero_pedido`, `codigo_seguimiento`, `total`, `puntos_ganados`.

### 9.6 Reversión y estados

- Cancelar un pedido:
  - Revierte puntos ganados y devuelve puntos usados.
  - Registra movimientos `AJUSTE` en `TRANSACCION_PUNTOS`.
  - Marca `ANULADO` y actualiza delivery a cancelado.
- Entregado:
  - Actualiza `PEDIDO_DELIVERY.situacion = 'E'`.
- Cambios de estado solo por admin.

---

## 10. Seguridad

- La `anon key` es pública; la seguridad depende de RLS y RPCs `SECURITY DEFINER` con validación de rol.
- Nunca se usa `service_role` en el frontend.
- Validación de precios, stock y puntos en servidor.
- RLS activo en **todas** las tablas de `public`; las tablas sin política quedan denegadas para `anon`/`authenticated`.
- `perfiles` no permite update directo del rol. El rol solo cambia con `sp_admin_cambiar_rol`; nombre/teléfono solo con `sp_web_actualizar_perfil`.
- Funciones admin verifican `fn_es_admin()`.
- Se revoca `EXECUTE` de las funciones POS heredadas a `anon`/`authenticated` para que no puedan invocarse por RPC.
- Formularios con validación cliente + servidor.
- No se almacenan datos de tarjeta; el pago es simulado.
- Sanitización de textos mostrados (Angular escapa por defecto).
- `rel="noopener noreferrer"` en enlaces externos.
- Los logs no imprimen tokens, contraseñas ni datos de tarjeta.

---

## 11. Manejo de errores y estados

- Mapeo de errores de Supabase/Postgres a mensajes en español.
- Toasts: éxito, error, info.
- Skeletons en cargas iniciales.
- Empty states con icono Lucide y CTA.
- Reintento en fallos de red.
- Banner offline.
- Formularios con mensajes por campo y resumen de error.
- Confirmación antes de acciones destructivas.
- Si faltan tablas/RPC del contrato, la app usa el fallback demo y muestra un aviso discreto de integración pendiente; nunca se rompe la navegación.

---

## 12. Responsive y accesibilidad

- Mobile first; breakpoints 640, 900, 1200.
- Header con menú drawer en móvil.
- Grid de productos 1/2/3/4 columnas.
- Tablas admin con scroll horizontal y vista de tarjetas en móvil.
- Focus visible, navegación por teclado, focus trap en modales/drawer.
- `aria-label` en iconos interactivos.
- Contraste AA.
- `prefers-reduced-motion` respetado.
- Imágenes con `alt` descriptivo.
- Toasts con `aria-live`.

---

## 13. SEO y metadatos

- Títulos y descripciones por ruta.
- Open Graph y Twitter Card.
- JSON-LD `Restaurant` con nombre, dirección, teléfono, horario y menú.
- `robots.txt` y `sitemap.xml` con rutas públicas.
- Idioma `es-PE`.
- Favicon y apple-touch-icon.

---

## 14. Testing y verificación

Tests unitarios:

- `CartService`: agregar, incrementar, eliminar, persistencia, totales.
- `PointsService`: bloques de 100, tope 50 %, saldo insuficiente.
- `AuthService`/guards: redirección de no autenticado y no admin.
- Utilidades de estado de pedido y formato de moneda.

Comandos:

```bash
npm install
npm run build
npm test -- --watch=false
```

Verificación manual:

- Home responsive y marquees sin saltos.
- Carta: filtros, búsqueda, quick view, carrito.
- Registro/login y persistencia de sesión.
- Checkout con delivery/recojo, puntos y pago simulado.
- Seguimiento de pedido.
- Admin: dashboard, CRUD, pedidos, puntos, usuarios.
- Guards: cliente no accede a `/admin`; visitante no confirma checkout sin sesión.
- Integración: con contrato desplegado usa datos reales; sin contrato usa fallback demo y aviso.

---

## 15. Entregables

- Proyecto Angular funcional en la raíz del repositorio.
- `src/environments/environment.ts` con URL y anon key proporcionadas.
- Capa de datos tipada contra el contrato de Supabase y fallback demo local.
- Aviso de integración pendiente cuando el contrato aún no esté desplegado.
- `README.md` con instalación, variables de entorno, contrato de datos y credenciales de admin.
- Logo procesado (transparente y dorado), favicon e imágenes de respaldo.
- Tests y build verdes.
- **Cero archivos SQL creados o modificados.**

---

## 16. Criterios de aceptación

1. La web carga sin errores y muestra el diseño premium en móvil y escritorio.
2. Los marquees son infinitos y no dejan espacios en blanco en el empalme.
3. Los productos se leen desde Supabase cuando el contrato está desplegado; si no, se ven con el fallback demo sin romper la UI.
4. El carrito persiste y calcula totales de forma consistente.
5. Un visitante puede registrarse durante el checkout y confirmar un pedido cuando el backend está disponible.
6. El pedido se crea validando precio y puntos en servidor a través de la RPC.
7. Los puntos se descuentan/acreditan correctamente y se reflejan en la cuenta.
8. El seguimiento muestra el estado y se actualiza en tiempo real cuando el backend lo permite.
9. Un admin puede hacer CRUD de productos/categorías y gestionar pedidos, clientes, puntos, mesas, reservas y usuarios.
10. El dashboard muestra KPIs y gráficos con datos reales o demo.
11. Los guards del frontend bloquean rutas de admin y checkout sin sesión.
12. `npm run build` y los tests pasan.
13. No se creó ni modificó ningún archivo SQL desde este proyecto.

---

## 17. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El agente de SQL aún no desplegó el contrato | Fallback demo local + aviso de integración pendiente. |
| El contrato real usa otros nombres/estructura | Toda la adaptación vive en `core/data/*` y modelos; un solo punto de cambio. |
| Confirmación de email activa en Supabase | Mensaje claro; documentar desactivarla para demo. |
| Imágenes remotas caen | Fallback local SVG con logo y gradiente. |
| RPC con datos inválidos | Validaciones en frontend y manejo de errores con mensajes claros. |
| Puntos mal calculados en demo | Tests unitarios del cálculo espejo; el servidor es la fuente de verdad. |
| Admin se bloquea a sí mismo | La UI y la RPC impiden quitarse el rol admin. |
| Backend no disponible en la demo | Carrito y navegación offline; aviso y reintento en operaciones que requieren servidor. |

---

## 18. Orden de implementación

1. Scaffold Angular, dependencias, tokens, assets y logo procesado.
2. Contrato TypeScript (`core/models`) y capa de datos con fallback demo.
3. SupabaseService, AuthService, CartService, PointsService, SiteConfigService.
4. Componentes compartidos: header, footer, marquee, product card, cart drawer, toasts.
5. Páginas públicas: inicio, carta, promociones, nosotros, contacto.
6. Auth, checkout, cuenta y seguimiento.
7. Reservas y páginas legales.
8. Admin: layout, dashboard, productos, categorías, pedidos.
9. Admin: clientes, puntos, mesas, reservas, usuarios, reportes, configuración.
10. SEO, accesibilidad, responsive y pulido visual.
11. Tests, build y verificación final.
12. README principal (sin SQL).
