# Pollería Don Pepito — Base de datos en Supabase

Proyecto Supabase: **Project Don Pepito**
`ref`: `snhknousdiwynxbfunyb`
Región: `us-east-1` · PostgreSQL 17

La base de datos fue creada a partir del modelo SQL Server original
(`01_MODELO_RESTAURANTE_SQLSERVER.sql`) y del módulo de puntos
(`02_TABLA_PUNTOS_SUPABASE.sql`), adaptados a PostgreSQL/Supabase.

## Archivos

| Archivo | Contenido |
|---|---|
| [`01_modelo_restaurante_postgres.sql`](01_modelo_restaurante_postgres.sql) | 48 tablas, índices, 7 vistas, funciones y triggers de auditoría. |
| [`02_puntos_supabase_postgres.sql`](02_puntos_supabase_postgres.sql) | Programa de puntos: configuración, movimientos, acreditación/canje, RLS. |
| [`03_datos_polleria.sql`](03_datos_polleria.sql) | Datos maestros y operación de una pollería peruana. |
| [`04_rls_seguridad.sql`](04_rls_seguridad.sql) | RLS en todas las tablas, acceso de staff/clientes y permisos de funciones. |

Orden de ejecución: `01` → `02` → `03` → `04`.

## Modelo implementado

- **48 tablas** en `public` con el estándar de auditoría
  `USUCRE, PCCRE, FECCRE, USUMOD, PCMOD, FECMOD, ESTADO`.
- **7 vistas**: `VW_MAPA_MESAS`, `VW_COMANDA_COCINA`, `VW_VENTAS_DIARIAS`,
  `VW_PRODUCTOS_MAS_VENDIDOS`, `VW_ARQUEO_CAJA`, `VW_CLIENTES`,
  `VW_PUNTOS_CLIENTE`.
- **17 funciones** (login SHA-256, permisos, apertura/cierre de caja,
  comandas, facturación, anulación, puntos y auditoría).
- **Triggers**: auditoría de `PRODUCTO`, `VENTA` y `TRANSACCION_PUNTOS`;
  acreditación automática de puntos al registrar una venta.
- Los totales se mantienen con IGV incluido (18 %) y recargo de servicio
  para mesas VIP (10 %).

## Datos de ejemplo

- 4 departamentos, 6 provincias y 15 distritos (Lima, Ica, Arequipa, Trujillo).
- 13 clientes (11 personas y 2 empresas con RUC para factura).
- 10 empleados, 6 usuarios y roles/permisos completos.
- 5 ambientes y 13 mesas (salón, terraza, barra, VIP y zona parrilla).
- **65 productos** en 10 categorías, inspirados en la carta de Roky's y Norky's:
  pollo entero, 1/2 y 1/4 de pollo, combos familiares, parrillas,
  chicharrón, alitas BBQ, tequeños, yuquitas, chicha morada, postres, etc.
- 13 ventas del día (11 boletas y 2 facturas), 2 deliveries, 4 reservas,
  1 comanda abierta, movimientos de caja, inventario y 14 recetas.

Precios de referencia usados: pollo entero S/ 81.90, 1/2 pollo S/ 51.90,
1/4 pollo S/ 26.90, combo familiar S/ 99.90, parrilla para dos S/ 71.90,
chicha morada 1 L S/ 20.90 y 1.9 L S/ 34.90.

## Programa de puntos

- 1 sol gastado = 1 punto.
- 100 puntos = S/ 1.00 de descuento.
- La venta acredita puntos automáticamente (`TR_VENTA_PUNTOS`).
- El canje se registra como movimiento `USO` con puntos negativos.
- `CLIENTE.UUID_Auth` enlaza con `auth.users` para que cada cliente
  autenticado vea solo sus movimientos (RLS en `TRANSACCION_PUNTOS`).

## Usuarios de prueba

| Logeo | Clave | Rol |
|---|---|---|
| `admin` | `admin123` | Administrador |
| `cajero1` | `cajero123` | Cajero |
| `mozo1` | `mozo123` | Mozo |
| `cocina1` | `cocina123` | Cocina |
| `supervisor` | `super123` | Supervisor |
| `repartidor1` | `reparto123` | Repartidor |

Las claves están almacenadas como SHA-256 para mantener la compatibilidad
con el modelo original. Para producción se recomienda migrar a bcrypt.

## Verificación rápida

```sql
SELECT * FROM vw_ventas_diarias;
SELECT * FROM vw_puntos_cliente ORDER BY puntos_saldo DESC;
SELECT * FROM vw_mapa_mesas ORDER BY id_mesa;
SELECT * FROM sp_login('admin', 'admin123');
```

## Seguridad

Las 48 tablas tienen RLS activado y las 7 vistas usan `security_invoker`.

- **Anónimo (`anon`)**: sin acceso a tablas ni vistas; solo puede llamar a
  `sp_login`.
- **Staff (`authenticated` + `USUARIO.UUID_Auth`)**: acceso total a la
  operación. Hay que registrar el `sub` de `auth.users` en `USUARIO.UUID_Auth`.
- **Cliente (`authenticated` + `CLIENTE.UUID_Auth`)**: solo ve su fila de
  `CLIENTE`, su `PERSONA`/`EMPRESA`, la configuración de puntos y sus
  movimientos; `VW_PUNTOS_CLIENTE` le muestra su saldo.
- **Backend (`service_role`)**: bypass de RLS y ejecución de todas las
  funciones de negocio.

Las funciones `sp_facturar_pedido`, `sp_anular_pedido`, `sp_canjear_puntos`,
`sp_aperturar_caja`, `sp_cerrar_caja` y similares quedaron ejecutables solo por
`service_role`; `sp_login` y los helpers de RLS sí están expuestos a
`anon`/`authenticated`.

La política `staff_acceso_total` es una base de trabajo: da acceso a todo el
personal activo. Antes de producción conviene dividirla por roles
(administrador, cajero, mozo, cocina) y migrar las claves de SHA-256 a bcrypt o a Supabase Auth.
