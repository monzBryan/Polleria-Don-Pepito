/* ==================================================================================
   SISTEMA DE GESTIÓN DE VENTAS Y PEDIDOS PARA RESTAURANTE
   Modelo relacional con AUDITORÍA, ROLES/PERMISOS, MÓDULO DE CAJA Y FACTURACIÓN
   Adaptado desde el modelo "SISTEMA HOTEL - MODELO RELACIONAL CON AUDITORIA,
   ROLES/PERMISOS Y CAJA"
   ----------------------------------------------------------------------------------
   Motor        : Microsoft SQL Server 2016 o superior
   Base de datos: RESTAURANTEV3
   Estándar     : Todas las tablas incorporan el bloque de auditoría
                  USUCRE, PCCRE, FECCRE, USUMOD, PCMOD, FECMOD, ESTADO
   Borrado      : Lógico (ESTADO = 'A' Activo / 'I' Inactivo / 'E' Eliminado)
   ==================================================================================
   MAPEO DE ADAPTACIÓN (HOTEL -> RESTAURANTE)
   ----------------------------------------------------------------------------------
   PISO                  -> AMBIENTE            (salón, terraza, barra, VIP)
   ESTADO_HABITACION     -> ESTADO_MESA         (libre, ocupada, reservada, atendida)
   CATEGORIA_HABITACION  -> TIPO_MESA           (mesa, barra, box, delivery virtual)
   HABITACION            -> MESA
   RECEPCION             -> PEDIDO (comanda)    + DETALLE_PEDIDO
   (huésped)             -> RESERVA / PEDIDO_DELIVERY
   Se CONSERVAN sin cambios de concepto:
   PERSONA, EMPRESA, CLIENTE, DEPARTAMENTO/PROVINCIA/DISTRITO, TIPO_IDENTIDAD,
   EMPLEADO, CONTRATO, CARGO, USUARIO, TIPO_USUARIO,
   MODULO, ROL, PERMISO, ROL_PERMISO, USUARIO_ROL, AUDITORIA,
   CAJA, APERTURA_CAJA, TIPO_MOVIMIENTO_CAJA, CONCEPTO_CAJA, MOVIMIENTO_CAJA,
   METODO_PAGO, VENTA, DETALLE_VENTA, BOLETA, FACTURA,
   CATEGORIA_PRODUCTO, PRODUCTO.
   Se AGREGAN por necesidad del giro:
   UNIDAD_MEDIDA, TIPO_PEDIDO, ESTADO_PEDIDO, PEDIDO_DELIVERY, RESERVA,
   PAGO_VENTA (pago mixto), SERIE_DOCUMENTO (correlativos), NOTA_CREDITO,
   RECETA y MOVIMIENTO_INVENTARIO (módulo opcional de insumos).
   ================================================================================== */

USE master;
GO
IF DB_ID('RESTAURANTEV3') IS NOT NULL
BEGIN
    ALTER DATABASE RESTAURANTEV3 SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE RESTAURANTEV3;
END
GO
CREATE DATABASE RESTAURANTEV3;
GO
USE RESTAURANTEV3;
GO
SET DATEFORMAT dmy;
GO

/* ==================================================================================
   MÓDULO 01 : UBICACIÓN GEOGRÁFICA
   ================================================================================== */

CREATE TABLE DEPARTAMENTO(
    ID_Departamento   int IDENTITY(1,1) NOT NULL,
    N_Departamento    varchar(30)  NOT NULL,
    -- AUDITORIA
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_DEPARTAMENTO_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_DEPARTAMENTO_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_DEPARTAMENTO_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_DEPARTAMENTO_ESTADO DEFAULT 'A',
    CONSTRAINT PK_DEPARTAMENTO PRIMARY KEY (ID_Departamento),
    CONSTRAINT UQ_DEPARTAMENTO_NOM UNIQUE (N_Departamento),
    CONSTRAINT CK_DEPARTAMENTO_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE PROVINCIA(
    ID_Provincia      int IDENTITY(1,1) NOT NULL,
    ID_Departamento   int          NOT NULL,
    N_Provincia       varchar(30)  NOT NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_PROVINCIA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_PROVINCIA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_PROVINCIA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_PROVINCIA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_PROVINCIA PRIMARY KEY (ID_Provincia),
    CONSTRAINT FK_PROVINCIA_DEPARTAMENTO FOREIGN KEY (ID_Departamento) REFERENCES DEPARTAMENTO(ID_Departamento),
    CONSTRAINT CK_PROVINCIA_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE DISTRITO(
    ID_Distrito       int IDENTITY(1,1) NOT NULL,
    ID_Provincia      int          NOT NULL,
    D_Distrito        varchar(40)  NOT NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_DISTRITO_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_DISTRITO_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_DISTRITO_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_DISTRITO_ESTADO DEFAULT 'A',
    CONSTRAINT PK_DISTRITO PRIMARY KEY (ID_Distrito),
    CONSTRAINT FK_DISTRITO_PROVINCIA FOREIGN KEY (ID_Provincia) REFERENCES PROVINCIA(ID_Provincia),
    CONSTRAINT CK_DISTRITO_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

/* ==================================================================================
   MÓDULO 02 : PERSONAS, EMPRESAS Y CLIENTES   (se mantiene del modelo hotel)
   ================================================================================== */

CREATE TABLE TIPO_IDENTIDAD(
    ID_TipoIdentidad  int IDENTITY(1,1) NOT NULL,
    N_TipoIdentidad   varchar(20)  NOT NULL,
    Abreviatura       varchar(10)  NOT NULL,
    Longitud          int          NOT NULL,
    Codigo_SUNAT      char(1)      NULL,          -- 1=DNI 6=RUC 4=CE 7=PAS
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_TIPOIDENT_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_TIPOIDENT_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_TIPOIDENT_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_TIPOIDENT_ESTADO DEFAULT 'A',
    CONSTRAINT PK_TIPO_IDENTIDAD PRIMARY KEY (ID_TipoIdentidad),
    CONSTRAINT UQ_TIPO_IDENTIDAD UNIQUE (N_TipoIdentidad),
    CONSTRAINT CK_TIPOIDENT_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE PERSONA(
    ID_Persona        int IDENTITY(1,1) NOT NULL,
    ID_Distrito       int          NULL,
    ID_TipoIdentidad  int          NOT NULL,
    N_Documento       varchar(15)  NOT NULL,
    Nombre            varchar(80)  NOT NULL,
    Ap_Paterno        varchar(80)  NULL,
    Ap_Materno        varchar(80)  NULL,
    F_Nacimiento      date         NULL,
    EMAIL             varchar(50)  NULL,
    Celular           char(9)      NULL,
    Genero            char(1)      NULL,
    Direccion         varchar(100) NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_PERSONA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_PERSONA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_PERSONA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_PERSONA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_PERSONA PRIMARY KEY (ID_Persona),
    CONSTRAINT FK_PERSONA_DISTRITO FOREIGN KEY (ID_Distrito) REFERENCES DISTRITO(ID_Distrito),
    CONSTRAINT FK_PERSONA_TIPOIDENT FOREIGN KEY (ID_TipoIdentidad) REFERENCES TIPO_IDENTIDAD(ID_TipoIdentidad),
    CONSTRAINT UQ_PERSONA_DOC UNIQUE (ID_TipoIdentidad, N_Documento),
    CONSTRAINT CK_PERSONA_GEN CHECK (Genero IN ('M','F','O')),
    CONSTRAINT CK_PERSONA_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE EMPRESA(
    ID_Empresa        int IDENTITY(1,1) NOT NULL,
    ID_Distrito       int          NULL,
    RUC               char(11)     NOT NULL,
    Razon_Social      varchar(140) NOT NULL,
    Nombre_Comercial  varchar(140) NULL,
    Direccion         varchar(150) NULL,
    Telefono          varchar(8)   NULL,
    EMAIL             varchar(50)  NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_EMPRESA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_EMPRESA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_EMPRESA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_EMPRESA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_EMPRESA PRIMARY KEY (ID_Empresa),
    CONSTRAINT FK_EMPRESA_DISTRITO FOREIGN KEY (ID_Distrito) REFERENCES DISTRITO(ID_Distrito),
    CONSTRAINT UQ_EMPRESA_RUC UNIQUE (RUC),
    CONSTRAINT CK_EMPRESA_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

/* CLIENTE: natural (ID_Persona) o jurídico (ID_Empresa). Se exige exactamente uno. */
CREATE TABLE CLIENTE(
    ID_Cliente        int IDENTITY(1,1) NOT NULL,
    ID_Persona        int          NULL,
    ID_Empresa        int          NULL,
    Codigo_Cliente    varchar(15)  NULL,
    Tipo_Cliente      char(1)      NOT NULL CONSTRAINT DF_CLIENTE_TIPO DEFAULT 'N',  -- N=Natural J=Juridico
    Puntos            int          NOT NULL CONSTRAINT DF_CLIENTE_PTOS DEFAULT 0,
    Linea_Credito     decimal(12,2) NOT NULL CONSTRAINT DF_CLIENTE_LC  DEFAULT 0,
    F_Registro        datetime     NOT NULL CONSTRAINT DF_CLIENTE_FREG DEFAULT GETDATE(),
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_CLIENTE_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_CLIENTE_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_CLIENTE_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_CLIENTE_ESTADO DEFAULT 'A',
    CONSTRAINT PK_CLIENTE PRIMARY KEY (ID_Cliente),
    CONSTRAINT FK_CLIENTE_PERSONA FOREIGN KEY (ID_Persona) REFERENCES PERSONA(ID_Persona),
    CONSTRAINT FK_CLIENTE_EMPRESA FOREIGN KEY (ID_Empresa) REFERENCES EMPRESA(ID_Empresa),
    CONSTRAINT CK_CLIENTE_TIPO CHECK (Tipo_Cliente IN ('N','J')),
    CONSTRAINT CK_CLIENTE_XOR  CHECK ( (ID_Persona IS NOT NULL AND ID_Empresa IS NULL)
                                     OR (ID_Persona IS NULL AND ID_Empresa IS NOT NULL) ),
    CONSTRAINT CK_CLIENTE_EST  CHECK (ESTADO IN ('A','I','E'))
);
GO

/* ==================================================================================
   MÓDULO 03 : RECURSOS HUMANOS  (se mantiene del modelo hotel)
   ================================================================================== */

CREATE TABLE CARGO(
    ID_Cargo          int IDENTITY(1,1) NOT NULL,
    N_Cargo           varchar(40)  NOT NULL,
    Area              varchar(40)  NULL,     -- Salón / Cocina / Caja / Administración
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_CARGO_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_CARGO_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_CARGO_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_CARGO_ESTADO DEFAULT 'A',
    CONSTRAINT PK_CARGO PRIMARY KEY (ID_Cargo),
    CONSTRAINT UQ_CARGO UNIQUE (N_Cargo),
    CONSTRAINT CK_CARGO_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE CONTRATO(
    ID_Contrato       int IDENTITY(1,1) NOT NULL,
    N_Contrato        varchar(40)  NOT NULL,
    Descripcion       varchar(100) NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_CONTRATO_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_CONTRATO_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_CONTRATO_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_CONTRATO_ESTADO DEFAULT 'A',
    CONSTRAINT PK_CONTRATO PRIMARY KEY (ID_Contrato),
    CONSTRAINT UQ_CONTRATO UNIQUE (N_Contrato),
    CONSTRAINT CK_CONTRATO_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE EMPLEADO(
    ID_Empleado       int IDENTITY(1,1) NOT NULL,
    ID_Persona        int          NOT NULL,
    ID_Contrato       int          NOT NULL,
    ID_Cargo          int          NOT NULL,
    Salario           decimal(8,2) NOT NULL CONSTRAINT DF_EMPLEADO_SAL DEFAULT 0,
    Turno             varchar(18)  NULL,        -- Mañana / Tarde / Noche / Partido
    Fondo_Pension     char(3)      NULL,        -- ONP / AFP
    N_Hijos           char(1)      NULL,
    ESSALUD           char(6)      NULL,
    F_Ingreso         date         NULL,
    F_Cese            date         NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_EMPLEADO_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_EMPLEADO_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_EMPLEADO_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_EMPLEADO_ESTADO DEFAULT 'A',
    CONSTRAINT PK_EMPLEADO PRIMARY KEY (ID_Empleado),
    CONSTRAINT FK_EMPLEADO_PERSONA  FOREIGN KEY (ID_Persona)  REFERENCES PERSONA(ID_Persona),
    CONSTRAINT FK_EMPLEADO_CONTRATO FOREIGN KEY (ID_Contrato) REFERENCES CONTRATO(ID_Contrato),
    CONSTRAINT FK_EMPLEADO_CARGO    FOREIGN KEY (ID_Cargo)    REFERENCES CARGO(ID_Cargo),
    CONSTRAINT UQ_EMPLEADO_PERSONA UNIQUE (ID_Persona),
    CONSTRAINT CK_EMPLEADO_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

/* ==================================================================================
   MÓDULO 04 : SEGURIDAD - USUARIOS, ROLES, PERMISOS Y AUDITORÍA
   ================================================================================== */

CREATE TABLE TIPO_USUARIO(
    ID_TipoUsuario    int IDENTITY(1,1) NOT NULL,
    N_TipoUsuario     varchar(50)  NOT NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_TIPOUSU_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_TIPOUSU_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_TIPOUSU_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_TIPOUSU_ESTADO DEFAULT 'A',
    CONSTRAINT PK_TIPO_USUARIO PRIMARY KEY (ID_TipoUsuario),
    CONSTRAINT UQ_TIPO_USUARIO UNIQUE (N_TipoUsuario),
    CONSTRAINT CK_TIPOUSU_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE USUARIO(
    ID_Usuario        int IDENTITY(1,1) NOT NULL,
    ID_TipoUsuario    int          NOT NULL,
    ID_Empleado       int          NOT NULL,
    Logeo             varchar(30)  NOT NULL,
    Clave             varchar(200) NOT NULL,      -- almacenar HASH (SHA2_256 / BCrypt)
    Intentos          int          NOT NULL CONSTRAINT DF_USUARIO_INT DEFAULT 0,
    Bloqueado         char(1)      NOT NULL CONSTRAINT DF_USUARIO_BLQ DEFAULT 'N',
    F_UltimoAcceso    datetime     NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_USUARIO_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_USUARIO_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_USUARIO_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_USUARIO_ESTADO DEFAULT 'A',
    CONSTRAINT PK_USUARIO PRIMARY KEY (ID_Usuario),
    CONSTRAINT FK_USUARIO_TIPOUSUARIO FOREIGN KEY (ID_TipoUsuario) REFERENCES TIPO_USUARIO(ID_TipoUsuario),
    CONSTRAINT FK_USUARIO_EMPLEADO    FOREIGN KEY (ID_Empleado)    REFERENCES EMPLEADO(ID_Empleado),
    CONSTRAINT UQ_USUARIO_LOGEO UNIQUE (Logeo),
    CONSTRAINT CK_USUARIO_BLQ CHECK (Bloqueado IN ('S','N')),
    CONSTRAINT CK_USUARIO_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE MODULO(
    ID_Modulo         int IDENTITY(1,1) NOT NULL,
    N_Modulo          varchar(50)  NOT NULL,
    Descripcion       varchar(100) NULL,
    Icono             varchar(50)  NULL,
    Orden             int          NOT NULL CONSTRAINT DF_MODULO_ORD DEFAULT 0,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_MODULO_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_MODULO_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_MODULO_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_MODULO_ESTADO DEFAULT 'A',
    CONSTRAINT PK_MODULO PRIMARY KEY (ID_Modulo),
    CONSTRAINT UQ_MODULO UNIQUE (N_Modulo),
    CONSTRAINT CK_MODULO_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE ROL(
    ID_Rol            int IDENTITY(1,1) NOT NULL,
    N_Rol             varchar(50)  NOT NULL,
    Descripcion       varchar(100) NULL,
    Nivel             int          NOT NULL CONSTRAINT DF_ROL_NIVEL DEFAULT 1,
    F_Creacion        datetime     NOT NULL CONSTRAINT DF_ROL_FCREA DEFAULT GETDATE(),
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_ROL_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_ROL_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_ROL_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_ROL_ESTADO DEFAULT 'A',
    CONSTRAINT PK_ROL PRIMARY KEY (ID_Rol),
    CONSTRAINT UQ_ROL UNIQUE (N_Rol),
    CONSTRAINT CK_ROL_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE PERMISO(
    ID_Permiso        int IDENTITY(1,1) NOT NULL,
    ID_Modulo         int          NOT NULL,
    N_Permiso         varchar(50)  NOT NULL,
    Clave             varchar(50)  NOT NULL,      -- VEN_ANULAR, CAJ_CERRAR, PED_DESCUENTO...
    Descripcion       varchar(100) NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_PERMISO_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_PERMISO_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_PERMISO_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_PERMISO_ESTADO DEFAULT 'A',
    CONSTRAINT PK_PERMISO PRIMARY KEY (ID_Permiso),
    CONSTRAINT FK_PERMISO_MODULO FOREIGN KEY (ID_Modulo) REFERENCES MODULO(ID_Modulo),
    CONSTRAINT UQ_PERMISO_CLAVE UNIQUE (Clave),
    CONSTRAINT CK_PERMISO_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE ROL_PERMISO(
    ID_RolPermiso     int IDENTITY(1,1) NOT NULL,
    ID_Rol            int          NOT NULL,
    ID_Permiso        int          NOT NULL,
    Concedido         char(1)      NOT NULL CONSTRAINT DF_ROLPER_CONC DEFAULT 'S',
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_ROLPER_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_ROLPER_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_ROLPER_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_ROLPER_ESTADO DEFAULT 'A',
    CONSTRAINT PK_ROL_PERMISO PRIMARY KEY (ID_RolPermiso),
    CONSTRAINT FK_ROLPERMISO_ROL     FOREIGN KEY (ID_Rol)     REFERENCES ROL(ID_Rol),
    CONSTRAINT FK_ROLPERMISO_PERMISO FOREIGN KEY (ID_Permiso) REFERENCES PERMISO(ID_Permiso),
    CONSTRAINT UQ_ROL_PERMISO UNIQUE (ID_Rol, ID_Permiso),
    CONSTRAINT CK_ROLPER_CONC CHECK (Concedido IN ('S','N')),
    CONSTRAINT CK_ROLPER_EST  CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE USUARIO_ROL(
    ID_UsuarioRol     int IDENTITY(1,1) NOT NULL,
    ID_Usuario        int          NOT NULL,
    ID_Rol            int          NOT NULL,
    F_Asignacion      datetime     NOT NULL CONSTRAINT DF_USUROL_FASIG DEFAULT GETDATE(),
    Vigente           char(1)      NOT NULL CONSTRAINT DF_USUROL_VIG DEFAULT 'S',
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_USUROL_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_USUROL_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_USUROL_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_USUROL_ESTADO DEFAULT 'A',
    CONSTRAINT PK_USUARIO_ROL PRIMARY KEY (ID_UsuarioRol),
    CONSTRAINT FK_USUARIOROL_USUARIO FOREIGN KEY (ID_Usuario) REFERENCES USUARIO(ID_Usuario),
    CONSTRAINT FK_USUARIOROL_ROL     FOREIGN KEY (ID_Rol)     REFERENCES ROL(ID_Rol),
    CONSTRAINT UQ_USUARIO_ROL UNIQUE (ID_Usuario, ID_Rol),
    CONSTRAINT CK_USUROL_VIG CHECK (Vigente IN ('S','N')),
    CONSTRAINT CK_USUROL_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE AUDITORIA(
    ID_Auditoria      bigint IDENTITY(1,1) NOT NULL,
    ID_Usuario        int          NULL,
    N_Tabla           varchar(50)  NOT NULL,
    Accion            varchar(20)  NOT NULL,      -- INSERT / UPDATE / DELETE / LOGIN
    ID_Registro       int          NULL,
    Valor_Anterior    varchar(max) NULL,
    Valor_Nuevo       varchar(max) NULL,
    F_Evento          datetime     NOT NULL CONSTRAINT DF_AUDITORIA_FEVE DEFAULT GETDATE(),
    IP                varchar(20)  NULL,
    Terminal          varchar(30)  NULL CONSTRAINT DF_AUDITORIA_TERM DEFAULT HOST_NAME(),
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_AUDITORIA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_AUDITORIA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_AUDITORIA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_AUDITORIA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_AUDITORIA PRIMARY KEY (ID_Auditoria),
    CONSTRAINT FK_AUDITORIA_USUARIO FOREIGN KEY (ID_Usuario) REFERENCES USUARIO(ID_Usuario),
    CONSTRAINT CK_AUDITORIA_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

/* ==================================================================================
   MÓDULO 05 : SALÓN  (ADAPTADO:  PISO->AMBIENTE, HABITACION->MESA)
   ================================================================================== */

CREATE TABLE AMBIENTE(
    ID_Ambiente       int IDENTITY(1,1) NOT NULL,
    N_Ambiente        varchar(50)  NOT NULL,      -- Salón principal, Terraza, Barra, Sala VIP
    Descripcion       varchar(100) NULL,
    Piso              int          NULL,
    F_Creacion        datetime     NOT NULL CONSTRAINT DF_AMBIENTE_FCREA DEFAULT GETDATE(),
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_AMBIENTE_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_AMBIENTE_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_AMBIENTE_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_AMBIENTE_ESTADO DEFAULT 'A',
    CONSTRAINT PK_AMBIENTE PRIMARY KEY (ID_Ambiente),
    CONSTRAINT UQ_AMBIENTE UNIQUE (N_Ambiente),
    CONSTRAINT CK_AMBIENTE_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE ESTADO_MESA(
    ID_EstadoMesa     int IDENTITY(1,1) NOT NULL,
    Descripcion       varchar(50)  NOT NULL,      -- LIBRE, OCUPADA, RESERVADA, POR COBRAR
    Color             varchar(10)  NULL,          -- para el mapa de mesas del sistema
    F_Creacion        datetime     NOT NULL CONSTRAINT DF_ESTMESA_FCREA DEFAULT GETDATE(),
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_ESTMESA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_ESTMESA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_ESTMESA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_ESTMESA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_ESTADO_MESA PRIMARY KEY (ID_EstadoMesa),
    CONSTRAINT UQ_ESTADO_MESA UNIQUE (Descripcion),
    CONSTRAINT CK_ESTMESA_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE TIPO_MESA(
    ID_TipoMesa       int IDENTITY(1,1) NOT NULL,
    Descripcion       varchar(80)  NOT NULL,      -- Mesa estándar, Box, Barra, Mesa VIP
    Cargo_Servicio    decimal(5,2) NOT NULL CONSTRAINT DF_TIPOMESA_SERV DEFAULT 0,  -- % recargo
    F_Creacion        datetime     NOT NULL CONSTRAINT DF_TIPOMESA_FCREA DEFAULT GETDATE(),
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_TIPOMESA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_TIPOMESA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_TIPOMESA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_TIPOMESA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_TIPO_MESA PRIMARY KEY (ID_TipoMesa),
    CONSTRAINT UQ_TIPO_MESA UNIQUE (Descripcion),
    CONSTRAINT CK_TIPOMESA_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE MESA(
    ID_Mesa           int IDENTITY(1,1) NOT NULL,
    ID_EstadoMesa     int          NOT NULL,
    ID_Ambiente       int          NOT NULL,
    ID_TipoMesa       int          NOT NULL,
    Numero            varchar(5)   NOT NULL,
    Detalle           varchar(100) NULL,
    Capacidad         int          NOT NULL CONSTRAINT DF_MESA_CAP DEFAULT 4,
    Codigo_QR         varchar(60)  NULL,          -- carta digital / autopedido
    F_Creacion        datetime     NOT NULL CONSTRAINT DF_MESA_FCREA DEFAULT GETDATE(),
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_MESA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_MESA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_MESA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_MESA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_MESA PRIMARY KEY (ID_Mesa),
    CONSTRAINT FK_MESA_ESTADOMESA FOREIGN KEY (ID_EstadoMesa) REFERENCES ESTADO_MESA(ID_EstadoMesa),
    CONSTRAINT FK_MESA_AMBIENTE   FOREIGN KEY (ID_Ambiente)   REFERENCES AMBIENTE(ID_Ambiente),
    CONSTRAINT FK_MESA_TIPOMESA   FOREIGN KEY (ID_TipoMesa)   REFERENCES TIPO_MESA(ID_TipoMesa),
    CONSTRAINT UQ_MESA UNIQUE (ID_Ambiente, Numero),
    CONSTRAINT CK_MESA_CAP CHECK (Capacidad > 0),
    CONSTRAINT CK_MESA_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

/* ==================================================================================
   MÓDULO 06 : CARTA / PRODUCTOS
   ================================================================================== */

CREATE TABLE UNIDAD_MEDIDA(
    ID_Unidad         int IDENTITY(1,1) NOT NULL,
    N_Unidad          varchar(30)  NOT NULL,      -- Unidad, Porción, Jarra, Kilogramo, Litro
    Abreviatura       varchar(10)  NOT NULL,
    Codigo_SUNAT      varchar(5)   NULL,          -- NIU, KGM, LTR
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_UNIDAD_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_UNIDAD_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_UNIDAD_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_UNIDAD_ESTADO DEFAULT 'A',
    CONSTRAINT PK_UNIDAD_MEDIDA PRIMARY KEY (ID_Unidad),
    CONSTRAINT UQ_UNIDAD_MEDIDA UNIQUE (N_Unidad),
    CONSTRAINT CK_UNIDAD_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE CATEGORIA_PRODUCTO(
    ID_CategoriaProducto int IDENTITY(1,1) NOT NULL,
    N_CategoriaProducto  varchar(50)  NOT NULL,   -- Entradas, Platos de fondo, Bebidas, Postres
    Descripcion          varchar(100) NULL,
    Area_Despacho        varchar(20)  NOT NULL CONSTRAINT DF_CATPROD_AREA DEFAULT 'COCINA', -- COCINA/BARRA/CAJA
    Orden_Carta          int          NOT NULL CONSTRAINT DF_CATPROD_ORD DEFAULT 0,
    F_Creacion           datetime     NOT NULL CONSTRAINT DF_CATPROD_FCREA DEFAULT GETDATE(),
    USUCRE               varchar(30)  NOT NULL CONSTRAINT DF_CATPROD_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE                varchar(30)  NOT NULL CONSTRAINT DF_CATPROD_PCCRE  DEFAULT HOST_NAME(),
    FECCRE               datetime     NOT NULL CONSTRAINT DF_CATPROD_FECCRE DEFAULT GETDATE(),
    USUMOD               varchar(30)  NULL,
    PCMOD                varchar(30)  NULL,
    FECMOD               datetime     NULL,
    ESTADO               char(1)      NOT NULL CONSTRAINT DF_CATPROD_ESTADO DEFAULT 'A',
    CONSTRAINT PK_CATEGORIA_PRODUCTO PRIMARY KEY (ID_CategoriaProducto),
    CONSTRAINT UQ_CATEGORIA_PRODUCTO UNIQUE (N_CategoriaProducto),
    CONSTRAINT CK_CATPROD_AREA CHECK (Area_Despacho IN ('COCINA','BARRA','CAJA')),
    CONSTRAINT CK_CATPROD_EST  CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE PRODUCTO(
    ID_Producto          int IDENTITY(1,1) NOT NULL,
    ID_CategoriaProducto int          NOT NULL,
    ID_Unidad            int          NOT NULL,
    Codigo               varchar(20)  NULL,
    N_Producto           varchar(50)  NOT NULL,
    Detalle              varchar(150) NULL,
    Precio               decimal(8,2) NOT NULL,
    Costo                decimal(8,2) NOT NULL CONSTRAINT DF_PRODUCTO_COS DEFAULT 0,
    Marca                varchar(50)  NULL,
    Tipo_Producto        char(1)      NOT NULL CONSTRAINT DF_PRODUCTO_TIPO DEFAULT 'P', -- P=Preparado B=Bebida/Reventa I=Insumo
    Tiempo_Preparacion   int          NULL,       -- minutos
    Controla_Stock       char(1)      NOT NULL CONSTRAINT DF_PRODUCTO_CTRL DEFAULT 'N',
    Stock_Actual         decimal(12,2) NOT NULL CONSTRAINT DF_PRODUCTO_STK DEFAULT 0,
    Stock_Minimo         decimal(12,2) NOT NULL CONSTRAINT DF_PRODUCTO_STKM DEFAULT 0,
    Afecto_IGV           char(1)      NOT NULL CONSTRAINT DF_PRODUCTO_IGV DEFAULT 'S',
    Disponible           char(1)      NOT NULL CONSTRAINT DF_PRODUCTO_DISP DEFAULT 'S',
    Imagen               varchar(200) NULL,
    USUCRE               varchar(30)  NOT NULL CONSTRAINT DF_PRODUCTO_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE                varchar(30)  NOT NULL CONSTRAINT DF_PRODUCTO_PCCRE  DEFAULT HOST_NAME(),
    FECCRE               datetime     NOT NULL CONSTRAINT DF_PRODUCTO_FECCRE DEFAULT GETDATE(),
    USUMOD               varchar(30)  NULL,
    PCMOD                varchar(30)  NULL,
    FECMOD               datetime     NULL,
    ESTADO               char(1)      NOT NULL CONSTRAINT DF_PRODUCTO_ESTADO DEFAULT 'A',
    CONSTRAINT PK_PRODUCTO PRIMARY KEY (ID_Producto),
    CONSTRAINT FK_PRODUCTO_CATEGORIA FOREIGN KEY (ID_CategoriaProducto) REFERENCES CATEGORIA_PRODUCTO(ID_CategoriaProducto),
    CONSTRAINT FK_PRODUCTO_UNIDAD    FOREIGN KEY (ID_Unidad) REFERENCES UNIDAD_MEDIDA(ID_Unidad),
    CONSTRAINT UQ_PRODUCTO_COD UNIQUE (Codigo),
    CONSTRAINT CK_PRODUCTO_TIPO CHECK (Tipo_Producto IN ('P','B','I')),
    CONSTRAINT CK_PRODUCTO_PRE  CHECK (Precio >= 0),
    CONSTRAINT CK_PRODUCTO_EST  CHECK (ESTADO IN ('A','I','E'))
);
GO

/* ==================================================================================
   MÓDULO 07 : PEDIDOS / COMANDAS   (ADAPTADO DE RECEPCION)
   ================================================================================== */

CREATE TABLE TIPO_PEDIDO(
    ID_TipoPedido     int IDENTITY(1,1) NOT NULL,
    N_TipoPedido      varchar(30)  NOT NULL,      -- EN SALON / PARA LLEVAR / DELIVERY
    Abreviatura       varchar(10)  NOT NULL,
    Requiere_Mesa     char(1)      NOT NULL CONSTRAINT DF_TIPOPED_MESA DEFAULT 'N',
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_TIPOPED_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_TIPOPED_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_TIPOPED_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_TIPOPED_ESTADO DEFAULT 'A',
    CONSTRAINT PK_TIPO_PEDIDO PRIMARY KEY (ID_TipoPedido),
    CONSTRAINT UQ_TIPO_PEDIDO UNIQUE (N_TipoPedido),
    CONSTRAINT CK_TIPOPED_MESA CHECK (Requiere_Mesa IN ('S','N')),
    CONSTRAINT CK_TIPOPED_EST  CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE ESTADO_PEDIDO(
    ID_EstadoPedido   int IDENTITY(1,1) NOT NULL,
    Descripcion       varchar(50)  NOT NULL,      -- ABIERTO, EN PREPARACION, SERVIDO, FACTURADO, ANULADO
    Orden             int          NOT NULL CONSTRAINT DF_ESTPED_ORD DEFAULT 0,
    Color             varchar(10)  NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_ESTPED_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_ESTPED_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_ESTPED_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_ESTPED_ESTADO DEFAULT 'A',
    CONSTRAINT PK_ESTADO_PEDIDO PRIMARY KEY (ID_EstadoPedido),
    CONSTRAINT UQ_ESTADO_PEDIDO UNIQUE (Descripcion),
    CONSTRAINT CK_ESTPED_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

/* PEDIDO = cabecera de la comanda. Equivale a RECEPCION en el modelo hotel. */
CREATE TABLE PEDIDO(
    ID_Pedido         int IDENTITY(1,1) NOT NULL,
    Numero_Pedido     varchar(15)  NOT NULL,
    ID_Cliente        int          NULL,          -- NULL = consumidor final / venta rápida
    ID_Mesa           int          NULL,          -- NULL en delivery y para llevar
    ID_TipoPedido     int          NOT NULL,
    ID_EstadoPedido   int          NOT NULL,
    ID_Usuario        int          NOT NULL,      -- usuario que registra la comanda
    ID_Empleado       int          NULL,          -- mozo responsable de la atención
    F_Pedido          datetime     NOT NULL CONSTRAINT DF_PEDIDO_FPED DEFAULT GETDATE(),
    F_Cierre          datetime     NULL,
    N_Comensales      int          NOT NULL CONSTRAINT DF_PEDIDO_NCOM DEFAULT 1,
    SubTotal          decimal(12,2) NOT NULL CONSTRAINT DF_PEDIDO_SUB DEFAULT 0,
    Descuento         decimal(12,2) NOT NULL CONSTRAINT DF_PEDIDO_DES DEFAULT 0,
    Servicio          decimal(12,2) NOT NULL CONSTRAINT DF_PEDIDO_SER DEFAULT 0,
    IGV               decimal(12,2) NOT NULL CONSTRAINT DF_PEDIDO_IGV DEFAULT 0,
    Total             decimal(12,2) NOT NULL CONSTRAINT DF_PEDIDO_TOT DEFAULT 0,
    Facturado         char(1)      NOT NULL CONSTRAINT DF_PEDIDO_FAC DEFAULT 'N',
    Anulado           char(1)      NOT NULL CONSTRAINT DF_PEDIDO_ANU DEFAULT 'N',
    Motivo_Anulacion  varchar(200) NULL,
    Observacion       varchar(200) NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_PEDIDO_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_PEDIDO_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_PEDIDO_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_PEDIDO_ESTADO DEFAULT 'A',
    CONSTRAINT PK_PEDIDO PRIMARY KEY (ID_Pedido),
    CONSTRAINT FK_PEDIDO_CLIENTE      FOREIGN KEY (ID_Cliente)      REFERENCES CLIENTE(ID_Cliente),
    CONSTRAINT FK_PEDIDO_MESA         FOREIGN KEY (ID_Mesa)         REFERENCES MESA(ID_Mesa),
    CONSTRAINT FK_PEDIDO_TIPOPEDIDO   FOREIGN KEY (ID_TipoPedido)   REFERENCES TIPO_PEDIDO(ID_TipoPedido),
    CONSTRAINT FK_PEDIDO_ESTADOPEDIDO FOREIGN KEY (ID_EstadoPedido) REFERENCES ESTADO_PEDIDO(ID_EstadoPedido),
    CONSTRAINT FK_PEDIDO_USUARIO      FOREIGN KEY (ID_Usuario)      REFERENCES USUARIO(ID_Usuario),
    CONSTRAINT FK_PEDIDO_EMPLEADO     FOREIGN KEY (ID_Empleado)     REFERENCES EMPLEADO(ID_Empleado),
    CONSTRAINT UQ_PEDIDO_NUM UNIQUE (Numero_Pedido),
    CONSTRAINT CK_PEDIDO_FAC CHECK (Facturado IN ('S','N')),
    CONSTRAINT CK_PEDIDO_ANU CHECK (Anulado   IN ('S','N')),
    CONSTRAINT CK_PEDIDO_TOT CHECK (Total >= 0),
    CONSTRAINT CK_PEDIDO_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE DETALLE_PEDIDO(
    ID_DetallePedido  int IDENTITY(1,1) NOT NULL,
    ID_Pedido         int          NOT NULL,
    ID_Producto       int          NOT NULL,
    Cantidad          decimal(10,2) NOT NULL,
    Precio_Unitario   decimal(10,2) NOT NULL,
    Descuento         decimal(10,2) NOT NULL CONSTRAINT DF_DETPED_DES DEFAULT 0,
    Sub_Total         AS (CONVERT(decimal(12,2), (Cantidad * Precio_Unitario) - Descuento)) PERSISTED,
    Nota_Cocina       varchar(150) NULL,          -- "sin ají", "término medio"
    Estado_Preparacion char(1)     NOT NULL CONSTRAINT DF_DETPED_PREP DEFAULT 'P', -- P=Pendiente E=En proceso S=Servido A=Anulado
    Es_Cortesia       char(1)      NOT NULL CONSTRAINT DF_DETPED_COR DEFAULT 'N',
    F_Solicitud       datetime     NOT NULL CONSTRAINT DF_DETPED_FSOL DEFAULT GETDATE(),
    F_Atencion        datetime     NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_DETPED_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_DETPED_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_DETPED_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_DETPED_ESTADO DEFAULT 'A',
    CONSTRAINT PK_DETALLE_PEDIDO PRIMARY KEY (ID_DetallePedido),
    CONSTRAINT FK_DETPEDIDO_PEDIDO   FOREIGN KEY (ID_Pedido)   REFERENCES PEDIDO(ID_Pedido),
    CONSTRAINT FK_DETPEDIDO_PRODUCTO FOREIGN KEY (ID_Producto) REFERENCES PRODUCTO(ID_Producto),
    CONSTRAINT CK_DETPED_CAN  CHECK (Cantidad > 0),
    CONSTRAINT CK_DETPED_PREP CHECK (Estado_Preparacion IN ('P','E','S','A')),
    CONSTRAINT CK_DETPED_COR  CHECK (Es_Cortesia IN ('S','N')),
    CONSTRAINT CK_DETPED_EST  CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE PEDIDO_DELIVERY(
    ID_PedidoDelivery int IDENTITY(1,1) NOT NULL,
    ID_Pedido         int          NOT NULL,
    ID_Distrito       int          NULL,
    ID_Empleado       int          NULL,          -- repartidor
    Direccion_Entrega varchar(150) NOT NULL,
    Referencia        varchar(150) NULL,
    Telefono_Contacto char(9)      NULL,
    Costo_Envio       decimal(10,2) NOT NULL CONSTRAINT DF_PEDDEL_COS DEFAULT 0,
    F_Salida          datetime     NULL,
    F_Entrega         datetime     NULL,
    Situacion         char(1)      NOT NULL CONSTRAINT DF_PEDDEL_SIT DEFAULT 'P', -- P=Pendiente R=En ruta E=Entregado C=Cancelado
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_PEDDEL_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_PEDDEL_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_PEDDEL_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_PEDDEL_ESTADO DEFAULT 'A',
    CONSTRAINT PK_PEDIDO_DELIVERY PRIMARY KEY (ID_PedidoDelivery),
    CONSTRAINT FK_PEDDELIVERY_PEDIDO   FOREIGN KEY (ID_Pedido)   REFERENCES PEDIDO(ID_Pedido),
    CONSTRAINT FK_PEDDELIVERY_DISTRITO FOREIGN KEY (ID_Distrito) REFERENCES DISTRITO(ID_Distrito),
    CONSTRAINT FK_PEDDELIVERY_EMPLEADO FOREIGN KEY (ID_Empleado) REFERENCES EMPLEADO(ID_Empleado),
    CONSTRAINT UQ_PEDIDO_DELIVERY UNIQUE (ID_Pedido),
    CONSTRAINT CK_PEDDEL_SIT CHECK (Situacion IN ('P','R','E','C')),
    CONSTRAINT CK_PEDDEL_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE RESERVA(
    ID_Reserva        int IDENTITY(1,1) NOT NULL,
    ID_Cliente        int          NOT NULL,
    ID_Mesa           int          NULL,
    ID_Usuario        int          NOT NULL,
    F_Reserva         datetime     NOT NULL,      -- fecha y hora reservada
    N_Personas        int          NOT NULL CONSTRAINT DF_RESERVA_NPER DEFAULT 2,
    Adelanto          decimal(10,2) NOT NULL CONSTRAINT DF_RESERVA_ADE DEFAULT 0,
    Situacion         char(1)      NOT NULL CONSTRAINT DF_RESERVA_SIT DEFAULT 'P', -- P=Pendiente C=Confirmada A=Atendida X=Cancelada
    Observacion       varchar(200) NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_RESERVA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_RESERVA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_RESERVA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_RESERVA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_RESERVA PRIMARY KEY (ID_Reserva),
    CONSTRAINT FK_RESERVA_CLIENTE FOREIGN KEY (ID_Cliente) REFERENCES CLIENTE(ID_Cliente),
    CONSTRAINT FK_RESERVA_MESA    FOREIGN KEY (ID_Mesa)    REFERENCES MESA(ID_Mesa),
    CONSTRAINT FK_RESERVA_USUARIO FOREIGN KEY (ID_Usuario) REFERENCES USUARIO(ID_Usuario),
    CONSTRAINT CK_RESERVA_SIT CHECK (Situacion IN ('P','C','A','X')),
    CONSTRAINT CK_RESERVA_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

/* ==================================================================================
   MÓDULO 08 : CAJA  (se mantiene íntegro del modelo hotel)
   ================================================================================== */

CREATE TABLE METODO_PAGO(
    ID_MetodoPago     int IDENTITY(1,1) NOT NULL,
    N_MetodoPago      varchar(30)  NOT NULL,      -- EFECTIVO, VISA, YAPE, PLIN, TRANSFERENCIA
    Afecta_Efectivo   char(1)      NOT NULL CONSTRAINT DF_METPAG_AFE DEFAULT 'N',
    Requiere_Referencia char(1)    NOT NULL CONSTRAINT DF_METPAG_REF DEFAULT 'N',
    Comision          decimal(5,2) NOT NULL CONSTRAINT DF_METPAG_COM DEFAULT 0,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_METPAG_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_METPAG_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_METPAG_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_METPAG_ESTADO DEFAULT 'A',
    CONSTRAINT PK_METODO_PAGO PRIMARY KEY (ID_MetodoPago),
    CONSTRAINT UQ_METODO_PAGO UNIQUE (N_MetodoPago),
    CONSTRAINT CK_METPAG_AFE CHECK (Afecta_Efectivo IN ('S','N')),
    CONSTRAINT CK_METPAG_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE CAJA(
    ID_Caja           int IDENTITY(1,1) NOT NULL,
    N_Caja            varchar(50)  NOT NULL,
    Descripcion       varchar(100) NULL,
    Ubicacion         varchar(100) NULL,
    Serie_Terminal    varchar(30)  NULL,
    Moneda            char(3)      NOT NULL CONSTRAINT DF_CAJA_MON DEFAULT 'PEN',
    Monto_Base        decimal(12,2) NOT NULL CONSTRAINT DF_CAJA_BASE DEFAULT 0,
    Aperturada        char(1)      NOT NULL CONSTRAINT DF_CAJA_APE DEFAULT 'N',
    F_Creacion        datetime     NOT NULL CONSTRAINT DF_CAJA_FCREA DEFAULT GETDATE(),
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_CAJA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_CAJA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_CAJA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_CAJA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_CAJA PRIMARY KEY (ID_Caja),
    CONSTRAINT UQ_CAJA UNIQUE (N_Caja),
    CONSTRAINT CK_CAJA_APE CHECK (Aperturada IN ('S','N')),
    CONSTRAINT CK_CAJA_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE APERTURA_CAJA(
    ID_AperturaCaja   int IDENTITY(1,1) NOT NULL,
    ID_Caja           int          NOT NULL,
    ID_Usuario        int          NOT NULL,      -- usuario que apertura
    ID_UsuarioCierre  int          NULL,          -- usuario que cierra
    Numero_Turno      varchar(20)  NOT NULL,
    F_Apertura        datetime     NOT NULL CONSTRAINT DF_APECAJA_FAPE DEFAULT GETDATE(),
    F_Cierre          datetime     NULL,
    Monto_Inicial     decimal(12,2) NOT NULL CONSTRAINT DF_APECAJA_MINI DEFAULT 0,
    Total_Ingresos    decimal(12,2) NOT NULL CONSTRAINT DF_APECAJA_TING DEFAULT 0,
    Total_Egresos     decimal(12,2) NOT NULL CONSTRAINT DF_APECAJA_TEGR DEFAULT 0,
    Monto_Sistema     decimal(12,2) NOT NULL CONSTRAINT DF_APECAJA_MSIS DEFAULT 0,
    Monto_Declarado   decimal(12,2) NOT NULL CONSTRAINT DF_APECAJA_MDEC DEFAULT 0,
    Diferencia        decimal(12,2) NOT NULL CONSTRAINT DF_APECAJA_DIF  DEFAULT 0,
    Situacion         char(1)      NOT NULL CONSTRAINT DF_APECAJA_SIT DEFAULT 'A', -- A=Abierta C=Cerrada
    Observacion       varchar(200) NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_APECAJA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_APECAJA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_APECAJA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_APECAJA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_APERTURA_CAJA PRIMARY KEY (ID_AperturaCaja),
    CONSTRAINT FK_APERTURACAJA_CAJA     FOREIGN KEY (ID_Caja)          REFERENCES CAJA(ID_Caja),
    CONSTRAINT FK_APERTURACAJA_USUARIO  FOREIGN KEY (ID_Usuario)       REFERENCES USUARIO(ID_Usuario),
    CONSTRAINT FK_APERTURACAJA_USUCIERRE FOREIGN KEY (ID_UsuarioCierre) REFERENCES USUARIO(ID_Usuario),
    CONSTRAINT CK_APECAJA_SIT CHECK (Situacion IN ('A','C')),
    CONSTRAINT CK_APECAJA_EST CHECK (ESTADO IN ('A','I','E'))
);
GO
/* Regla: una sola apertura ABIERTA por caja */
CREATE UNIQUE INDEX UQ_APERTURA_CAJA_ABIERTA
    ON APERTURA_CAJA(ID_Caja) WHERE Situacion = 'A';
GO

CREATE TABLE TIPO_MOVIMIENTO_CAJA(
    ID_TipoMovimiento int IDENTITY(1,1) NOT NULL,
    N_TipoMovimiento  varchar(30)  NOT NULL,      -- INGRESO / EGRESO
    Abreviatura       varchar(10)  NOT NULL,
    Signo             char(1)      NOT NULL,      -- + / -
    F_Creacion        datetime     NOT NULL CONSTRAINT DF_TIPMOV_FCREA DEFAULT GETDATE(),
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_TIPMOV_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_TIPMOV_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_TIPMOV_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_TIPMOV_ESTADO DEFAULT 'A',
    CONSTRAINT PK_TIPO_MOVIMIENTO_CAJA PRIMARY KEY (ID_TipoMovimiento),
    CONSTRAINT UQ_TIPO_MOVIMIENTO_CAJA UNIQUE (N_TipoMovimiento),
    CONSTRAINT CK_TIPMOV_SIG CHECK (Signo IN ('+','-')),
    CONSTRAINT CK_TIPMOV_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE CONCEPTO_CAJA(
    ID_Concepto       int IDENTITY(1,1) NOT NULL,
    ID_TipoMovimiento int          NOT NULL,
    N_Concepto        varchar(60)  NOT NULL,      -- Venta contado, Compra de insumos, Propina, Vuelto...
    Descripcion       varchar(150) NULL,
    Afecta_Efectivo   char(1)      NOT NULL CONSTRAINT DF_CONCAJA_AFE DEFAULT 'S',
    F_Creacion        datetime     NOT NULL CONSTRAINT DF_CONCAJA_FCREA DEFAULT GETDATE(),
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_CONCAJA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_CONCAJA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_CONCAJA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_CONCAJA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_CONCEPTO_CAJA PRIMARY KEY (ID_Concepto),
    CONSTRAINT FK_CONCEPTOCAJA_TIPOMOV FOREIGN KEY (ID_TipoMovimiento) REFERENCES TIPO_MOVIMIENTO_CAJA(ID_TipoMovimiento),
    CONSTRAINT UQ_CONCEPTO_CAJA UNIQUE (N_Concepto),
    CONSTRAINT CK_CONCAJA_AFE CHECK (Afecta_Efectivo IN ('S','N')),
    CONSTRAINT CK_CONCAJA_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

/* ==================================================================================
   MÓDULO 09 : FACTURACIÓN - VENTA, BOLETA, FACTURA, PAGOS
   ================================================================================== */

CREATE TABLE SERIE_DOCUMENTO(
    ID_Serie          int IDENTITY(1,1) NOT NULL,
    ID_Caja           int          NULL,
    Tipo_Documento    char(2)      NOT NULL,      -- 03=Boleta 01=Factura 07=Nota de crédito TK=Ticket interno
    Serie             char(4)      NOT NULL,      -- B001 / F001 / NC01
    Correlativo       int          NOT NULL CONSTRAINT DF_SERIEDOC_COR DEFAULT 0,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_SERIEDOC_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_SERIEDOC_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_SERIEDOC_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_SERIEDOC_ESTADO DEFAULT 'A',
    CONSTRAINT PK_SERIE_DOCUMENTO PRIMARY KEY (ID_Serie),
    CONSTRAINT FK_SERIEDOC_CAJA FOREIGN KEY (ID_Caja) REFERENCES CAJA(ID_Caja),
    CONSTRAINT UQ_SERIE_DOCUMENTO UNIQUE (Tipo_Documento, Serie),
    CONSTRAINT CK_SERIEDOC_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE VENTA(
    ID_Venta          int IDENTITY(1,1) NOT NULL,
    ID_Pedido         int          NOT NULL,
    ID_Cliente        int          NULL,
    ID_Usuario        int          NOT NULL,      -- cajero
    ID_AperturaCaja   int          NOT NULL,      -- turno de caja al que pertenece
    F_Venta           datetime     NOT NULL CONSTRAINT DF_VENTA_FVEN DEFAULT GETDATE(),
    TipoDocumento     char(2)      NOT NULL,      -- 03=Boleta 01=Factura TK=Ticket
    SubTotal          decimal(12,2) NOT NULL CONSTRAINT DF_VENTA_SUB DEFAULT 0,
    Descuento         decimal(12,2) NOT NULL CONSTRAINT DF_VENTA_DES DEFAULT 0,
    Servicio          decimal(12,2) NOT NULL CONSTRAINT DF_VENTA_SER DEFAULT 0,
    IGV               decimal(12,2) NOT NULL CONSTRAINT DF_VENTA_IGV DEFAULT 0,
    Total             decimal(12,2) NOT NULL CONSTRAINT DF_VENTA_TOT DEFAULT 0,
    Total_Pagado      decimal(12,2) NOT NULL CONSTRAINT DF_VENTA_PAG DEFAULT 0,
    Vuelto            decimal(12,2) NOT NULL CONSTRAINT DF_VENTA_VUE DEFAULT 0,
    Anulada           char(1)      NOT NULL CONSTRAINT DF_VENTA_ANU DEFAULT 'N',
    Motivo_Anulacion  varchar(200) NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_VENTA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_VENTA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_VENTA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_VENTA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_VENTA PRIMARY KEY (ID_Venta),
    CONSTRAINT FK_VENTA_PEDIDO   FOREIGN KEY (ID_Pedido)   REFERENCES PEDIDO(ID_Pedido),
    CONSTRAINT FK_VENTA_CLIENTE  FOREIGN KEY (ID_Cliente)  REFERENCES CLIENTE(ID_Cliente),
    CONSTRAINT FK_VENTA_USUARIO  FOREIGN KEY (ID_Usuario)  REFERENCES USUARIO(ID_Usuario),
    CONSTRAINT FK_VENTA_APERTURA FOREIGN KEY (ID_AperturaCaja) REFERENCES APERTURA_CAJA(ID_AperturaCaja),
    CONSTRAINT CK_VENTA_TDOC CHECK (TipoDocumento IN ('01','03','TK')),
    CONSTRAINT CK_VENTA_ANU  CHECK (Anulada IN ('S','N')),
    CONSTRAINT CK_VENTA_EST  CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE DETALLE_VENTA(
    ID_Detalle        int IDENTITY(1,1) NOT NULL,
    ID_Venta          int          NOT NULL,
    ID_Producto       int          NOT NULL,
    Cantidad          decimal(10,2) NOT NULL,
    Precio            decimal(10,2) NOT NULL,
    Descuento         decimal(10,2) NOT NULL CONSTRAINT DF_DETVEN_DES DEFAULT 0,
    Sub_Total         AS (CONVERT(decimal(12,2), (Cantidad * Precio) - Descuento)) PERSISTED,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_DETVEN_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_DETVEN_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_DETVEN_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_DETVEN_ESTADO DEFAULT 'A',
    CONSTRAINT PK_DETALLE_VENTA PRIMARY KEY (ID_Detalle),
    CONSTRAINT FK_DETVENTA_VENTA    FOREIGN KEY (ID_Venta)    REFERENCES VENTA(ID_Venta),
    CONSTRAINT FK_DETVENTA_PRODUCTO FOREIGN KEY (ID_Producto) REFERENCES PRODUCTO(ID_Producto),
    CONSTRAINT CK_DETVEN_CAN CHECK (Cantidad > 0),
    CONSTRAINT CK_DETVEN_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE BOLETA(
    ID_Boleta         int IDENTITY(1,1) NOT NULL,
    ID_Venta          int          NOT NULL,
    Serie             char(4)      NOT NULL,
    Numero            char(8)      NOT NULL,
    F_Emision         datetime     NOT NULL CONSTRAINT DF_BOLETA_FEMI DEFAULT GETDATE(),
    Cliente_Documento varchar(15)  NULL,          -- DNI del cliente al momento de emitir
    Cliente_Nombre    varchar(200) NULL,
    Hash_CPE          varchar(100) NULL,          -- facturación electrónica
    Estado_SUNAT      varchar(20)  NULL,          -- PENDIENTE / ACEPTADO / RECHAZADO
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_BOLETA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_BOLETA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_BOLETA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_BOLETA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_BOLETA PRIMARY KEY (ID_Boleta),
    CONSTRAINT FK_BOLETA_VENTA FOREIGN KEY (ID_Venta) REFERENCES VENTA(ID_Venta),
    CONSTRAINT UQ_BOLETA_VENTA UNIQUE (ID_Venta),
    CONSTRAINT UQ_BOLETA_NUM   UNIQUE (Serie, Numero),
    CONSTRAINT CK_BOLETA_EST   CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE FACTURA(
    ID_Factura        int IDENTITY(1,1) NOT NULL,
    ID_Venta          int          NOT NULL,
    ID_Empresa        int          NOT NULL,      -- receptor con RUC
    Serie             char(4)      NOT NULL,
    Numero            char(8)      NOT NULL,
    F_Emision         datetime     NOT NULL CONSTRAINT DF_FACTURA_FEMI DEFAULT GETDATE(),
    F_Vencimiento     date         NULL,
    Condicion_Pago    varchar(20)  NOT NULL CONSTRAINT DF_FACTURA_CPAG DEFAULT 'CONTADO',
    Orden_Compra      varchar(30)  NULL,
    Hash_CPE          varchar(100) NULL,
    Estado_SUNAT      varchar(20)  NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_FACTURA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_FACTURA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_FACTURA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_FACTURA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_FACTURA PRIMARY KEY (ID_Factura),
    CONSTRAINT FK_FACTURA_VENTA   FOREIGN KEY (ID_Venta)   REFERENCES VENTA(ID_Venta),
    CONSTRAINT FK_FACTURA_EMPRESA FOREIGN KEY (ID_Empresa) REFERENCES EMPRESA(ID_Empresa),
    CONSTRAINT UQ_FACTURA_VENTA UNIQUE (ID_Venta),
    CONSTRAINT UQ_FACTURA_NUM   UNIQUE (Serie, Numero),
    CONSTRAINT CK_FACTURA_EST   CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE NOTA_CREDITO(
    ID_NotaCredito    int IDENTITY(1,1) NOT NULL,
    ID_Venta          int          NOT NULL,
    Serie             char(4)      NOT NULL,
    Numero            char(8)      NOT NULL,
    Tipo_Doc_Referencia char(2)    NOT NULL,      -- 01 / 03
    Serie_Referencia  char(4)      NOT NULL,
    Numero_Referencia char(8)      NOT NULL,
    Motivo            varchar(200) NOT NULL,
    Monto             decimal(12,2) NOT NULL,
    F_Emision         datetime     NOT NULL CONSTRAINT DF_NOTACRE_FEMI DEFAULT GETDATE(),
    Estado_SUNAT      varchar(20)  NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_NOTACRE_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_NOTACRE_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_NOTACRE_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_NOTACRE_ESTADO DEFAULT 'A',
    CONSTRAINT PK_NOTA_CREDITO PRIMARY KEY (ID_NotaCredito),
    CONSTRAINT FK_NOTACREDITO_VENTA FOREIGN KEY (ID_Venta) REFERENCES VENTA(ID_Venta),
    CONSTRAINT UQ_NOTA_CREDITO UNIQUE (Serie, Numero),
    CONSTRAINT CK_NOTACRE_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

/* PAGO_VENTA permite pago mixto: parte efectivo, parte tarjeta, parte Yape. */
CREATE TABLE PAGO_VENTA(
    ID_Pago           int IDENTITY(1,1) NOT NULL,
    ID_Venta          int          NOT NULL,
    ID_MetodoPago     int          NOT NULL,
    Monto             decimal(12,2) NOT NULL,
    Referencia        varchar(50)  NULL,          -- N° operación / voucher
    Ultimos_Digitos   char(4)      NULL,
    F_Pago            datetime     NOT NULL CONSTRAINT DF_PAGVEN_FPAG DEFAULT GETDATE(),
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_PAGVEN_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_PAGVEN_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_PAGVEN_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_PAGVEN_ESTADO DEFAULT 'A',
    CONSTRAINT PK_PAGO_VENTA PRIMARY KEY (ID_Pago),
    CONSTRAINT FK_PAGOVENTA_VENTA  FOREIGN KEY (ID_Venta)      REFERENCES VENTA(ID_Venta),
    CONSTRAINT FK_PAGOVENTA_METODO FOREIGN KEY (ID_MetodoPago) REFERENCES METODO_PAGO(ID_MetodoPago),
    CONSTRAINT CK_PAGVEN_MON CHECK (Monto > 0),
    CONSTRAINT CK_PAGVEN_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

/* MOVIMIENTO_CAJA se crea al final porque referencia PEDIDO y VENTA */
CREATE TABLE MOVIMIENTO_CAJA(
    ID_MovimientoCaja int IDENTITY(1,1) NOT NULL,
    ID_AperturaCaja   int          NOT NULL,
    ID_TipoMovimiento int          NOT NULL,
    ID_Concepto       int          NOT NULL,
    ID_MetodoPago     int          NOT NULL,
    ID_Usuario        int          NOT NULL,
    ID_Pedido         int          NULL,
    ID_Venta          int          NULL,
    Numero_Operacion  varchar(30)  NULL,
    Documento         varchar(200) NULL,
    Descripcion       varchar(200) NULL,
    Monto             decimal(12,2) NOT NULL,
    Afecta_Efectivo   char(1)      NOT NULL CONSTRAINT DF_MOVCAJA_AFE DEFAULT 'S',
    F_Movimiento      datetime     NOT NULL CONSTRAINT DF_MOVCAJA_FMOV DEFAULT GETDATE(),
    IP                varchar(20)  NULL,
    Terminal          varchar(30)  NULL CONSTRAINT DF_MOVCAJA_TERM DEFAULT HOST_NAME(),
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_MOVCAJA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_MOVCAJA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_MOVCAJA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_MOVCAJA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_MOVIMIENTO_CAJA PRIMARY KEY (ID_MovimientoCaja),
    CONSTRAINT FK_MOVCAJA_APERTURA FOREIGN KEY (ID_AperturaCaja)   REFERENCES APERTURA_CAJA(ID_AperturaCaja),
    CONSTRAINT FK_MOVCAJA_TIPOMOV  FOREIGN KEY (ID_TipoMovimiento) REFERENCES TIPO_MOVIMIENTO_CAJA(ID_TipoMovimiento),
    CONSTRAINT FK_MOVCAJA_CONCEPTO FOREIGN KEY (ID_Concepto)       REFERENCES CONCEPTO_CAJA(ID_Concepto),
    CONSTRAINT FK_MOVCAJA_METODO   FOREIGN KEY (ID_MetodoPago)     REFERENCES METODO_PAGO(ID_MetodoPago),
    CONSTRAINT FK_MOVCAJA_USUARIO  FOREIGN KEY (ID_Usuario)        REFERENCES USUARIO(ID_Usuario),
    CONSTRAINT FK_MOVCAJA_PEDIDO   FOREIGN KEY (ID_Pedido)         REFERENCES PEDIDO(ID_Pedido),
    CONSTRAINT FK_MOVCAJA_VENTA    FOREIGN KEY (ID_Venta)          REFERENCES VENTA(ID_Venta),
    CONSTRAINT CK_MOVCAJA_MON CHECK (Monto > 0),
    CONSTRAINT CK_MOVCAJA_AFE CHECK (Afecta_Efectivo IN ('S','N')),
    CONSTRAINT CK_MOVCAJA_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

/* ==================================================================================
   MÓDULO 10 : INVENTARIO DE INSUMOS  (OPCIONAL - habilita descarga por receta)
   ================================================================================== */

CREATE TABLE RECETA(
    ID_Receta         int IDENTITY(1,1) NOT NULL,
    ID_Producto       int          NOT NULL,      -- plato preparado
    ID_Insumo         int          NOT NULL,      -- producto tipo 'I'
    Cantidad          decimal(10,3) NOT NULL,
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_RECETA_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_RECETA_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_RECETA_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_RECETA_ESTADO DEFAULT 'A',
    CONSTRAINT PK_RECETA PRIMARY KEY (ID_Receta),
    CONSTRAINT FK_RECETA_PRODUCTO FOREIGN KEY (ID_Producto) REFERENCES PRODUCTO(ID_Producto),
    CONSTRAINT FK_RECETA_INSUMO   FOREIGN KEY (ID_Insumo)   REFERENCES PRODUCTO(ID_Producto),
    CONSTRAINT UQ_RECETA UNIQUE (ID_Producto, ID_Insumo),
    CONSTRAINT CK_RECETA_CAN CHECK (Cantidad > 0),
    CONSTRAINT CK_RECETA_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

CREATE TABLE MOVIMIENTO_INVENTARIO(
    ID_MovimientoInv  bigint IDENTITY(1,1) NOT NULL,
    ID_Producto       int          NOT NULL,
    ID_Usuario        int          NOT NULL,
    ID_Pedido         int          NULL,
    Tipo_Movimiento   char(1)      NOT NULL,      -- E=Entrada S=Salida A=Ajuste M=Merma
    Cantidad          decimal(12,3) NOT NULL,
    Stock_Anterior    decimal(12,3) NOT NULL,
    Stock_Nuevo       decimal(12,3) NOT NULL,
    Costo_Unitario    decimal(10,2) NOT NULL CONSTRAINT DF_MOVINV_COS DEFAULT 0,
    Documento         varchar(50)  NULL,
    Observacion       varchar(200) NULL,
    F_Movimiento      datetime     NOT NULL CONSTRAINT DF_MOVINV_FMOV DEFAULT GETDATE(),
    USUCRE            varchar(30)  NOT NULL CONSTRAINT DF_MOVINV_USUCRE DEFAULT SUSER_SNAME(),
    PCCRE             varchar(30)  NOT NULL CONSTRAINT DF_MOVINV_PCCRE  DEFAULT HOST_NAME(),
    FECCRE            datetime     NOT NULL CONSTRAINT DF_MOVINV_FECCRE DEFAULT GETDATE(),
    USUMOD            varchar(30)  NULL,
    PCMOD             varchar(30)  NULL,
    FECMOD            datetime     NULL,
    ESTADO            char(1)      NOT NULL CONSTRAINT DF_MOVINV_ESTADO DEFAULT 'A',
    CONSTRAINT PK_MOVIMIENTO_INVENTARIO PRIMARY KEY (ID_MovimientoInv),
    CONSTRAINT FK_MOVINV_PRODUCTO FOREIGN KEY (ID_Producto) REFERENCES PRODUCTO(ID_Producto),
    CONSTRAINT FK_MOVINV_USUARIO  FOREIGN KEY (ID_Usuario)  REFERENCES USUARIO(ID_Usuario),
    CONSTRAINT FK_MOVINV_PEDIDO   FOREIGN KEY (ID_Pedido)   REFERENCES PEDIDO(ID_Pedido),
    CONSTRAINT CK_MOVINV_TIP CHECK (Tipo_Movimiento IN ('E','S','A','M')),
    CONSTRAINT CK_MOVINV_EST CHECK (ESTADO IN ('A','I','E'))
);
GO

/* ==================================================================================
   ÍNDICES DE APOYO AL RENDIMIENTO
   ================================================================================== */
CREATE INDEX IX_PERSONA_DOC        ON PERSONA(N_Documento);
CREATE INDEX IX_PERSONA_APE        ON PERSONA(Ap_Paterno, Ap_Materno, Nombre);
CREATE INDEX IX_PRODUCTO_CAT       ON PRODUCTO(ID_CategoriaProducto) INCLUDE (N_Producto, Precio, Disponible);
CREATE INDEX IX_PEDIDO_FECHA       ON PEDIDO(F_Pedido) INCLUDE (Total, ID_EstadoPedido);
CREATE INDEX IX_PEDIDO_MESA        ON PEDIDO(ID_Mesa, ID_EstadoPedido);
CREATE INDEX IX_DETPEDIDO_PEDIDO   ON DETALLE_PEDIDO(ID_Pedido) INCLUDE (ID_Producto, Cantidad);
CREATE INDEX IX_VENTA_FECHA        ON VENTA(F_Venta) INCLUDE (Total, TipoDocumento, Anulada);
CREATE INDEX IX_VENTA_APERTURA     ON VENTA(ID_AperturaCaja);
CREATE INDEX IX_DETVENTA_PRODUCTO  ON DETALLE_VENTA(ID_Producto) INCLUDE (Cantidad, Precio);
CREATE INDEX IX_MOVCAJA_APERTURA   ON MOVIMIENTO_CAJA(ID_AperturaCaja) INCLUDE (Monto, ID_TipoMovimiento);
CREATE INDEX IX_AUDITORIA_TABLA    ON AUDITORIA(N_Tabla, F_Evento);
GO

/* ==================================================================================
   DATOS MAESTROS INICIALES
   ================================================================================== */

INSERT INTO DEPARTAMENTO(N_Departamento) VALUES ('ICA'),('LIMA');
INSERT INTO PROVINCIA(ID_Departamento, N_Provincia) VALUES (1,'ICA'),(1,'CHINCHA'),(1,'PISCO'),(2,'LIMA');
INSERT INTO DISTRITO(ID_Provincia, D_Distrito) VALUES
 (1,'ICA'),(1,'LA TINGUIÑA'),(1,'PARCONA'),(1,'SUBTANJALLA'),(1,'SAN JUAN BAUTISTA'),
 (2,'CHINCHA ALTA'),(3,'PISCO'),(4,'MIRAFLORES');

INSERT INTO TIPO_IDENTIDAD(N_TipoIdentidad, Abreviatura, Longitud, Codigo_SUNAT) VALUES
 ('DNI','DNI',8,'1'),('RUC','RUC',11,'6'),('CARNET EXTRANJERIA','CE',12,'4'),('PASAPORTE','PAS',12,'7');

INSERT INTO CARGO(N_Cargo, Area) VALUES
 ('ADMINISTRADOR','Administración'),('CAJERO','Caja'),('MOZO','Salón'),
 ('CHEF','Cocina'),('AYUDANTE DE COCINA','Cocina'),('BARMAN','Barra'),('REPARTIDOR','Delivery');

INSERT INTO CONTRATO(N_Contrato, Descripcion) VALUES
 ('PLAZO INDETERMINADO','Contrato a plazo indeterminado'),
 ('PLAZO FIJO','Contrato sujeto a modalidad'),
 ('PART TIME','Jornada parcial'),
 ('LOCACION DE SERVICIOS','Recibo por honorarios');

INSERT INTO TIPO_USUARIO(N_TipoUsuario) VALUES
 ('ADMINISTRADOR'),('CAJERO'),('MOZO'),('COCINA'),('SUPERVISOR');

INSERT INTO MODULO(N_Modulo, Descripcion, Icono, Orden) VALUES
 ('SEGURIDAD','Usuarios, roles y permisos','shield',1),
 ('MANTENIMIENTO','Catálogos maestros','database',2),
 ('CARTA','Categorías y productos','book',3),
 ('SALON','Ambientes, mesas y reservas','table',4),
 ('PEDIDOS','Comandas y despacho','clipboard',5),
 ('VENTAS','Facturación boleta/factura','receipt',6),
 ('CAJA','Apertura, movimientos y arqueo','cash',7),
 ('REPORTES','Reportes gerenciales','chart',8),
 ('AUDITORIA','Bitácora del sistema','history',9);

INSERT INTO ROL(N_Rol, Descripcion, Nivel) VALUES
 ('ADMINISTRADOR','Acceso total al sistema',1),
 ('SUPERVISOR','Supervisión de salón y caja',2),
 ('CAJERO','Facturación y manejo de caja',3),
 ('MOZO','Registro de comandas',4),
 ('COCINA','Despacho de pedidos',5);

INSERT INTO PERMISO(ID_Modulo, N_Permiso, Clave, Descripcion) VALUES
 (1,'Gestionar usuarios','SEG_USUARIO','Crear, editar y desactivar usuarios'),
 (1,'Asignar roles','SEG_ROL','Asignar roles y permisos'),
 (2,'Gestionar catálogos','MAN_CATALOGO','Mantenimiento de tablas maestras'),
 (3,'Gestionar carta','CAR_PRODUCTO','Alta y edición de productos y precios'),
 (4,'Gestionar mesas','SAL_MESA','Configurar ambientes y mesas'),
 (4,'Gestionar reservas','SAL_RESERVA','Registrar y confirmar reservas'),
 (5,'Registrar pedido','PED_REGISTRAR','Crear y modificar comandas'),
 (5,'Anular pedido','PED_ANULAR','Anular comandas registradas'),
 (5,'Aplicar descuento','PED_DESCUENTO','Aplicar descuentos y cortesías'),
 (6,'Emitir comprobante','VEN_EMITIR','Emitir boleta o factura'),
 (6,'Anular venta','VEN_ANULAR','Anular comprobantes y emitir nota de crédito'),
 (7,'Aperturar caja','CAJ_APERTURAR','Apertura de turno de caja'),
 (7,'Cerrar caja','CAJ_CERRAR','Cierre y arqueo de caja'),
 (7,'Registrar egreso','CAJ_EGRESO','Registrar salidas de efectivo'),
 (8,'Ver reportes','REP_VER','Consultar reportes gerenciales'),
 (9,'Ver auditoría','AUD_VER','Consultar la bitácora del sistema');

/* ADMINISTRADOR: todos los permisos */
INSERT INTO ROL_PERMISO(ID_Rol, ID_Permiso, Concedido)
SELECT 1, ID_Permiso, 'S' FROM PERMISO;
/* CAJERO */
INSERT INTO ROL_PERMISO(ID_Rol, ID_Permiso, Concedido)
SELECT 3, ID_Permiso, 'S' FROM PERMISO
WHERE Clave IN ('PED_REGISTRAR','VEN_EMITIR','CAJ_APERTURAR','CAJ_CERRAR','CAJ_EGRESO','REP_VER');
/* MOZO */
INSERT INTO ROL_PERMISO(ID_Rol, ID_Permiso, Concedido)
SELECT 4, ID_Permiso, 'S' FROM PERMISO
WHERE Clave IN ('PED_REGISTRAR','SAL_RESERVA');
/* COCINA */
INSERT INTO ROL_PERMISO(ID_Rol, ID_Permiso, Concedido)
SELECT 5, ID_Permiso, 'S' FROM PERMISO WHERE Clave IN ('PED_REGISTRAR');
GO

INSERT INTO AMBIENTE(N_Ambiente, Descripcion, Piso) VALUES
 ('SALON PRINCIPAL','Área central de atención',1),
 ('TERRAZA','Área al aire libre',1),
 ('BARRA','Atención en barra',1),
 ('SALA VIP','Ambiente privado para eventos',2);

INSERT INTO ESTADO_MESA(Descripcion, Color) VALUES
 ('LIBRE','#28A745'),('OCUPADA','#DC3545'),('RESERVADA','#FFC107'),
 ('POR COBRAR','#17A2B8'),('FUERA DE SERVICIO','#6C757D');

INSERT INTO TIPO_MESA(Descripcion, Cargo_Servicio) VALUES
 ('MESA ESTANDAR',0),('BOX',0),('BARRA',0),('MESA VIP',10);

INSERT INTO MESA(ID_EstadoMesa, ID_Ambiente, ID_TipoMesa, Numero, Capacidad, Detalle) VALUES
 (1,1,1,'01',4,'Mesa cuadrada'),(1,1,1,'02',4,'Mesa cuadrada'),
 (1,1,1,'03',6,'Mesa rectangular'),(1,1,2,'04',6,'Box junto a ventana'),
 (1,2,1,'T1',4,'Terraza'),(1,2,1,'T2',4,'Terraza'),
 (1,3,3,'B1',2,'Barra'),(1,4,4,'V1',10,'Sala VIP');

INSERT INTO UNIDAD_MEDIDA(N_Unidad, Abreviatura, Codigo_SUNAT) VALUES
 ('UNIDAD','UND','NIU'),('PORCION','POR','NIU'),('JARRA','JAR','NIU'),
 ('VASO','VAS','NIU'),('KILOGRAMO','KG','KGM'),('LITRO','LT','LTR'),('BOTELLA','BOT','NIU');

INSERT INTO CATEGORIA_PRODUCTO(N_CategoriaProducto, Descripcion, Area_Despacho, Orden_Carta) VALUES
 ('ENTRADAS','Piqueos y entradas frías o calientes','COCINA',1),
 ('PLATOS DE FONDO','Platos principales de la carta','COCINA',2),
 ('CRIOLLOS','Comida criolla peruana','COCINA',3),
 ('MARINOS','Cebiches y platos marinos','COCINA',4),
 ('BEBIDAS FRIAS','Gaseosas, jugos y refrescos','BARRA',5),
 ('BEBIDAS CALIENTES','Café, té e infusiones','BARRA',6),
 ('LICORES','Cervezas, piscos y cócteles','BARRA',7),
 ('POSTRES','Dulces y postres','COCINA',8),
 ('INSUMOS','Insumos de almacén (no se venden)','COCINA',99);

INSERT INTO PRODUCTO(ID_CategoriaProducto, ID_Unidad, Codigo, N_Producto, Detalle, Precio, Costo, Tipo_Producto, Tiempo_Preparacion) VALUES
 (1,2,'ENT001','Papa a la Huancaína','Porción con salsa huancaína y huevo',14.00,5.00,'P',10),
 (1,2,'ENT002','Causa Limeña','Causa rellena de pollo',16.00,6.00,'P',12),
 (2,2,'PLF001','Lomo Saltado','Lomo de res con papas fritas y arroz',38.00,15.00,'P',20),
 (2,2,'PLF002','Arroz Chaufa de Pollo','Arroz chaufa estilo criollo',28.00,10.00,'P',18),
 (3,2,'CRI001','Ají de Gallina','Con arroz blanco y papa',30.00,11.00,'P',18),
 (3,2,'CRI002','Seco de Res','Con frejoles y arroz',34.00,13.00,'P',25),
 (4,2,'MAR001','Cebiche de Pescado','Pescado fresco, camote y choclo',35.00,14.00,'P',15),
 (4,2,'MAR002','Chicharrón de Calamar','Porción con salsa criolla',36.00,15.00,'P',20),
 (5,4,'BEF001','Chicha Morada Vaso','Vaso 500 ml',7.00,2.00,'B',2),
 (5,3,'BEF002','Chicha Morada Jarra','Jarra 1 litro',18.00,5.00,'B',3),
 (5,1,'BEF003','Inca Kola 500ml','Botella personal',6.00,3.00,'B',1),
 (6,1,'BEC001','Café Americano','Taza',8.00,2.00,'B',5),
 (7,1,'LIC001','Cerveza Pilsen 620ml','Botella',12.00,7.00,'B',1),
 (7,1,'LIC002','Pisco Sour','Copa',18.00,6.00,'P',6),
 (8,2,'POS001','Suspiro Limeño','Porción',12.00,4.00,'P',5),
 (8,2,'POS002','Arroz con Leche','Porción',10.00,3.00,'P',5);

UPDATE PRODUCTO SET Controla_Stock='S', Stock_Actual=48, Stock_Minimo=12
WHERE Codigo IN ('BEF003','LIC001');
GO

INSERT INTO TIPO_PEDIDO(N_TipoPedido, Abreviatura, Requiere_Mesa) VALUES
 ('EN SALON','SALON','S'),('PARA LLEVAR','LLEVAR','N'),('DELIVERY','DELIV','N');

INSERT INTO ESTADO_PEDIDO(Descripcion, Orden, Color) VALUES
 ('ABIERTO',1,'#0D6EFD'),('EN PREPARACION',2,'#FD7E14'),('SERVIDO',3,'#20C997'),
 ('FACTURADO',4,'#198754'),('ANULADO',5,'#DC3545');

INSERT INTO METODO_PAGO(N_MetodoPago, Afecta_Efectivo, Requiere_Referencia, Comision) VALUES
 ('EFECTIVO','S','N',0),('VISA','N','S',3.50),('MASTERCARD','N','S',3.50),
 ('YAPE','N','S',0),('PLIN','N','S',0),('TRANSFERENCIA','N','S',0),('CREDITO EMPRESA','N','N',0);

INSERT INTO TIPO_MOVIMIENTO_CAJA(N_TipoMovimiento, Abreviatura, Signo) VALUES
 ('INGRESO','ING','+'),('EGRESO','EGR','-');

INSERT INTO CONCEPTO_CAJA(ID_TipoMovimiento, N_Concepto, Descripcion, Afecta_Efectivo) VALUES
 (1,'VENTA AL CONTADO','Cobro de comprobante emitido','S'),
 (1,'COBRO CON TARJETA','Cobro con POS','N'),
 (1,'COBRO BILLETERA DIGITAL','Yape / Plin','N'),
 (1,'ADELANTO DE RESERVA','Adelanto por reserva de mesa','S'),
 (1,'FONDO FIJO','Reposición de fondo fijo','S'),
 (1,'PROPINA','Propina recibida','S'),
 (2,'COMPRA DE INSUMOS','Compra menor de insumos','S'),
 (2,'PAGO DE SERVICIOS','Agua, luz, internet','S'),
 (2,'ADELANTO DE PERSONAL','Adelanto de sueldo','S'),
 (2,'DEVOLUCION A CLIENTE','Devolución por anulación','S'),
 (2,'RETIRO A BOVEDA','Traslado de efectivo','S'),
 (2,'GASTO DE MOVILIDAD','Movilidad y delivery','S');

INSERT INTO CAJA(N_Caja, Descripcion, Ubicacion, Serie_Terminal, Moneda, Monto_Base) VALUES
 ('CAJA 01','Caja principal del salón','Ingreso principal','TERM-001','PEN',200.00),
 ('CAJA 02','Caja de barra','Barra','TERM-002','PEN',100.00);

INSERT INTO SERIE_DOCUMENTO(ID_Caja, Tipo_Documento, Serie, Correlativo) VALUES
 (1,'03','B001',0),(1,'01','F001',0),(1,'07','BC01',0),(1,'TK','T001',0),
 (2,'03','B002',0),(2,'01','F002',0);
GO

/* Persona / empleado / usuario administrador de arranque */
INSERT INTO PERSONA(ID_Distrito, ID_TipoIdentidad, N_Documento, Nombre, Ap_Paterno, Ap_Materno, EMAIL, Celular, Genero, Direccion)
VALUES (1,1,'40000001','LUIS ALFREDO','CASTILLON','SIGUAS','admin@restaurante.pe','956000001','M','Av. Los Maestros 100 - Ica');

INSERT INTO EMPLEADO(ID_Persona, ID_Contrato, ID_Cargo, Salario, Turno, Fondo_Pension, F_Ingreso)
VALUES (1,1,1,3500.00,'Partido','AFP',GETDATE());

INSERT INTO USUARIO(ID_TipoUsuario, ID_Empleado, Logeo, Clave)
VALUES (1,1,'admin', CONVERT(varchar(200), HASHBYTES('SHA2_256','admin123'), 2));

INSERT INTO USUARIO_ROL(ID_Usuario, ID_Rol) VALUES (1,1);
GO

/* Cliente genérico "consumidor final" (persona natural) */
INSERT INTO PERSONA(ID_Distrito, ID_TipoIdentidad, N_Documento, Nombre, Ap_Paterno, Ap_Materno)
VALUES (1,1,'00000000','CLIENTES','VARIOS','');
INSERT INTO CLIENTE(ID_Persona, Codigo_Cliente, Tipo_Cliente) VALUES (2,'CLI-0001','N');

/* Cliente jurídico de ejemplo (para factura) */
INSERT INTO EMPRESA(ID_Distrito, RUC, Razon_Social, Nombre_Comercial, Direccion, Telefono, EMAIL)
VALUES (1,'20481234567','AGROEXPORTADORA SAMARA S.A.C.','SAMARA','Panamericana Sur Km 300 - Ica','056123456','ventas@samara.pe');
INSERT INTO CLIENTE(ID_Empresa, Codigo_Cliente, Tipo_Cliente) VALUES (1,'CLI-0002','J');
GO

/* ==================================================================================
   FUNCIONES
   ================================================================================== */
IF OBJECT_ID('dbo.FN_TOTAL_PEDIDO','FN') IS NOT NULL DROP FUNCTION dbo.FN_TOTAL_PEDIDO;
GO
CREATE FUNCTION dbo.FN_TOTAL_PEDIDO(@ID_Pedido int)
RETURNS decimal(12,2)
AS
BEGIN
    DECLARE @Total decimal(12,2);
    SELECT @Total = ISNULL(SUM(Sub_Total),0)
    FROM DETALLE_PEDIDO
    WHERE ID_Pedido = @ID_Pedido AND Estado_Preparacion <> 'A' AND ESTADO = 'A' AND Es_Cortesia = 'N';
    RETURN ISNULL(@Total,0);
END
GO

/* ==================================================================================
   PROCEDIMIENTOS ALMACENADOS
   ================================================================================== */

/* ---------- Login con validación de estado y bloqueo ---------- */
IF OBJECT_ID('dbo.USP_LOGIN','P') IS NOT NULL DROP PROCEDURE dbo.USP_LOGIN;
GO
CREATE PROCEDURE dbo.USP_LOGIN
    @Logeo varchar(30),
    @Clave varchar(200)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ID int, @Hash varchar(200);

    SELECT @ID = ID_Usuario, @Hash = Clave
    FROM USUARIO WHERE Logeo = @Logeo AND ESTADO = 'A' AND Bloqueado = 'N';

    IF @ID IS NULL
    BEGIN
        INSERT INTO AUDITORIA(ID_Usuario, N_Tabla, Accion, Valor_Nuevo)
        VALUES (NULL,'USUARIO','LOGIN_FALLIDO','Logeo: ' + @Logeo);
        SELECT 0 AS ID_Usuario, 'Usuario inexistente, inactivo o bloqueado' AS Mensaje;
        RETURN;
    END

    IF @Hash <> CONVERT(varchar(200), HASHBYTES('SHA2_256', @Clave), 2)
    BEGIN
        UPDATE USUARIO SET Intentos = Intentos + 1,
                           Bloqueado = CASE WHEN Intentos + 1 >= 3 THEN 'S' ELSE 'N' END,
                           USUMOD = SUSER_SNAME(), PCMOD = HOST_NAME(), FECMOD = GETDATE()
        WHERE ID_Usuario = @ID;

        INSERT INTO AUDITORIA(ID_Usuario, N_Tabla, Accion, ID_Registro, Valor_Nuevo)
        VALUES (@ID,'USUARIO','LOGIN_FALLIDO',@ID,'Clave incorrecta');

        SELECT 0 AS ID_Usuario, 'Clave incorrecta' AS Mensaje;
        RETURN;
    END

    UPDATE USUARIO SET Intentos = 0, F_UltimoAcceso = GETDATE()
    WHERE ID_Usuario = @ID;

    INSERT INTO AUDITORIA(ID_Usuario, N_Tabla, Accion, ID_Registro, Valor_Nuevo)
    VALUES (@ID,'USUARIO','LOGIN',@ID,'Acceso correcto');

    SELECT u.ID_Usuario,
           u.Logeo,
           tu.N_TipoUsuario,
           p.Nombre + ' ' + ISNULL(p.Ap_Paterno,'') AS Empleado,
           c.N_Cargo,
           'Acceso correcto' AS Mensaje
    FROM USUARIO u
      INNER JOIN TIPO_USUARIO tu ON tu.ID_TipoUsuario = u.ID_TipoUsuario
      INNER JOIN EMPLEADO e      ON e.ID_Empleado     = u.ID_Empleado
      INNER JOIN PERSONA p       ON p.ID_Persona      = e.ID_Persona
      INNER JOIN CARGO c         ON c.ID_Cargo        = e.ID_Cargo
    WHERE u.ID_Usuario = @ID;
END
GO

/* ---------- Permisos efectivos de un usuario ---------- */
IF OBJECT_ID('dbo.USP_PERMISOS_USUARIO','P') IS NOT NULL DROP PROCEDURE dbo.USP_PERMISOS_USUARIO;
GO
CREATE PROCEDURE dbo.USP_PERMISOS_USUARIO @ID_Usuario int
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DISTINCT m.N_Modulo, m.Orden, p.Clave, p.N_Permiso
    FROM USUARIO_ROL ur
      INNER JOIN ROL_PERMISO rp ON rp.ID_Rol = ur.ID_Rol AND rp.Concedido = 'S' AND rp.ESTADO = 'A'
      INNER JOIN PERMISO p      ON p.ID_Permiso = rp.ID_Permiso AND p.ESTADO = 'A'
      INNER JOIN MODULO m       ON m.ID_Modulo  = p.ID_Modulo   AND m.ESTADO = 'A'
    WHERE ur.ID_Usuario = @ID_Usuario AND ur.Vigente = 'S' AND ur.ESTADO = 'A'
    ORDER BY m.Orden, p.Clave;
END
GO

/* ---------- Apertura de caja ---------- */
IF OBJECT_ID('dbo.USP_APERTURAR_CAJA','P') IS NOT NULL DROP PROCEDURE dbo.USP_APERTURAR_CAJA;
GO
CREATE PROCEDURE dbo.USP_APERTURAR_CAJA
    @ID_Caja int, @ID_Usuario int, @Monto_Inicial decimal(12,2), @Numero_Turno varchar(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM APERTURA_CAJA WHERE ID_Caja = @ID_Caja AND Situacion = 'A')
    BEGIN
        RAISERROR('La caja ya tiene un turno abierto.',16,1); RETURN;
    END

    SET @Numero_Turno = ISNULL(@Numero_Turno, CONVERT(varchar(8), GETDATE(), 112) + '-' + CAST(@ID_Caja AS varchar(3)));

    BEGIN TRAN;
        INSERT INTO APERTURA_CAJA(ID_Caja, ID_Usuario, Numero_Turno, Monto_Inicial, Monto_Sistema, Situacion)
        VALUES (@ID_Caja, @ID_Usuario, @Numero_Turno, @Monto_Inicial, @Monto_Inicial, 'A');

        DECLARE @ID_Apertura int = SCOPE_IDENTITY();

        UPDATE CAJA SET Aperturada = 'S', USUMOD = SUSER_SNAME(), PCMOD = HOST_NAME(), FECMOD = GETDATE()
        WHERE ID_Caja = @ID_Caja;

        INSERT INTO AUDITORIA(ID_Usuario, N_Tabla, Accion, ID_Registro, Valor_Nuevo)
        VALUES (@ID_Usuario,'APERTURA_CAJA','INSERT',@ID_Apertura,'Apertura con S/ ' + CAST(@Monto_Inicial AS varchar(20)));
    COMMIT;

    SELECT @ID_Apertura AS ID_AperturaCaja, 'Caja aperturada correctamente' AS Mensaje;
END
GO

/* ---------- Registro de movimiento de caja ---------- */
IF OBJECT_ID('dbo.USP_REGISTRAR_MOVIMIENTO_CAJA','P') IS NOT NULL DROP PROCEDURE dbo.USP_REGISTRAR_MOVIMIENTO_CAJA;
GO
CREATE PROCEDURE dbo.USP_REGISTRAR_MOVIMIENTO_CAJA
    @ID_AperturaCaja int, @ID_Concepto int, @ID_MetodoPago int, @ID_Usuario int,
    @Monto decimal(12,2), @Descripcion varchar(200) = NULL,
    @ID_Pedido int = NULL, @ID_Venta int = NULL, @Numero_Operacion varchar(30) = NULL,
    @Retornar char(1) = 'S'
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM APERTURA_CAJA WHERE ID_AperturaCaja = @ID_AperturaCaja AND Situacion = 'A')
    BEGIN
        RAISERROR('El turno de caja no está abierto.',16,1); RETURN;
    END

    DECLARE @ID_TipoMov int, @Signo char(1), @Afecta char(1);
    SELECT @ID_TipoMov = cc.ID_TipoMovimiento, @Signo = tm.Signo,
           @Afecta = CASE WHEN cc.Afecta_Efectivo = 'S' AND mp.Afecta_Efectivo = 'S' THEN 'S' ELSE 'N' END
    FROM CONCEPTO_CAJA cc
      INNER JOIN TIPO_MOVIMIENTO_CAJA tm ON tm.ID_TipoMovimiento = cc.ID_TipoMovimiento
      CROSS JOIN METODO_PAGO mp
    WHERE cc.ID_Concepto = @ID_Concepto AND mp.ID_MetodoPago = @ID_MetodoPago;

    BEGIN TRAN;
        INSERT INTO MOVIMIENTO_CAJA(ID_AperturaCaja, ID_TipoMovimiento, ID_Concepto, ID_MetodoPago,
                                    ID_Usuario, ID_Pedido, ID_Venta, Numero_Operacion, Descripcion,
                                    Monto, Afecta_Efectivo)
        VALUES (@ID_AperturaCaja, @ID_TipoMov, @ID_Concepto, @ID_MetodoPago,
                @ID_Usuario, @ID_Pedido, @ID_Venta, @Numero_Operacion, @Descripcion,
                @Monto, @Afecta);

        UPDATE APERTURA_CAJA
           SET Total_Ingresos = Total_Ingresos + CASE WHEN @Signo = '+' THEN @Monto ELSE 0 END,
               Total_Egresos  = Total_Egresos  + CASE WHEN @Signo = '-' THEN @Monto ELSE 0 END,
               Monto_Sistema  = Monto_Sistema  + CASE WHEN @Afecta = 'S'
                                                      THEN CASE WHEN @Signo = '+' THEN @Monto ELSE -@Monto END
                                                      ELSE 0 END,
               USUMOD = SUSER_SNAME(), PCMOD = HOST_NAME(), FECMOD = GETDATE()
         WHERE ID_AperturaCaja = @ID_AperturaCaja;
    COMMIT;

    IF @Retornar = 'S'
        SELECT SCOPE_IDENTITY() AS ID_MovimientoCaja, 'Movimiento registrado' AS Mensaje;
END
GO

/* ---------- Cierre y arqueo de caja ---------- */
IF OBJECT_ID('dbo.USP_CERRAR_CAJA','P') IS NOT NULL DROP PROCEDURE dbo.USP_CERRAR_CAJA;
GO
CREATE PROCEDURE dbo.USP_CERRAR_CAJA
    @ID_AperturaCaja int, @ID_UsuarioCierre int, @Monto_Declarado decimal(12,2), @Observacion varchar(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ID_Caja int, @Sistema decimal(12,2);

    SELECT @ID_Caja = ID_Caja, @Sistema = Monto_Sistema
    FROM APERTURA_CAJA WHERE ID_AperturaCaja = @ID_AperturaCaja AND Situacion = 'A';

    IF @ID_Caja IS NULL BEGIN RAISERROR('Turno inexistente o ya cerrado.',16,1); RETURN; END

    BEGIN TRAN;
        UPDATE APERTURA_CAJA
           SET ID_UsuarioCierre = @ID_UsuarioCierre,
               F_Cierre         = GETDATE(),
               Monto_Declarado  = @Monto_Declarado,
               Diferencia       = @Monto_Declarado - @Sistema,
               Situacion        = 'C',
               Observacion      = @Observacion,
               USUMOD = SUSER_SNAME(), PCMOD = HOST_NAME(), FECMOD = GETDATE()
         WHERE ID_AperturaCaja = @ID_AperturaCaja;

        UPDATE CAJA SET Aperturada = 'N', USUMOD = SUSER_SNAME(), PCMOD = HOST_NAME(), FECMOD = GETDATE()
         WHERE ID_Caja = @ID_Caja;

        INSERT INTO AUDITORIA(ID_Usuario, N_Tabla, Accion, ID_Registro, Valor_Nuevo)
        VALUES (@ID_UsuarioCierre,'APERTURA_CAJA','UPDATE',@ID_AperturaCaja,
                'Cierre. Sistema: ' + CAST(@Sistema AS varchar(20)) + ' Declarado: ' + CAST(@Monto_Declarado AS varchar(20)));
    COMMIT;

    SELECT ID_AperturaCaja, Monto_Sistema, Monto_Declarado, Diferencia,
           CASE WHEN Diferencia = 0 THEN 'CUADRADO'
                WHEN Diferencia > 0 THEN 'SOBRANTE' ELSE 'FALTANTE' END AS Resultado
    FROM APERTURA_CAJA WHERE ID_AperturaCaja = @ID_AperturaCaja;
END
GO

/* ---------- Abrir un pedido / comanda ---------- */
IF OBJECT_ID('dbo.USP_ABRIR_PEDIDO','P') IS NOT NULL DROP PROCEDURE dbo.USP_ABRIR_PEDIDO;
GO
CREATE PROCEDURE dbo.USP_ABRIR_PEDIDO
    @ID_TipoPedido int, @ID_Usuario int, @ID_Mesa int = NULL, @ID_Cliente int = NULL,
    @ID_Empleado int = NULL, @N_Comensales int = 1, @Observacion varchar(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @ReqMesa char(1);
    SELECT @ReqMesa = Requiere_Mesa FROM TIPO_PEDIDO WHERE ID_TipoPedido = @ID_TipoPedido;

    IF @ReqMesa = 'S' AND @ID_Mesa IS NULL
    BEGIN RAISERROR('El tipo de pedido exige una mesa.',16,1); RETURN; END

    IF @ID_Mesa IS NOT NULL AND EXISTS
       (SELECT 1 FROM PEDIDO p INNER JOIN ESTADO_PEDIDO ep ON ep.ID_EstadoPedido = p.ID_EstadoPedido
         WHERE p.ID_Mesa = @ID_Mesa AND p.Anulado = 'N' AND p.Facturado = 'N' AND ep.Descripcion <> 'ANULADO')
    BEGIN RAISERROR('La mesa ya tiene una comanda abierta.',16,1); RETURN; END

    DECLARE @Num varchar(15) = 'PED' + CONVERT(varchar(8), GETDATE(), 112) +
        RIGHT('0000' + CAST(ISNULL((SELECT COUNT(*) FROM PEDIDO WHERE CONVERT(date,F_Pedido)=CONVERT(date,GETDATE())),0)+1 AS varchar(4)),4);

    BEGIN TRAN;
        INSERT INTO PEDIDO(Numero_Pedido, ID_Cliente, ID_Mesa, ID_TipoPedido, ID_EstadoPedido,
                           ID_Usuario, ID_Empleado, N_Comensales, Observacion)
        VALUES (@Num, @ID_Cliente, @ID_Mesa, @ID_TipoPedido, 1, @ID_Usuario, @ID_Empleado, @N_Comensales, @Observacion);

        DECLARE @ID int = SCOPE_IDENTITY();

        IF @ID_Mesa IS NOT NULL
            UPDATE MESA SET ID_EstadoMesa = 2, USUMOD = SUSER_SNAME(), PCMOD = HOST_NAME(), FECMOD = GETDATE()
             WHERE ID_Mesa = @ID_Mesa;
    COMMIT;

    SELECT @ID AS ID_Pedido, @Num AS Numero_Pedido;
END
GO

/* ---------- Recalcular totales del pedido (IGV 18%) ---------- */
IF OBJECT_ID('dbo.USP_RECALCULAR_PEDIDO','P') IS NOT NULL DROP PROCEDURE dbo.USP_RECALCULAR_PEDIDO;
GO
CREATE PROCEDURE dbo.USP_RECALCULAR_PEDIDO @ID_Pedido int
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Bruto decimal(12,2) = dbo.FN_TOTAL_PEDIDO(@ID_Pedido);
    DECLARE @Desc  decimal(12,2) = (SELECT Descuento FROM PEDIDO WHERE ID_Pedido = @ID_Pedido);
    DECLARE @Serv  decimal(12,2) = 0;

    SELECT @Serv = CONVERT(decimal(12,2), (@Bruto - @Desc) * tm.Cargo_Servicio / 100.0)
    FROM PEDIDO p
      LEFT JOIN MESA m      ON m.ID_Mesa = p.ID_Mesa
      LEFT JOIN TIPO_MESA tm ON tm.ID_TipoMesa = m.ID_TipoMesa
    WHERE p.ID_Pedido = @ID_Pedido;

    SET @Serv = ISNULL(@Serv,0);

    DECLARE @Total decimal(12,2) = @Bruto - @Desc + @Serv;
    DECLARE @IGV   decimal(12,2) = CONVERT(decimal(12,2), @Total - (@Total / 1.18));

    UPDATE PEDIDO
       SET SubTotal = CONVERT(decimal(12,2), @Total / 1.18),
           Servicio = @Serv,
           IGV      = @IGV,
           Total    = @Total,
           USUMOD = SUSER_SNAME(), PCMOD = HOST_NAME(), FECMOD = GETDATE()
     WHERE ID_Pedido = @ID_Pedido;
END
GO

/* ---------- Agregar producto a la comanda ---------- */
IF OBJECT_ID('dbo.USP_AGREGAR_DETALLE_PEDIDO','P') IS NOT NULL DROP PROCEDURE dbo.USP_AGREGAR_DETALLE_PEDIDO;
GO
CREATE PROCEDURE dbo.USP_AGREGAR_DETALLE_PEDIDO
    @ID_Pedido int, @ID_Producto int, @Cantidad decimal(10,2),
    @Nota_Cocina varchar(150) = NULL, @Descuento decimal(10,2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM PEDIDO WHERE ID_Pedido = @ID_Pedido AND (Facturado = 'S' OR Anulado = 'S'))
    BEGIN RAISERROR('El pedido está facturado o anulado.',16,1); RETURN; END

    DECLARE @Precio decimal(10,2);
    SELECT @Precio = Precio FROM PRODUCTO
     WHERE ID_Producto = @ID_Producto AND ESTADO = 'A' AND Disponible = 'S';

    IF @Precio IS NULL BEGIN RAISERROR('Producto no disponible.',16,1); RETURN; END

    BEGIN TRAN;
        INSERT INTO DETALLE_PEDIDO(ID_Pedido, ID_Producto, Cantidad, Precio_Unitario, Descuento, Nota_Cocina)
        VALUES (@ID_Pedido, @ID_Producto, @Cantidad, @Precio, @Descuento, @Nota_Cocina);

        EXEC dbo.USP_RECALCULAR_PEDIDO @ID_Pedido;
    COMMIT;
END
GO

/* ---------- Facturar pedido: genera VENTA + BOLETA/FACTURA + PAGO + MOVIMIENTO_CAJA ---------- */
IF OBJECT_ID('dbo.USP_FACTURAR_PEDIDO','P') IS NOT NULL DROP PROCEDURE dbo.USP_FACTURAR_PEDIDO;
GO
CREATE PROCEDURE dbo.USP_FACTURAR_PEDIDO
    @ID_Pedido        int,
    @ID_Usuario       int,
    @ID_AperturaCaja  int,
    @TipoDocumento    char(2),          -- '03' Boleta  '01' Factura  'TK' Ticket
    @ID_Cliente       int = NULL,
    @ID_MetodoPago    int = 1,
    @Monto_Recibido   decimal(12,2) = NULL,
    @Referencia       varchar(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM PEDIDO WHERE ID_Pedido = @ID_Pedido AND Facturado = 'N' AND Anulado = 'N')
    BEGIN RAISERROR('El pedido no existe, ya fue facturado o está anulado.',16,1); RETURN; END

    IF NOT EXISTS (SELECT 1 FROM APERTURA_CAJA WHERE ID_AperturaCaja = @ID_AperturaCaja AND Situacion = 'A')
    BEGIN RAISERROR('No hay turno de caja abierto.',16,1); RETURN; END

    EXEC dbo.USP_RECALCULAR_PEDIDO @ID_Pedido;

    DECLARE @SubTotal decimal(12,2), @Desc decimal(12,2), @Serv decimal(12,2),
            @IGV decimal(12,2), @Total decimal(12,2), @ID_Mesa int, @ID_Empresa int;

    SELECT @SubTotal = SubTotal, @Desc = Descuento, @Serv = Servicio,
           @IGV = IGV, @Total = Total, @ID_Mesa = ID_Mesa,
           @ID_Cliente = ISNULL(@ID_Cliente, ID_Cliente)
    FROM PEDIDO WHERE ID_Pedido = @ID_Pedido;

    IF @TipoDocumento = '01'
    BEGIN
        SELECT @ID_Empresa = ID_Empresa FROM CLIENTE WHERE ID_Cliente = @ID_Cliente;
        IF @ID_Empresa IS NULL
        BEGIN RAISERROR('Para emitir FACTURA el cliente debe estar asociado a una EMPRESA con RUC.',16,1); RETURN; END
    END

    SET @Monto_Recibido = ISNULL(@Monto_Recibido, @Total);

    BEGIN TRAN;
        /* 1. Cabecera de venta */
        INSERT INTO VENTA(ID_Pedido, ID_Cliente, ID_Usuario, ID_AperturaCaja, TipoDocumento,
                          SubTotal, Descuento, Servicio, IGV, Total, Total_Pagado, Vuelto)
        VALUES (@ID_Pedido, @ID_Cliente, @ID_Usuario, @ID_AperturaCaja, @TipoDocumento,
                @SubTotal, @Desc, @Serv, @IGV, @Total, @Monto_Recibido,
                CASE WHEN @Monto_Recibido > @Total THEN @Monto_Recibido - @Total ELSE 0 END);

        DECLARE @ID_Venta int = SCOPE_IDENTITY();

        /* 2. Detalle de venta a partir del detalle del pedido */
        INSERT INTO DETALLE_VENTA(ID_Venta, ID_Producto, Cantidad, Precio, Descuento)
        SELECT @ID_Venta, ID_Producto, Cantidad, Precio_Unitario, Descuento
        FROM DETALLE_PEDIDO
        WHERE ID_Pedido = @ID_Pedido AND Estado_Preparacion <> 'A' AND ESTADO = 'A' AND Es_Cortesia = 'N';

        /* 3. Correlativo y comprobante */
        DECLARE @Serie char(4), @Numero char(8);
        DECLARE @Correlativo TABLE (Serie char(4), Correlativo int);

        UPDATE SERIE_DOCUMENTO WITH (UPDLOCK, HOLDLOCK)
           SET Correlativo = Correlativo + 1
        OUTPUT inserted.Serie, inserted.Correlativo INTO @Correlativo
         WHERE ID_Serie = (SELECT TOP 1 ID_Serie FROM SERIE_DOCUMENTO
                            WHERE Tipo_Documento = @TipoDocumento AND ESTADO = 'A' ORDER BY ID_Serie);

        SELECT @Serie  = Serie,
               @Numero = RIGHT('00000000' + CAST(Correlativo AS varchar(8)), 8)
        FROM @Correlativo;

        IF @Serie IS NULL
        BEGIN
            ROLLBACK;
            RAISERROR('No existe serie activa para el tipo de documento indicado.',16,1);
            RETURN;
        END

        IF @TipoDocumento = '03'
        BEGIN
            INSERT INTO BOLETA(ID_Venta, Serie, Numero, Cliente_Documento, Cliente_Nombre)
            SELECT @ID_Venta, @Serie, @Numero, p.N_Documento,
                   p.Nombre + ' ' + ISNULL(p.Ap_Paterno,'') + ' ' + ISNULL(p.Ap_Materno,'')
            FROM CLIENTE c LEFT JOIN PERSONA p ON p.ID_Persona = c.ID_Persona
            WHERE c.ID_Cliente = @ID_Cliente;
        END
        ELSE IF @TipoDocumento = '01'
        BEGIN
            INSERT INTO FACTURA(ID_Venta, ID_Empresa, Serie, Numero)
            VALUES (@ID_Venta, @ID_Empresa, @Serie, @Numero);
        END

        /* 4. Pago */
        INSERT INTO PAGO_VENTA(ID_Venta, ID_MetodoPago, Monto, Referencia)
        VALUES (@ID_Venta, @ID_MetodoPago, @Total, @Referencia);

        /* 5. Movimiento de caja */
        DECLARE @ID_Concepto int =
            (SELECT CASE WHEN mp.Afecta_Efectivo = 'S' THEN 1
                         WHEN mp.N_MetodoPago IN ('YAPE','PLIN') THEN 3
                         ELSE 2 END
             FROM METODO_PAGO mp WHERE mp.ID_MetodoPago = @ID_MetodoPago);

        EXEC dbo.USP_REGISTRAR_MOVIMIENTO_CAJA
             @ID_AperturaCaja = @ID_AperturaCaja,
             @ID_Concepto     = @ID_Concepto,
             @ID_MetodoPago   = @ID_MetodoPago,
             @ID_Usuario      = @ID_Usuario,
             @Monto           = @Total,
             @Descripcion     = 'Cobro comprobante',
             @ID_Pedido       = @ID_Pedido,
             @ID_Venta        = @ID_Venta,
             @Numero_Operacion= @Referencia,
             @Retornar        = 'N';

        /* 6. Cerrar pedido y liberar mesa */
        UPDATE PEDIDO
           SET Facturado = 'S', ID_EstadoPedido = 4, F_Cierre = GETDATE(),
               USUMOD = SUSER_SNAME(), PCMOD = HOST_NAME(), FECMOD = GETDATE()
         WHERE ID_Pedido = @ID_Pedido;

        IF @ID_Mesa IS NOT NULL
            UPDATE MESA SET ID_EstadoMesa = 1, USUMOD = SUSER_SNAME(), PCMOD = HOST_NAME(), FECMOD = GETDATE()
             WHERE ID_Mesa = @ID_Mesa;

        INSERT INTO AUDITORIA(ID_Usuario, N_Tabla, Accion, ID_Registro, Valor_Nuevo)
        VALUES (@ID_Usuario,'VENTA','INSERT',@ID_Venta,
                'Comprobante ' + @Serie + '-' + @Numero + ' por S/ ' + CAST(@Total AS varchar(20)));
    COMMIT;

    SELECT @ID_Venta AS ID_Venta, @Serie AS Serie, @Numero AS Numero, @Total AS Total,
           CASE WHEN @Monto_Recibido > @Total THEN @Monto_Recibido - @Total ELSE 0 END AS Vuelto;
END
GO

/* ---------- Anular pedido ---------- */
IF OBJECT_ID('dbo.USP_ANULAR_PEDIDO','P') IS NOT NULL DROP PROCEDURE dbo.USP_ANULAR_PEDIDO;
GO
CREATE PROCEDURE dbo.USP_ANULAR_PEDIDO @ID_Pedido int, @ID_Usuario int, @Motivo varchar(200)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM PEDIDO WHERE ID_Pedido = @ID_Pedido AND Facturado = 'S')
    BEGIN RAISERROR('El pedido ya fue facturado. Use nota de crédito.',16,1); RETURN; END

    DECLARE @ID_Mesa int = (SELECT ID_Mesa FROM PEDIDO WHERE ID_Pedido = @ID_Pedido);

    BEGIN TRAN;
        UPDATE PEDIDO SET Anulado='S', ID_EstadoPedido=5, Motivo_Anulacion=@Motivo, ESTADO='I',
                          USUMOD=SUSER_SNAME(), PCMOD=HOST_NAME(), FECMOD=GETDATE()
         WHERE ID_Pedido=@ID_Pedido;

        UPDATE DETALLE_PEDIDO SET Estado_Preparacion='A', ESTADO='I',
                                  USUMOD=SUSER_SNAME(), PCMOD=HOST_NAME(), FECMOD=GETDATE()
         WHERE ID_Pedido=@ID_Pedido;

        IF @ID_Mesa IS NOT NULL
            UPDATE MESA SET ID_EstadoMesa=1, USUMOD=SUSER_SNAME(), PCMOD=HOST_NAME(), FECMOD=GETDATE()
             WHERE ID_Mesa=@ID_Mesa;

        INSERT INTO AUDITORIA(ID_Usuario, N_Tabla, Accion, ID_Registro, Valor_Nuevo)
        VALUES (@ID_Usuario,'PEDIDO','ANULAR',@ID_Pedido,@Motivo);
    COMMIT;
END
GO

/* ==================================================================================
   TRIGGERS DE AUDITORÍA (patrón replicable a cualquier tabla)
   ================================================================================== */
IF OBJECT_ID('dbo.TR_PRODUCTO_AUDITORIA','TR') IS NOT NULL DROP TRIGGER dbo.TR_PRODUCTO_AUDITORIA;
GO
CREATE TRIGGER dbo.TR_PRODUCTO_AUDITORIA
ON PRODUCTO AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Accion varchar(20) =
        CASE WHEN EXISTS(SELECT 1 FROM inserted) AND EXISTS(SELECT 1 FROM deleted) THEN 'UPDATE'
             WHEN EXISTS(SELECT 1 FROM inserted) THEN 'INSERT' ELSE 'DELETE' END;

    INSERT INTO AUDITORIA(N_Tabla, Accion, ID_Registro, Valor_Anterior, Valor_Nuevo)
    SELECT 'PRODUCTO', @Accion,
           COALESCE(i.ID_Producto, d.ID_Producto),
           CASE WHEN d.ID_Producto IS NULL THEN NULL
                ELSE CONCAT('Producto=',d.N_Producto,'|Precio=',d.Precio,'|Estado=',d.ESTADO) END,
           CASE WHEN i.ID_Producto IS NULL THEN NULL
                ELSE CONCAT('Producto=',i.N_Producto,'|Precio=',i.Precio,'|Estado=',i.ESTADO) END
    FROM inserted i FULL OUTER JOIN deleted d ON i.ID_Producto = d.ID_Producto;
END
GO

IF OBJECT_ID('dbo.TR_VENTA_AUDITORIA','TR') IS NOT NULL DROP TRIGGER dbo.TR_VENTA_AUDITORIA;
GO
CREATE TRIGGER dbo.TR_VENTA_AUDITORIA
ON VENTA AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO AUDITORIA(ID_Usuario, N_Tabla, Accion, ID_Registro, Valor_Anterior, Valor_Nuevo)
    SELECT i.ID_Usuario, 'VENTA', 'UPDATE', i.ID_Venta,
           CONCAT('Total=',d.Total,'|Anulada=',d.Anulada),
           CONCAT('Total=',i.Total,'|Anulada=',i.Anulada)
    FROM inserted i INNER JOIN deleted d ON d.ID_Venta = i.ID_Venta
    WHERE i.Total <> d.Total OR i.Anulada <> d.Anulada;
END
GO

/* ==================================================================================
   VISTAS DE EXPLOTACIÓN / REPORTES
   ================================================================================== */

CREATE VIEW VW_MAPA_MESAS AS
SELECT m.ID_Mesa, a.N_Ambiente, m.Numero, m.Capacidad, em.Descripcion AS Estado_Mesa, em.Color,
       p.ID_Pedido, p.Numero_Pedido, p.Total AS Consumo_Actual
FROM MESA m
  INNER JOIN AMBIENTE a     ON a.ID_Ambiente = m.ID_Ambiente
  INNER JOIN ESTADO_MESA em ON em.ID_EstadoMesa = m.ID_EstadoMesa
  LEFT JOIN PEDIDO p        ON p.ID_Mesa = m.ID_Mesa AND p.Facturado='N' AND p.Anulado='N'
WHERE m.ESTADO = 'A';
GO

CREATE VIEW VW_COMANDA_COCINA AS
SELECT p.ID_Pedido, p.Numero_Pedido, ISNULL(m.Numero,'S/M') AS Mesa, a.N_Ambiente,
       cp.Area_Despacho, pr.N_Producto, dp.Cantidad, dp.Nota_Cocina,
       dp.Estado_Preparacion, dp.F_Solicitud,
       DATEDIFF(MINUTE, dp.F_Solicitud, GETDATE()) AS Minutos_Espera
FROM DETALLE_PEDIDO dp
  INNER JOIN PEDIDO p             ON p.ID_Pedido = dp.ID_Pedido
  INNER JOIN PRODUCTO pr          ON pr.ID_Producto = dp.ID_Producto
  INNER JOIN CATEGORIA_PRODUCTO cp ON cp.ID_CategoriaProducto = pr.ID_CategoriaProducto
  LEFT JOIN MESA m                ON m.ID_Mesa = p.ID_Mesa
  LEFT JOIN AMBIENTE a            ON a.ID_Ambiente = m.ID_Ambiente
WHERE dp.Estado_Preparacion IN ('P','E') AND p.Anulado='N';
GO

CREATE VIEW VW_VENTAS_DIARIAS AS
SELECT CONVERT(date, v.F_Venta) AS Fecha,
       v.TipoDocumento,
       COUNT(*)        AS N_Comprobantes,
       SUM(v.SubTotal) AS SubTotal,
       SUM(v.IGV)      AS IGV,
       SUM(v.Total)    AS Total
FROM VENTA v
WHERE v.Anulada = 'N' AND v.ESTADO = 'A'
GROUP BY CONVERT(date, v.F_Venta), v.TipoDocumento;
GO

CREATE VIEW VW_PRODUCTOS_MAS_VENDIDOS AS
SELECT TOP 100 PERCENT
       pr.ID_Producto, pr.N_Producto, cp.N_CategoriaProducto,
       SUM(dv.Cantidad)  AS Cantidad_Vendida,
       SUM(dv.Sub_Total) AS Importe_Vendido
FROM DETALLE_VENTA dv
  INNER JOIN VENTA v              ON v.ID_Venta = dv.ID_Venta AND v.Anulada='N'
  INNER JOIN PRODUCTO pr          ON pr.ID_Producto = dv.ID_Producto
  INNER JOIN CATEGORIA_PRODUCTO cp ON cp.ID_CategoriaProducto = pr.ID_CategoriaProducto
GROUP BY pr.ID_Producto, pr.N_Producto, cp.N_CategoriaProducto
ORDER BY SUM(dv.Cantidad) DESC;
GO

CREATE VIEW VW_ARQUEO_CAJA AS
SELECT ac.ID_AperturaCaja, c.N_Caja, ac.Numero_Turno, ac.F_Apertura, ac.F_Cierre,
       ua.Logeo AS Usuario_Apertura, uc.Logeo AS Usuario_Cierre,
       ac.Monto_Inicial, ac.Total_Ingresos, ac.Total_Egresos,
       ac.Monto_Sistema, ac.Monto_Declarado, ac.Diferencia, ac.Situacion
FROM APERTURA_CAJA ac
  INNER JOIN CAJA c    ON c.ID_Caja = ac.ID_Caja
  INNER JOIN USUARIO ua ON ua.ID_Usuario = ac.ID_Usuario
  LEFT JOIN USUARIO uc  ON uc.ID_Usuario = ac.ID_UsuarioCierre;
GO

CREATE VIEW VW_CLIENTES AS
SELECT c.ID_Cliente, c.Codigo_Cliente, c.Tipo_Cliente,
       CASE WHEN c.Tipo_Cliente='N'
            THEN p.Nombre + ' ' + ISNULL(p.Ap_Paterno,'') + ' ' + ISNULL(p.Ap_Materno,'')
            ELSE e.Razon_Social END AS Cliente,
       CASE WHEN c.Tipo_Cliente='N' THEN p.N_Documento ELSE e.RUC END AS Documento,
       CASE WHEN c.Tipo_Cliente='N' THEN p.Direccion   ELSE e.Direccion END AS Direccion,
       CASE WHEN c.Tipo_Cliente='N' THEN p.Celular     ELSE e.Telefono END AS Telefono,
       c.Puntos, c.ESTADO
FROM CLIENTE c
  LEFT JOIN PERSONA p ON p.ID_Persona = c.ID_Persona
  LEFT JOIN EMPRESA e ON e.ID_Empresa = c.ID_Empresa;
GO

/* ==================================================================================
   JUEGO DE PRUEBA DEL FLUJO COMPLETO
   ================================================================================== */
DECLARE @Apertura int, @Pedido int;

EXEC dbo.USP_APERTURAR_CAJA @ID_Caja=1, @ID_Usuario=1, @Monto_Inicial=200.00;
SET @Apertura = (SELECT ID_AperturaCaja FROM APERTURA_CAJA WHERE ID_Caja=1 AND Situacion='A');

EXEC dbo.USP_ABRIR_PEDIDO @ID_TipoPedido=1, @ID_Usuario=1, @ID_Mesa=1, @ID_Cliente=1, @N_Comensales=3;
SET @Pedido = (SELECT MAX(ID_Pedido) FROM PEDIDO);

EXEC dbo.USP_AGREGAR_DETALLE_PEDIDO @ID_Pedido=@Pedido, @ID_Producto=3, @Cantidad=2, @Nota_Cocina='Uno sin cebolla';
EXEC dbo.USP_AGREGAR_DETALLE_PEDIDO @ID_Pedido=@Pedido, @ID_Producto=7, @Cantidad=1;
EXEC dbo.USP_AGREGAR_DETALLE_PEDIDO @ID_Pedido=@Pedido, @ID_Producto=10, @Cantidad=1;

EXEC dbo.USP_FACTURAR_PEDIDO @ID_Pedido=@Pedido, @ID_Usuario=1, @ID_AperturaCaja=@Apertura,
     @TipoDocumento='03', @ID_Cliente=1, @ID_MetodoPago=1, @Monto_Recibido=150.00;

EXEC dbo.USP_CERRAR_CAJA @ID_AperturaCaja=@Apertura, @ID_UsuarioCierre=1, @Monto_Declarado=329.00,
     @Observacion='Cierre de prueba';
GO

SELECT 'Tablas creadas' AS Objeto, COUNT(*) AS Total FROM sys.tables
UNION ALL SELECT 'Vistas', COUNT(*) FROM sys.views
UNION ALL SELECT 'Procedimientos', COUNT(*) FROM sys.procedures;
SELECT * FROM VW_VENTAS_DIARIAS;
SELECT * FROM VW_ARQUEO_CAJA;
GO
