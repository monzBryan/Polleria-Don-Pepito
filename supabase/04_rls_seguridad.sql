/* ==================================================================================
   SEGURIDAD DE LA API - RLS, STAFF Y CLIENTES
   ----------------------------------------------------------------------------------
   Objetivo:
     - Cerrar el acceso anónimo a todas las tablas de public.
     - Permitir acceso total al personal autenticado (USUARIO.UUID_Auth).
     - Permitir al cliente autenticado ver su perfil y sus puntos.
     - Mantener el backend con service_role (bypass RLS) para la operación.
   Requiere: 01, 02 y 03. Ejecutar al final.
   ================================================================================== */

/* ----------------------------------------------------------------------------------
   01. VÍNCULO DEL PERSONAL CON SUPABASE AUTH
   ---------------------------------------------------------------------------------- */
ALTER TABLE USUARIO ADD COLUMN IF NOT EXISTS UUID_Auth uuid NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_usuario_uuid') THEN
        ALTER TABLE USUARIO ADD CONSTRAINT UQ_USUARIO_UUID UNIQUE (UUID_Auth);
    END IF;
END $$;

/* ----------------------------------------------------------------------------------
   02. FUNCIONES DE CONTEXTO
   ---------------------------------------------------------------------------------- */
CREATE OR REPLACE FUNCTION fn_es_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM USUARIO u
        WHERE u.UUID_Auth = auth.uid()
          AND u.ESTADO = 'A'
          AND u.Bloqueado = 'N'
    );
$$;

CREATE OR REPLACE FUNCTION fn_cliente_actual()
RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT c.ID_Cliente
    FROM CLIENTE c
    WHERE c.UUID_Auth = auth.uid()
      AND c.ESTADO = 'A'
    LIMIT 1;
$$;

/* ----------------------------------------------------------------------------------
   03. RLS EN TODAS LAS TABLAS
   ---------------------------------------------------------------------------------- */
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

/* Acceso total para personal activo (se combina con las políticas de cliente) */
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = r.tablename
              AND policyname = 'staff_acceso_total'
        ) THEN
            EXECUTE format(
                'CREATE POLICY staff_acceso_total ON public.%I FOR ALL USING (fn_es_staff()) WITH CHECK (fn_es_staff())',
                r.tablename);
        END IF;
    END LOOP;
END $$;

/* ----------------------------------------------------------------------------------
   04. POLÍTICAS DEL CLIENTE
   ---------------------------------------------------------------------------------- */
DROP POLICY IF EXISTS cliente_lee_su_perfil ON CLIENTE;
CREATE POLICY cliente_lee_su_perfil ON CLIENTE
    FOR SELECT
    USING (UUID_Auth = auth.uid());

DROP POLICY IF EXISTS cliente_lee_su_persona ON PERSONA;
CREATE POLICY cliente_lee_su_persona ON PERSONA
    FOR SELECT
    USING (ID_Persona IN (
        SELECT c.ID_Persona FROM CLIENTE c WHERE c.UUID_Auth = auth.uid()
    ));

DROP POLICY IF EXISTS cliente_lee_su_empresa ON EMPRESA;
CREATE POLICY cliente_lee_su_empresa ON EMPRESA
    FOR SELECT
    USING (ID_Empresa IN (
        SELECT c.ID_Empresa FROM CLIENTE c WHERE c.UUID_Auth = auth.uid()
    ));

DROP POLICY IF EXISTS cliente_lee_config_puntos ON CONFIG_PUNTOS;
CREATE POLICY cliente_lee_config_puntos ON CONFIG_PUNTOS
    FOR SELECT
    USING (ESTADO = 'A' AND auth.role() = 'authenticated');

/* Reemplaza la política original para usar el helper sin subconsultas recursivas */
DROP POLICY IF EXISTS cliente_lee_sus_puntos ON TRANSACCION_PUNTOS;
CREATE POLICY cliente_lee_sus_puntos ON TRANSACCION_PUNTOS
    FOR SELECT
    USING (ID_Cliente = fn_cliente_actual());

/* ----------------------------------------------------------------------------------
   05. VISTAS CON RLS DEL INVOCADOR
   ---------------------------------------------------------------------------------- */
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT viewname FROM pg_views WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', r.viewname);
    END LOOP;
END $$;

/* ----------------------------------------------------------------------------------
   06. PERMISOS DE EJECUCIÓN DE FUNCIONES
   ----------------------------------------------------------------------------------
   El backend usa service_role. Solo el login y los helpers de RLS quedan expuestos
   a anon/authenticated. Las funciones de negocio (facturar, anular, puntos, caja)
   quedan exclusivas de service_role.
   ---------------------------------------------------------------------------------- */
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT EXECUTE ON FUNCTION sp_login(varchar, varchar) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_es_staff() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_cliente_actual() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION sp_permisos_usuario(int) TO authenticated;
