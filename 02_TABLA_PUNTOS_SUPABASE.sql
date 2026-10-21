/* ==================================================================================
   POLLERIA DON PEPITO - PROGRAMA DE PUNTOS (DINERO VIRTUAL)
   SQL para SUPERBASE (PostgreSQL / pgAdmin de Supabase)
   ----------------------------------------------------------------------------------
   Ejecutar después de crear las tablas base del modelo (CLIENTE, VENTA, etc.).
   Estándar de auditoría del modelo: USUCRE, PCCRE, FECCRE, USUMOD, PCMOD, FECMOD, ESTADO
   Borrado lógico  : ESTADO = 'A' Activo / 'I' Inactivo / 'E' Eliminado
   ----------------------------------------------------------------------------------
   REGLA DE NEGocio DEL PROGRAMA DE PUNTOS:
     - 1 Sol (PEN) gastado  = 1 punto ganado (se registra al confirmar la venta).
     - 100 puntos           = 1 Sol de descuento en compras siguientes.
     - El canje de puntos se registra como movimiento tipo 'USO' con puntos negativos.
   ================================================================================== */

-- ================================================================================
-- 01. TABLA MAESTRA DE CONFIGURACION DE REGLAS DE PUNTOS
-- ================================================================================
CREATE TABLE IF NOT EXISTS CONFIG_PUNTOS (
    ID_Config          int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Puntos_Por_Sol     numeric(6,2)  NOT NULL DEFAULT 1.00,          -- 1 sol = 1 punto
    Puntos_X_Descuento int           NOT NULL DEFAULT 100,           -- cada N puntos = 1 sol
    Valor_Descuento    numeric(8,2)  NOT NULL DEFAULT 1.00,          -- valor en soles del bloque de puntos
    Max_Descuento_Pct  numeric(5,2)  NOT NULL DEFAULT 50.00,         -- tope: pts no cubren más del 50% de la compra
    puntos_Vencen      char(1)       NOT NULL DEFAULT 'N',           -- S/N
    Meses_Vencimiento  int           NULL,
    USUCRE             varchar(30)   NOT NULL DEFAULT current_user,
    PCCRE              varchar(30)   NULL,                           -- host_info() de Supabase / IP del cliente
    FECCRE             timestamptz   NOT NULL DEFAULT now(),
    USUMOD             varchar(30)   NULL,
    PCMOD              varchar(30)   NULL,
    FECMOD             timestamptz   NULL,
    ESTADO             char(1)       NOT NULL DEFAULT 'A' CHECK (ESTADO IN ('A','I','E')),
    CONSTRAINT CK_CONFIGPUNTOS_POR CHECK (Puntos_Por_Sol > 0),
    CONSTRAINT CK_CONFIGPUNTOS_BLO CHECK (Puntos_X_Descuento > 0),
    CONSTRAINT CK_CONFIGPUNTOS_EST CHECK (ESTADO IN ('A','I','E'))
);

-- Un único registro de configuración activo
INSERT INTO CONFIG_PUNTOS (Puntos_Por_Sol, Puntos_X_Descuento, Valor_Descuento, USUCRE)
SELECT 1.00, 100, 1.00, 'admin'
WHERE NOT EXISTS (SELECT 1 FROM CONFIG_PUNTOS WHERE ESTADO = 'A');

-- ================================================================================
-- 02. TABLA TRANSACCION_PUNTOS : historial de movimientos de puntos por cliente
-- ================================================================================
CREATE TABLE IF NOT EXISTS TRANSACCION_PUNTOS (
    ID_Transaccion     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ID_Cliente         int           NOT NULL REFERENCES CLIENTE(ID_Cliente),
    ID_Venta           int           NULL REFERENCES VENTA(ID_Venta),   -- venta que originó/gastó los puntos
    Tipo_Movimiento    varchar(10)   NOT NULL,                          -- GANANCIA / USO / AJUSTE / CADUCADO
    Puntos             int           NOT NULL,                          -- + = acumula | - = canje
    Monto_Afectado     numeric(12,2) NOT NULL DEFAULT 0,                -- soles que generaron/gastaron los puntos
    Saldo_Restante     int           NULL,                              -- snapshot del saldo tras el movimiento
    Observacion        varchar(200)  NULL,
    -- BLOQUE DE AUDITORIA (estándar del modelo)
    USUCRE             varchar(30)   NOT NULL DEFAULT current_user,
    PCCRE              varchar(30)   NULL,
    FECCRE             timestamptz   NOT NULL DEFAULT now(),
    USUMOD             varchar(30)   NULL,
    PCMOD              varchar(30)   NULL,
    FECMOD             timestamptz   NULL,
    ESTADO             char(1)       NOT NULL DEFAULT 'A',
    CONSTRAINT PK_TRANSACCION_PUNTOS PRIMARY KEY (ID_Transaccion),
    CONSTRAINT CK_TRAPTO_TIPO CHECK (Tipo_Movimiento IN ('GANANCIA','USO','AJUSTE','CADUCADO')),
    CONSTRAINT CK_TRAPTO_PTS  CHECK (Puntos <> 0),
    CONSTRAINT CK_TRAPTO_MTO  CHECK (Monto_Afectado >= 0),
    CONSTRAINT CK_TRAPTO_EST  CHECK (ESTADO IN ('A','I','E'))
);

CREATE INDEX IF NOT EXISTS IX_TRAPTO_CLIENTE ON TRANSACCION_PUNTOS(ID_Cliente)
    WHERE ESTADO <> 'E';
CREATE INDEX IF NOT EXISTS IX_TRAPTO_VENTA   ON TRANSACCION_PUNTOS(ID_Venta)
    WHERE ESTADO <> 'E';

COMMENT ON TABLE TRANSACCION_PUNTOS IS
    'Movimientos de puntos de dinero virtual. 1 sol = 1 punto; 100 puntos = 1 sol de descuento.';

-- ================================================================================
-- 03. VISTA DE SALDO DE PUNTOS POR CLIENTE (usa la configuración vigente)
-- ================================================================================
CREATE OR REPLACE VIEW VW_PUNTOS_CLIENTE AS
SELECT
    c.ID_Cliente,
    p.Nombre || ' ' || COALESCE(p.Ap_Paterno,'') AS N_Cliente,
    c.Puntos                       AS Puntos_Saldo,
    cp.Puntos_X_Descuento          AS Bloque_Canje,
    cp.Valor_Descuento             AS Valor_Bloque,
    TRUNC(c.Puntos / cp.Puntos_X_Descuento) * cp.Valor_Descuento AS Descuento_Disponible_Soles
FROM CLIENTE c
JOIN PERSONA p        ON p.ID_Persona = c.ID_Persona
JOIN CONFIG_PUNTOS cp ON cp.ESTADO = 'A';

-- ================================================================================
-- 04. FUNCION : REGISTRAR PUNTOS GANADOS (se llama al confirmar/abonar una venta)
--     Ej: SELECT sp_acreditar_puntos( cliente_id := 12, venta_id := 9001, monto := 150.00 );
-- ================================================================================
CREATE OR REPLACE FUNCTION sp_acreditar_puntos(
    cliente_id int,
    venta_id   int DEFAULT NULL,
    monto      numeric(12,2))
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    v_pct  numeric(6,2);
    v_pts  int;
    v_sal  int;
BEGIN
    SELECT Puntos_Por_Sol INTO v_pct FROM CONFIG_PUNTOS WHERE ESTADO = 'A';
    v_pts := FLOOR(monto * v_pct);

    UPDATE CLIENTE
       SET Puntos  = Puntos + v_pts,
           USUMOD  = current_user,
           PCMOD   = host_addr(inet_client_addr()),
           FECMOD  = now()
     WHERE ID_Cliente = cliente_id
    RETURNING Puntos INTO v_sal;

    INSERT INTO TRANSACCION_PUNTOS (ID_Cliente, ID_Venta, Tipo_Movimiento, Puntos,
                                    Monto_Afectado, Saldo_Restante, Observacion, USUCRE)
    VALUES (cliente_id, venta_id, 'GANANCIA', v_pts,
            monto, v_sal, 'Acreditación automática por venta', 'sistema');

    RETURN v_pts;
END $$;

-- ================================================================================
-- 05. FUNCION : CANJEAR PUNTOS (USO) : cada 100 puntos = 1 sol de descuento
--     Ej: SELECT sp_canjear_puntos( cliente_id := 12, venta_id := 9002, puntos_usados := 300 );
-- ================================================================================
CREATE OR REPLACE FUNCTION sp_canjear_puntos(
    cliente_id    int,
    venta_id      int DEFAULT NULL,
    puntos_usados int)
RETURNS numeric(12,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_bloque  int;
    v_valor   numeric(8,2);
    v_tope    numeric(5,2);
    v_saldo   int;
    v_desc    numeric(12,2);
BEGIN
    SELECT Puntos_X_Descuento, Valor_Descuento, Max_Descuento_Pct
      INTO v_bloque, v_valor, v_tope
      FROM CONFIG_PUNTOS WHERE ESTADO = 'A';

    SELECT Puntos INTO v_saldo FROM CLIENTE WHERE ID_Cliente = cliente_id;

    IF puntos_usados > v_saldo THEN
        RAISE EXCEPTION 'Saldo insuficiente: cliente tiene % puntos, solicita %', v_saldo, puntos_usados;
    END IF;
    IF puntos_usados % v_bloque <> 0 THEN
        RAISE EXCEPTION 'El canje debe ser múltiplo de % puntos', v_bloque;
    END IF;

    v_desc := FLOOR(puntos_usados / v_bloque) * v_valor;

    UPDATE CLIENTE
       SET Puntos = Puntos - puntos_usados,
           USUMOD = current_user,
           PCMOD  = host_addr(inet_client_addr()),
           FECMOD = now()
     WHERE ID_Cliente = cliente_id
    RETURNING Puntos INTO v_saldo;

    INSERT INTO TRANSACCION_PUNTOS (ID_Cliente, ID_Venta, Tipo_Movimiento, Puntos,
                                    Monto_Afectado, Saldo_Restante, Observacion, USUCRE)
    VALUES (cliente_id, venta_id, 'USO', -puntos_usados,
            v_desc, v_saldo, 'Canje de puntos por descuento', 'sistema');

    RETURN v_desc;
END $$;

-- ================================================================================
-- 06. TRIGGER DE AUDITORÍA a la tabla AUDITORIA del modelo
--     Registra INSERT/UPDATE/DELETE de TRANSACCION_PUNTOS con valores JSON
-- ================================================================================
CREATE OR REPLACE FUNCTION fn_auditoria_puntos()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO AUDITORIA (N_Tabla, Accion, ID_Registro, Valor_Nuevo, USUCRE)
    SELECT 'TRANSACCION_PUNTOS',
           TG_OP,
           NEW.ID_Transaccion,
           to_jsonb(NEW)::text,
           current_user;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS TR_AUDITORIA_PUNTOS ON TRANSACCION_PUNTOS;
CREATE TRIGGER TR_AUDITORIA_PUNTOS
AFTER INSERT OR UPDATE ON TRANSACCION_PUNTOS
FOR EACH ROW EXECUTE FUNCTION fn_auditoria_puntos();

-- ================================================================================
-- 07. POLÍTICAS RLS (Row Level Security) para Supabase
--     El cliente autenticado solo ve sus propios puntos; los procesos de venta
--     usan la service_role key del backend.
-- ================================================================================
ALTER TABLE TRANSACCION_PUNTOS ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cliente_lee_sus_puntos" ON TRANSACCION_PUNTOS
    FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR ID_Cliente = (
            SELECT c.ID_Cliente FROM CLIENTE c
            JOIN auth.users au ON au.id::text = c.UUID_Auth  -- agrega columna UUID_Auth uuid a CLIENTE
            WHERE au.id = auth.uid()
        )
    );

-- ================================================================================
-- 08. DATOS DE PRUEBA (opcional: coméntalo si ya tienes clientes)
-- ================================================================================
-- INSERT INTO TRANSACCION_PUNTOS (ID_Cliente, Tipo_Movimiento, Puntos, Monto_Afectado, Saldo_Restante, Observacion, USUCRE)
-- VALUES (1, 'GANANCIA', 250, 250.00, 250, 'Bienvenida / venta de prueba', 'admin'),
--        (2, 'GANANCIA', 100, 100.00, 100, 'Bienvenida / venta de prueba', 'admin');

-- ==================================================================================
-- RESUMEN DEL PROGRAMA PARA LA WEB:
--   Ganancia : Puntos = FLOOR(Total_Venta)  ->  1 sol = 1 punto
--   Canje    : Descuento = (Puntos / 100) * 1 sol   (múltiplos de 100 puntos)
--   Tope     : los puntos no cubren más del 50% del total de la compra (Config_Puntos)
-- ==================================================================================
