/* ==================================================================================
   POLLERÍA DON PEPITO - DATOS MAESTROS Y DATOS DE OPERACIÓN
   ----------------------------------------------------------------------------------
   Carta inspirada en la oferta real de las pollerías peruanas Roky's y Norky's
   (pollo a la brasa, combos, parrillas, alitas, chicharrón, chicha morada, etc.).
   Precios de referencia en soles (PEN) al 2026.
   ----------------------------------------------------------------------------------
   Ejecutar DESPUÉS de:
     01_modelo_restaurante_postgres.sql
     02_puntos_supabase_postgres.sql
   ================================================================================== */

/* ==================================================================================
   01. UBICACIÓN GEOGRÁFICA
   ================================================================================== */
INSERT INTO DEPARTAMENTO (ID_Departamento, N_Departamento) VALUES
 (1,'LIMA'), (2,'ICA'), (3,'AREQUIPA'), (4,'LA LIBERTAD');

INSERT INTO PROVINCIA (ID_Provincia, ID_Departamento, N_Provincia) VALUES
 (1,1,'LIMA'), (2,2,'ICA'), (3,2,'CHINCHA'), (4,2,'PISCO'),
 (5,3,'AREQUIPA'), (6,4,'TRUJILLO');

INSERT INTO DISTRITO (ID_Distrito, ID_Provincia, D_Distrito) VALUES
 (1,1,'MIRAFLORES'), (2,1,'SANTIAGO DE SURCO'), (3,1,'SAN ISIDRO'),
 (4,1,'LA MOLINA'), (5,1,'SAN MIGUEL'), (6,1,'LOS OLIVOS'),
 (7,2,'ICA'), (8,2,'LA TINGUIÑA'), (9,2,'PARCONA'),
 (10,2,'SUBTANJALLA'), (11,2,'SAN JUAN BAUTISTA'),
 (12,3,'CHINCHA ALTA'), (13,4,'PISCO'),
 (14,5,'AREQUIPA'), (15,6,'TRUJILLO');

/* ==================================================================================
   02. MAESTROS DE PERSONAS, EMPLEADOS Y SEGURIDAD
   ================================================================================== */
INSERT INTO TIPO_IDENTIDAD (ID_TipoIdentidad, N_TipoIdentidad, Abreviatura, Longitud, Codigo_SUNAT) VALUES
 (1,'DNI','DNI',8,'1'),
 (2,'RUC','RUC',11,'6'),
 (3,'CARNET EXTRANJERIA','CE',12,'4'),
 (4,'PASAPORTE','PAS',12,'7');

INSERT INTO CARGO (ID_Cargo, N_Cargo, Area) VALUES
 (1,'ADMINISTRADOR','Administración'),
 (2,'CAJERO','Caja'),
 (3,'MOZO','Salón'),
 (4,'CHEF','Cocina'),
 (5,'AYUDANTE DE COCINA','Cocina'),
 (6,'BARMAN','Barra'),
 (7,'REPARTIDOR','Delivery'),
 (8,'PARRILLERO','Cocina'),
 (9,'SUPERVISOR','Salón');

INSERT INTO CONTRATO (ID_Contrato, N_Contrato, Descripcion) VALUES
 (1,'PLAZO INDETERMINADO','Contrato a plazo indeterminado'),
 (2,'PLAZO FIJO','Contrato sujeto a modalidad'),
 (3,'PART TIME','Jornada parcial'),
 (4,'LOCACION DE SERVICIOS','Recibo por honorarios');

INSERT INTO TIPO_USUARIO (ID_TipoUsuario, N_TipoUsuario) VALUES
 (1,'ADMINISTRADOR'), (2,'CAJERO'), (3,'MOZO'),
 (4,'COCINA'), (5,'SUPERVISOR'), (6,'REPARTIDOR');

INSERT INTO MODULO (ID_Modulo, N_Modulo, Descripcion, Icono, Orden) VALUES
 (1,'SEGURIDAD','Usuarios, roles y permisos','shield',1),
 (2,'MANTENIMIENTO','Catálogos maestros','database',2),
 (3,'CARTA','Categorías y productos','book',3),
 (4,'SALON','Ambientes, mesas y reservas','table',4),
 (5,'PEDIDOS','Comandas y despacho','clipboard',5),
 (6,'VENTAS','Facturación boleta/factura','receipt',6),
 (7,'CAJA','Apertura, movimientos y arqueo','cash',7),
 (8,'REPORTES','Reportes gerenciales','chart',8),
 (9,'AUDITORIA','Bitácora del sistema','history',9);

INSERT INTO ROL (ID_Rol, N_Rol, Descripcion, Nivel) VALUES
 (1,'ADMINISTRADOR','Acceso total al sistema',1),
 (2,'SUPERVISOR','Supervisión de salón y caja',2),
 (3,'CAJERO','Facturación y manejo de caja',3),
 (4,'MOZO','Registro de comandas',4),
 (5,'COCINA','Despacho de pedidos',5),
 (6,'REPARTIDOR','Entregas de delivery',6);

INSERT INTO PERMISO (ID_Permiso, ID_Modulo, N_Permiso, Clave, Descripcion) VALUES
 (1,1,'Gestionar usuarios','SEG_USUARIO','Crear, editar y desactivar usuarios'),
 (2,1,'Asignar roles','SEG_ROL','Asignar roles y permisos'),
 (3,2,'Gestionar catálogos','MAN_CATALOGO','Mantenimiento de tablas maestras'),
 (4,3,'Gestionar carta','CAR_PRODUCTO','Alta y edición de productos y precios'),
 (5,4,'Gestionar mesas','SAL_MESA','Configurar ambientes y mesas'),
 (6,4,'Gestionar reservas','SAL_RESERVA','Registrar y confirmar reservas'),
 (7,5,'Registrar pedido','PED_REGISTRAR','Crear y modificar comandas'),
 (8,5,'Anular pedido','PED_ANULAR','Anular comandas registradas'),
 (9,5,'Aplicar descuento','PED_DESCUENTO','Aplicar descuentos y cortesías'),
 (10,6,'Emitir comprobante','VEN_EMITIR','Emitir boleta o factura'),
 (11,6,'Anular venta','VEN_ANULAR','Anular comprobantes y emitir nota de crédito'),
 (12,7,'Aperturar caja','CAJ_APERTURAR','Apertura de turno de caja'),
 (13,7,'Cerrar caja','CAJ_CERRAR','Cierre y arqueo de caja'),
 (14,7,'Registrar egreso','CAJ_EGRESO','Registrar salidas de efectivo'),
 (15,8,'Ver reportes','REP_VER','Consultar reportes gerenciales'),
 (16,9,'Ver auditoría','AUD_VER','Consultar la bitácora del sistema');

INSERT INTO ROL_PERMISO (ID_Rol, ID_Permiso, Concedido)
SELECT 1, ID_Permiso, 'S' FROM PERMISO;

INSERT INTO ROL_PERMISO (ID_Rol, ID_Permiso, Concedido)
SELECT 2, ID_Permiso, 'S' FROM PERMISO
WHERE Clave IN ('SAL_MESA','SAL_RESERVA','PED_REGISTRAR','PED_ANULAR','PED_DESCUENTO',
                'VEN_EMITIR','VEN_ANULAR','CAJ_APERTURAR','CAJ_CERRAR','REP_VER');

INSERT INTO ROL_PERMISO (ID_Rol, ID_Permiso, Concedido)
SELECT 3, ID_Permiso, 'S' FROM PERMISO
WHERE Clave IN ('PED_REGISTRAR','VEN_EMITIR','CAJ_APERTURAR','CAJ_CERRAR','CAJ_EGRESO','REP_VER');

INSERT INTO ROL_PERMISO (ID_Rol, ID_Permiso, Concedido)
SELECT 4, ID_Permiso, 'S' FROM PERMISO
WHERE Clave IN ('PED_REGISTRAR','SAL_RESERVA');

INSERT INTO ROL_PERMISO (ID_Rol, ID_Permiso, Concedido)
SELECT 5, ID_Permiso, 'S' FROM PERMISO WHERE Clave IN ('PED_REGISTRAR');

/* --- Personas: administrador, clientes y trabajadores ---------------------------- */
INSERT INTO PERSONA (ID_Persona, ID_Distrito, ID_TipoIdentidad, N_Documento, Nombre, Ap_Paterno, Ap_Materno,
                     F_Nacimiento, EMAIL, Celular, Genero, Direccion) VALUES
 (1,7,1,'40000001','LUIS ALFREDO','CASTILLON','SIGUAS','1985-04-12','admin@donpepito.pe','956000001','M','Av. Los Maestros 100 - Ica'),
 (2,7,1,'00000000','CLIENTES','VARIOS',NULL,NULL,NULL,NULL,NULL,NULL),
 (3,1,1,'45678912','MARIA FERNANDA','QUISPE','HUAMAN','1992-08-23','maria.quispe@gmail.com','987654321','F','Av. Larco 345, Miraflores'),
 (4,2,1,'41234567','JORGE LUIS','RAMIREZ','SOTO','1988-11-02','jorge.ramirez@hotmail.com','986741258','M','Av. Primavera 1200, Surco'),
 (5,3,1,'72345678','ANA PAOLA','FLORES','VARGAS','1997-02-14','ana.flores@gmail.com','955123456','F','Av. Javier Prado Este 2450, San Isidro'),
 (6,5,1,'09876543','CARLOS ENRIQUE','MENDOZA','RIOS','1979-06-30','carlos.mendoza@outlook.com','944785123','M','Av. La Marina 2350, San Miguel'),
 (7,7,1,'15478963','ROSA ELVIRA','CHAVEZ','TORRES','1968-09-17','rosa.chavez@gmail.com','933456789','F','Calle Bolívar 250, Ica'),
 (8,8,1,'44556677','MIGUEL ANGEL','HUARCAYA','QUISPE','1990-12-05','miguel.huarcaya@gmail.com','922345678','M','Calle Los Olivos 145, La Tinguiña'),
 (9,14,1,'75896321','DANIELA ALEXANDRA','PACHECO','RUIZ','1995-03-21','daniela.pacheco@gmail.com','911234567','F','Calle Mercaderes 118, Arequipa'),
 (10,15,1,'08765432','JOSE ANTONIO','SALAZAR','VEGA','1983-07-09','jose.salazar@gmail.com','900987654','M','Av. España 2100, Trujillo'),
 (11,4,1,'71234568','SOFIA MERCEDES','ALVAREZ','PINTO','1999-01-28','sofia.alvarez@gmail.com','999888777','F','Av. Raúl Ferrero 1250, La Molina'),
 (12,6,1,'10293847','PEDRO PABLO','GUTIERREZ','LOPEZ','1975-10-11','pedro.gutierrez@yahoo.com','988777666','M','Av. Carlos Izaguirre 890, Los Olivos'),
 (21,7,1,'40000002','CARMEN ROSA','VEGA','SALINAS','1990-05-18','carmen.vega@donpepito.pe','956000002','F','Av. San Martín 456 - Ica'),
 (22,7,1,'40000003','JULIO CESAR','MAMANI','CONDORI','1994-09-09','julio.mamani@donpepito.pe','956000003','M','Calle Pisco 123 - Ica'),
 (23,8,1,'40000004','FIORELLA NICOLE','TORRES','AYALA','1998-12-01','fiorella.torres@donpepito.pe','956000004','F','Av. Grau 789 - La Tinguiña'),
 (24,7,1,'40000005','WALTER IVAN','ROJAS','PEREZ','1984-03-27','walter.rojas@donpepito.pe','956000005','M','Calle Lima 321 - Ica'),
 (25,9,1,'40000006','GLORIA ESTHER','SANCHEZ','DIAZ','1987-07-15','gloria.sanchez@donpepito.pe','956000006','F','Av. Municipal 654 - Parcona'),
 (26,10,1,'40000007','RICHARD ALBERTO','CACERES','NUÑEZ','1991-01-20','richard.caceres@donpepito.pe','956000007','M','Calle Comercio 987 - Subtanjalla'),
 (27,11,1,'40000008','KATHERINE MILAGROS','ZEGARRA','VILCA','1996-06-06','katherine.zegarra@donpepito.pe','956000008','F','Av. Prolongación 147 - San Juan Bautista'),
 (28,7,1,'40000009','JUAN DIEGO','PEREZ','GUTIERREZ','1993-04-04','juan.perez@donpepito.pe','956000009','M','Calle Ayacucho 852 - Ica'),
 (29,7,1,'40000010','MARIO ALBERTO','VILCHEZ','RAMOS','1982-08-08','mario.vilchez@donpepito.pe','956000010','M','Av. Los Maestros 741 - Ica');

INSERT INTO EMPRESA (ID_Empresa, ID_Distrito, RUC, Razon_Social, Nombre_Comercial, Direccion, Telefono, EMAIL) VALUES
 (1,7,'20481234567','AGROEXPORTADORA SAMARA S.A.C.','SAMARA','Panamericana Sur Km 300 - Ica','056123456','ventas@samara.pe'),
 (2,1,'20556677889','CORPORACION GASTRONOMICA EL BUEN SABOR S.A.C.','EL BUEN SABOR','Av. Arequipa 2580 - Miraflores','014567890','compras@elbuensabor.pe');

INSERT INTO CLIENTE (ID_Cliente, ID_Persona, ID_Empresa, Codigo_Cliente, Tipo_Cliente) VALUES
 (1,2,NULL,'CLI-0001','N'),
 (2,3,NULL,'CLI-0002','N'),
 (3,4,NULL,'CLI-0003','N'),
 (4,5,NULL,'CLI-0004','N'),
 (5,6,NULL,'CLI-0005','N'),
 (6,7,NULL,'CLI-0006','N'),
 (7,8,NULL,'CLI-0007','N'),
 (8,9,NULL,'CLI-0008','N'),
 (9,10,NULL,'CLI-0009','N'),
 (10,11,NULL,'CLI-0010','N'),
 (11,12,NULL,'CLI-0011','N'),
 (12,NULL,1,'CLI-0012','J'),
 (13,NULL,2,'CLI-0013','J');

INSERT INTO EMPLEADO (ID_Empleado, ID_Persona, ID_Contrato, ID_Cargo, Salario, Turno, Fondo_Pension, F_Ingreso) VALUES
 (1,1,1,1,3800.00,'Partido','AFP','2022-03-01'),
 (2,21,1,2,1800.00,'Mañana','ONP','2023-01-15'),
 (3,22,1,3,1500.00,'Tarde','ONP','2023-06-01'),
 (4,23,1,3,1500.00,'Noche','ONP','2024-02-12'),
 (5,24,1,4,2600.00,'Partido','AFP','2022-05-20'),
 (6,25,2,5,1400.00,'Mañana','ONP','2024-08-05'),
 (7,26,1,8,2200.00,'Noche','ONP','2022-09-10'),
 (8,27,2,6,1600.00,'Tarde','ONP','2024-11-18'),
 (9,28,2,7,1300.00,'Tarde','ONP','2025-01-06'),
 (10,29,1,9,2800.00,'Partido','AFP','2023-03-13');

INSERT INTO USUARIO (ID_Usuario, ID_TipoUsuario, ID_Empleado, Logeo, Clave) VALUES
 (1,1,1,'admin',      encode(extensions.digest('admin123','sha256'),'hex')),
 (2,2,2,'cajero1',    encode(extensions.digest('cajero123','sha256'),'hex')),
 (3,3,3,'mozo1',      encode(extensions.digest('mozo123','sha256'),'hex')),
 (4,4,5,'cocina1',    encode(extensions.digest('cocina123','sha256'),'hex')),
 (5,5,10,'supervisor',encode(extensions.digest('super123','sha256'),'hex')),
 (6,6,9,'repartidor1',encode(extensions.digest('reparto123','sha256'),'hex'));

INSERT INTO USUARIO_ROL (ID_Usuario, ID_Rol, Vigente) VALUES
 (1,1,'S'), (2,3,'S'), (3,4,'S'), (4,5,'S'), (5,2,'S'), (6,6,'S');

/* ==================================================================================
   03. SALÓN
   ================================================================================== */
INSERT INTO AMBIENTE (ID_Ambiente, N_Ambiente, Descripcion, Piso) VALUES
 (1,'SALON PRINCIPAL','Área central de atención',1),
 (2,'TERRAZA','Área al aire libre',1),
 (3,'BARRA','Atención en barra',1),
 (4,'SALA VIP','Ambiente privado para eventos',2),
 (5,'ZONA PARRILLA','Mesas frente al horno de brasa',1);

INSERT INTO ESTADO_MESA (ID_EstadoMesa, Descripcion, Color) VALUES
 (1,'LIBRE','#28A745'), (2,'OCUPADA','#DC3545'), (3,'RESERVADA','#FFC107'),
 (4,'POR COBRAR','#17A2B8'), (5,'FUERA DE SERVICIO','#6C757D');

INSERT INTO TIPO_MESA (ID_TipoMesa, Descripcion, Cargo_Servicio) VALUES
 (1,'MESA ESTANDAR',0), (2,'BOX',0), (3,'BARRA',0),
 (4,'MESA VIP',10), (5,'MESA FAMILIAR',0);

INSERT INTO MESA (ID_Mesa, ID_EstadoMesa, ID_Ambiente, ID_TipoMesa, Numero, Detalle, Capacidad, Codigo_QR) VALUES
 (1,1,1,1,'01','Mesa cuadrada',4,'MESA-01'),
 (2,1,1,1,'02','Mesa cuadrada',4,'MESA-02'),
 (3,1,1,1,'03','Mesa rectangular',6,'MESA-03'),
 (4,1,1,2,'04','Box junto a ventana',6,'MESA-04'),
 (5,1,1,5,'05','Mesa familiar',8,'MESA-05'),
 (6,1,2,1,'T1','Terraza',4,'MESA-T1'),
 (7,1,2,1,'T2','Terraza',4,'MESA-T2'),
 (8,1,2,5,'T3','Terraza familiar',8,'MESA-T3'),
 (9,1,3,3,'B1','Barra',2,'MESA-B1'),
 (10,1,3,3,'B2','Barra',2,'MESA-B2'),
 (11,1,4,4,'V1','Sala VIP',10,'MESA-V1'),
 (12,1,5,1,'P1','Frente a la parrilla',6,'MESA-P1'),
 (13,1,5,1,'P2','Frente a la parrilla',6,'MESA-P2');

/* ==================================================================================
   04. CARTA DE POLLERÍA
   ================================================================================== */
INSERT INTO UNIDAD_MEDIDA (ID_Unidad, N_Unidad, Abreviatura, Codigo_SUNAT) VALUES
 (1,'UNIDAD','UND','NIU'), (2,'PORCION','POR','NIU'), (3,'JARRA','JAR','NIU'),
 (4,'VASO','VAS','NIU'), (5,'KILOGRAMO','KG','KGM'), (6,'LITRO','LT','LTR'),
 (7,'BOTELLA','BOT','NIU');

INSERT INTO CATEGORIA_PRODUCTO (ID_CategoriaProducto, N_CategoriaProducto, Descripcion, Area_Despacho, Orden_Carta) VALUES
 (1,'POLLOS A LA BRASA','Pollo a la brasa con papas y ensalada','COCINA',1),
 (2,'COMBOS FAMILIARES','Combos para compartir en familia','COCINA',2),
 (3,'PARRILLAS','Parrillas mixtas y carretilleras','COCINA',3),
 (4,'ENTRADAS Y PIQUEOS','Piqueos, tequeños y entradas','COCINA',4),
 (5,'ALITAS Y CHICHARRON','Alitas BBQ y chicharrón de pollo','COCINA',5),
 (6,'PLATOS CRIOLLOS','Chaufa, lomo saltado y platos de fondo','COCINA',6),
 (7,'BEBIDAS','Chicha morada, gaseosas, cervezas y café','BARRA',7),
 (8,'POSTRES','Postres de la casa','COCINA',8),
 (9,'SALSAS Y ADICIONALES','Salsas, papas, ensalada y delivery','COCINA',9),
 (10,'INSUMOS','Insumos de almacén (no se venden)','COCINA',99);

INSERT INTO PRODUCTO (ID_Producto, ID_CategoriaProducto, ID_Unidad, Codigo, N_Producto, Detalle,
                      Precio, Costo, Tipo_Producto, Tiempo_Preparacion) VALUES
 (1,1,1,'POL001','POLLO ENTERO A LA BRASA','Pollo entero + papas fritas familiares + ensalada clásica',81.90,32.00,'P',35),
 (2,1,2,'POL002','MEDIO POLLO A LA BRASA','1/2 pollo + papas fritas + ensalada',51.90,18.00,'P',25),
 (3,1,2,'POL003','CUARTO DE POLLO A LA BRASA','1/4 pollo + papas fritas + ensalada',26.90,9.00,'P',20),
 (4,1,1,'POL004','POLLO ENTERO SOLO','Pollo a la brasa entero, sin guarniciones',65.90,27.00,'P',30),
 (5,1,2,'POL005','MEDIO POLLO SOLO','Medio pollo a la brasa',36.90,14.00,'P',20),

 (6,2,1,'COM001','COMBO FAMILIAR DON PEPITO','1 pollo + papas familiares + ensalada + chicha morada 1.9 L',99.90,40.00,'P',40),
 (7,2,1,'COM002','COMBO NORKY','1 pollo + papas + ensalada + gaseosa 2.25 L',88.90,37.00,'P',40),
 (8,2,1,'COM003','COMBO FIESTA','1 pollo + papas + ensalada + gaseosa + arroz chaufa',103.90,44.00,'P',45),
 (9,2,2,'COM004','COMBO MEDIO POLLO + CHAUFA','1/2 pollo + papas + ensalada + arroz chaufa',58.90,23.00,'P',30),
 (10,2,2,'COM005','COMBO MEDIO POLLO + 2 GASEOSAS','1/2 pollo + papas + ensalada + 2 gaseosas personales',58.90,22.00,'P',30),
 (11,2,2,'COM006','MOSTRITO BRASA','Arroz chaufa + 1/4 pollo a la brasa + papas',34.90,13.00,'P',20),

 (12,3,1,'PAR001','PARRILLA PARA DOS','1/2 pollo, 2 anticuchos, chorizo, frankfurter, papas y ensalada',71.90,30.00,'P',40),
 (13,3,1,'PAR002','PARRILLA CARRETILLERA','Anticuchos, chorizo, molleja, pancita, papa sancochada y choclo',49.90,21.00,'P',35),
 (14,3,1,'PAR003','MEDIA PARRILLA BRASA','Bife, chuleta, 1/2 pollo, chorizo, anticucho y guarniciones',104.90,45.00,'P',45),
 (15,3,1,'PAR004','PARRILLA CLASICA','2 bifes, 2 chuletas, frankfurters, chorizos, pechuga y guarniciones',152.90,65.00,'P',55),
 (16,3,1,'PAR005','PARRILLA BRASA + GASEOSA 1.5L','Parrilla brasa completa + gaseosa 1.5 L',109.90,47.00,'P',45),
 (17,3,1,'PAR006','PARRILLA DON PEPITO','Mixta: pollo, anticucho, chorizo, chuleta y papas',89.90,38.00,'P',45),

 (18,4,2,'ENT001','PAPA A LA HUANCAINA','Porción con salsa huancaína y huevo',14.00,5.00,'P',10),
 (19,4,2,'ENT002','CAUSA LIMENA','Causa rellena de pollo',16.00,6.00,'P',12),
 (20,4,2,'ENT003','ANTICUCHOS X2','Dos palitos de corazón con papa y choclo',18.90,7.00,'P',15),
 (21,4,2,'ENT004','SALCHIPAPA ESPECIAL','Papas fritas con salchicha, huevo y salsas',16.90,6.00,'P',12),
 (22,4,2,'ENT005','TEQUEÑOS DE POLLO A LA BRASA X6','Seis tequeños rellenos de pollo a la brasa',14.90,5.50,'P',12),
 (23,4,2,'ENT006','YUQUITAS CON QUESO X6','Seis yuquitas fritas con queso',16.90,6.00,'P',12),
 (24,4,2,'ENT007','YUQUITAS CON QUESO X9','Nueve yuquitas fritas con queso',19.90,7.50,'P',15),

 (25,5,2,'ALI001','ALITAS BBQ X6','Seis alitas bañadas en salsa BBQ',16.90,6.50,'P',15),
 (26,5,2,'ALI002','ALITAS BBQ X9','Nueve alitas bañadas en salsa BBQ',19.90,8.00,'P',18),
 (27,5,2,'CHI001','CHICHARRON DE POLLO + PAPAS','Chicharrón de pollo crocante con papas fritas',20.90,8.00,'P',15),
 (28,5,2,'CHI002','PIQUEO BOX DON PEPITO','Chicharrón, alitas, tequeños y yuquitas para compartir',32.90,13.00,'P',20),

 (29,6,2,'CRI001','ARROZ CHAUFA DE POLLO','Arroz chaufa estilo criollo',28.00,10.00,'P',18),
 (30,6,2,'CRI002','LOMO SALTADO','Lomo de res con papas fritas y arroz',38.00,15.00,'P',20),
 (31,6,2,'CRI003','AJI DE GALLINA','Con arroz blanco y papa',30.00,11.00,'P',18),
 (32,6,2,'CRI004','SECO DE RES','Con frejoles y arroz',34.00,13.00,'P',25),
 (33,6,2,'CRI005','TALLARIN SALTADO','Tallarín con pollo, verdura y salsa de soya',32.00,12.00,'P',20),

 (34,7,4,'BEB001','CHICHA MORADA VASO 300 ML','Vaso de chicha morada natural',5.90,1.50,'B',2),
 (35,7,3,'BEB002','CHICHA MORADA JARRA 1 L','Jarra de 1 litro',20.90,5.50,'B',3),
 (36,7,3,'BEB003','CHICHA MORADA JARRA 1.9 L','Jarra de 1.9 litros',34.90,9.00,'B',3),
 (37,7,7,'BEB004','INCA KOLA PERSONAL 500 ML','Botella personal',6.90,3.50,'B',1),
 (38,7,7,'BEB005','INCA KOLA 1.5 L','Botella familiar',14.90,7.50,'B',1),
 (39,7,7,'BEB006','COCA COLA PERSONAL 500 ML','Botella personal',6.90,3.50,'B',1),
 (40,7,7,'BEB007','COCA COLA 1.5 L','Botella familiar',14.90,7.50,'B',1),
 (41,7,7,'BEB008','AGUA MINERAL 625 ML','Agua sin gas',4.00,1.50,'B',1),
 (42,7,3,'BEB009','LIMONADA FROZEN JARRA','Jarra de limonada frozen',12.90,3.50,'B',4),
 (43,7,7,'BEB010','CERVEZA PILSEN 620 ML','Cerveza rubia',12.00,7.00,'B',1),
 (44,7,4,'BEB011','PISCO SOUR','Copa de pisco sour',18.00,6.00,'P',6),
 (45,7,4,'BEB012','CAFE AMERICANO','Taza de café americano',8.00,2.00,'B',5),

 (46,8,2,'POS001','SUSPIRO LIMENO','Porción',12.00,4.00,'P',5),
 (47,8,2,'POS002','ARROZ CON LECHE','Porción',10.00,3.00,'P',5),
 (48,8,2,'POS003','MAZAMORRA MORADA','Porción',10.00,3.00,'P',5),
 (49,8,2,'POS004','TORTA DE CHOCOLATE','Porción',13.00,4.50,'P',5),
 (50,8,2,'POS005','HELADO DE LUCUMA','Copa de helado de lúcuma',8.00,2.50,'P',3),

 (51,9,2,'SAL001','SALSA DE AJI ESPECIAL','Porción de salsa de ají de la casa',2.00,0.50,'P',2),
 (52,9,2,'SAL002','CREMA DE ROCOTO','Porción de crema de rocoto',2.00,0.60,'P',2),
 (53,9,2,'ADI001','PAPAS FRITAS ADICIONAL','Porción adicional',10.00,3.00,'P',10),
 (54,9,2,'ADI002','ENSALADA CLASICA ADICIONAL','Porción adicional de ensalada',8.00,2.50,'P',5),
 (55,9,2,'ADI003','ARROZ BLANCO','Porción de arroz blanco',6.00,1.50,'P',5),
 (56,9,2,'ADI004','PORCION DE CHAUFA','Porción de arroz chaufa',8.00,2.80,'P',8),
 (65,9,2,'SER001','SERVICIO DE DELIVERY','Envío a domicilio dentro de la zona de reparto',6.00,0.00,'P',0),

 (57,10,5,'INS001','POLLO FRESCO ENTERO','Insumo: pollo entero fresco',15.00,12.00,'I',NULL),
 (58,10,5,'INS002','PAPA AMARILLA','Insumo: papa amarilla',6.00,4.50,'I',NULL),
 (59,10,5,'INS003','CARBON VEGETAL','Insumo: carbón para el horno',5.00,3.50,'I',NULL),
 (60,10,5,'INS004','MAIZ MORADO','Insumo: maíz morado',8.00,6.00,'I',NULL),
 (61,10,5,'INS005','ARROZ EXTRA','Insumo: arroz extra',5.00,3.50,'I',NULL),
 (62,10,6,'INS006','ACEITE VEGETAL','Insumo: aceite vegetal',9.00,7.00,'I',NULL),
 (63,10,5,'INS007','HARINA SIN PREPARAR','Insumo: harina',4.50,3.00,'I',NULL),
 (64,10,5,'INS008','SAL INDUSTRIAL','Insumo: sal',2.00,1.00,'I',NULL);

UPDATE PRODUCTO p
   SET Controla_Stock = 'S', Stock_Actual = v.stock, Stock_Minimo = v.minimo
FROM (VALUES
    ('INS001',120,30), ('INS002',200,50), ('INS003',80,20), ('INS004',30,10),
    ('INS005',100,25), ('INS006',50,15), ('INS007',40,10), ('INS008',25,5),
    ('BEB004',48,12), ('BEB005',30,12), ('BEB006',36,12), ('BEB007',24,12),
    ('BEB010',24,12)
) AS v(codigo, stock, minimo)
WHERE p.Codigo = v.codigo;

/* ==================================================================================
   05. PARÁMETROS DE PEDIDOS Y CAJA
   ================================================================================== */
INSERT INTO TIPO_PEDIDO (ID_TipoPedido, N_TipoPedido, Abreviatura, Requiere_Mesa) VALUES
 (1,'EN SALON','SALON','S'), (2,'PARA LLEVAR','LLEVAR','N'), (3,'DELIVERY','DELIV','N');

INSERT INTO ESTADO_PEDIDO (ID_EstadoPedido, Descripcion, Orden, Color) VALUES
 (1,'ABIERTO',1,'#0D6EFD'), (2,'EN PREPARACION',2,'#FD7E14'), (3,'SERVIDO',3,'#20C997'),
 (4,'FACTURADO',4,'#198754'), (5,'ANULADO',5,'#DC3545');

INSERT INTO METODO_PAGO (ID_MetodoPago, N_MetodoPago, Afecta_Efectivo, Requiere_Referencia, Comision) VALUES
 (1,'EFECTIVO','S','N',0), (2,'VISA','N','S',3.50), (3,'MASTERCARD','N','S',3.50),
 (4,'YAPE','N','S',0), (5,'PLIN','N','S',0), (6,'TRANSFERENCIA','N','S',0),
 (7,'CREDITO EMPRESA','N','N',0);

INSERT INTO TIPO_MOVIMIENTO_CAJA (ID_TipoMovimiento, N_TipoMovimiento, Abreviatura, Signo) VALUES
 (1,'INGRESO','ING','+'), (2,'EGRESO','EGR','-');

INSERT INTO CONCEPTO_CAJA (ID_Concepto, ID_TipoMovimiento, N_Concepto, Descripcion, Afecta_Efectivo) VALUES
 (1,1,'VENTA AL CONTADO','Cobro de comprobante emitido','S'),
 (2,1,'COBRO CON TARJETA','Cobro con POS','N'),
 (3,1,'COBRO BILLETERA DIGITAL','Yape / Plin','N'),
 (4,1,'ADELANTO DE RESERVA','Adelanto por reserva de mesa','S'),
 (5,1,'FONDO FIJO','Reposición de fondo fijo','S'),
 (6,1,'PROPINA','Propina recibida','S'),
 (7,2,'COMPRA DE INSUMOS','Compra menor de insumos','S'),
 (8,2,'PAGO DE SERVICIOS','Agua, luz, internet','S'),
 (9,2,'ADELANTO DE PERSONAL','Adelanto de sueldo','S'),
 (10,2,'DEVOLUCION A CLIENTE','Devolución por anulación','S'),
 (11,2,'RETIRO A BOVEDA','Traslado de efectivo','S'),
 (12,2,'GASTO DE MOVILIDAD','Movilidad y delivery','S');

INSERT INTO CAJA (ID_Caja, N_Caja, Descripcion, Ubicacion, Serie_Terminal, Moneda, Monto_Base) VALUES
 (1,'CAJA 01','Caja principal del salón','Ingreso principal','TERM-001','PEN',200.00),
 (2,'CAJA 02','Caja de barra','Barra','TERM-002','PEN',100.00);

INSERT INTO SERIE_DOCUMENTO (ID_Serie, ID_Caja, Tipo_Documento, Serie, Correlativo) VALUES
 (1,1,'03','B001',0), (2,1,'01','F001',0), (3,1,'07','BC01',0), (4,1,'TK','T001',0),
 (5,2,'03','B002',0), (6,2,'01','F002',0);

/* ==================================================================================
   06. APERTURA DE CAJA DEL DÍA
   ================================================================================== */
SELECT * FROM sp_aperturar_caja(1, 1, 200.00, to_char(now(), 'YYYYMMDD') || '-T1');

UPDATE APERTURA_CAJA
   SET F_Apertura = now() - interval '11 hours',
       FECCRE     = now() - interval '11 hours'
 WHERE ID_Caja = 1 AND Situacion = 'A';

/* Turno de barra ya cerrado, para demostrar el arqueo de caja */
SELECT * FROM sp_aperturar_caja(2, 2, 100.00, to_char(now(), 'YYYYMMDD') || '-T2');

SELECT * FROM sp_cerrar_caja(
    (SELECT ID_AperturaCaja FROM APERTURA_CAJA
      WHERE ID_Caja = 2 ORDER BY ID_AperturaCaja DESC LIMIT 1),
    2, 100.00, 'Cierre de turno de barra sin movimiento');

/* ==================================================================================
   07. OPERACIÓN DEL DÍA: PEDIDOS, VENTAS, BOLETAS/FACTURAS Y PAGOS
   ----------------------------------------------------------------------------------
   Se usan las funciones del modelo para que los totales, IGV, correlativos,
   movimientos de caja y puntos queden consistentes.
   ================================================================================== */
DO $$
DECLARE
    o            jsonb;
    it           jsonb;
    v_pedido     int;
    v_venta      int;
    v_fecha      timestamptz;
    v_total      numeric(12,2);
    v_doc        char(2);
BEGIN
    FOR o IN SELECT * FROM jsonb_array_elements($json$
    [
      {"horas":10.5,"tipo":1,"mesa":1,"cliente":2,"empleado":3,"comensales":3,"doc":"03","metodo":1,"recibido":120,"ref":null,
       "items":[[1,1,null],[35,1,null],[18,1,"Sin ají"]]},

      {"horas":9.25,"tipo":1,"mesa":6,"cliente":3,"empleado":4,"comensales":2,"doc":"03","metodo":4,"recibido":null,"ref":"YAPE-884512",
       "items":[[2,2,null],[34,2,null],[46,2,null]]},

      {"horas":8.5,"tipo":2,"mesa":null,"cliente":4,"empleado":3,"comensales":1,"doc":"03","metodo":2,"recibido":null,"ref":"VISA-7712",
       "items":[[6,1,"Para llevar, papas bien crocantes"],[25,1,null]]},

      {"horas":7.75,"tipo":1,"mesa":4,"cliente":12,"empleado":10,"comensales":6,"doc":"01","metodo":6,"recibido":null,"ref":"TRF-2026-0045",
       "items":[[15,1,"Término medio"],[36,1,null],[43,2,null]]},

      {"horas":5.0,"tipo":3,"mesa":null,"cliente":5,"empleado":9,"comensales":2,"doc":"03","metodo":1,"recibido":120,"ref":null,
       "distrito":3,"direccion":"Av. Javier Prado Este 2450, dpto 402","referencia":"Edificio azul, frente al parque","telefono":"987654321",
       "items":[[7,1,null],[65,1,null],[50,2,null]]},

      {"horas":4.5,"tipo":1,"mesa":3,"cliente":6,"empleado":3,"comensales":4,"doc":"03","metodo":5,"recibido":null,"ref":"PLIN-33210",
       "items":[[11,2,null],[37,2,null]]},

      {"horas":4.0,"tipo":1,"mesa":8,"cliente":7,"empleado":4,"comensales":6,"doc":"03","metodo":2,"recibido":null,"ref":"VISA-9901",
       "items":[[12,1,null],[19,1,null],[35,1,null]]},

      {"horas":3.5,"tipo":2,"mesa":null,"cliente":13,"empleado":10,"comensales":4,"doc":"01","metodo":6,"recibido":null,"ref":"TRF-2026-0046",
       "items":[[8,1,"Sin cebolla"],[27,1,null]]},

      {"horas":3.0,"tipo":1,"mesa":2,"cliente":8,"empleado":3,"comensales":2,"doc":"03","metodo":1,"recibido":70,"ref":null,
       "items":[[3,2,null],[34,2,null]]},

      {"horas":2.5,"tipo":3,"mesa":null,"cliente":11,"empleado":9,"comensales":2,"doc":"03","metodo":4,"recibido":null,"ref":"YAPE-884577",
       "distrito":4,"direccion":"Av. Raúl Ferrero 1250, casa 12","referencia":"Portón negro","telefono":"999888777",
       "items":[[16,1,null],[65,1,null],[51,2,null]]},

      {"horas":2.0,"tipo":1,"mesa":11,"cliente":10,"empleado":10,"comensales":8,"doc":"03","metodo":3,"recibido":null,"ref":"MC-5521",
       "items":[[4,2,null],[36,2,null],[49,2,null]]},

      {"horas":1.5,"tipo":2,"mesa":null,"cliente":9,"empleado":3,"comensales":2,"doc":"03","metodo":1,"recibido":100,"ref":null,
       "items":[[13,1,null],[44,2,null]]},

      {"horas":1.0,"tipo":1,"mesa":7,"cliente":3,"empleado":4,"comensales":2,"doc":"03","metodo":1,"recibido":40,"ref":null,
       "descuento":1.00,"canje":100,
       "items":[[3,1,null],[34,1,null]]}
    ]
    $json$) LOOP
        v_fecha := now() - ((o->>'horas')::numeric * interval '1 hour');
        v_doc   := (o->>'doc')::char(2);

        SELECT id_pedido_out INTO v_pedido
        FROM sp_abrir_pedido(
            (o->>'tipo')::int,
            CASE WHEN v_doc = '01' THEN 1 ELSE 2 END,
            (o->>'mesa')::int,
            (o->>'cliente')::int,
            (o->>'empleado')::int,
            (o->>'comensales')::int,
            CASE WHEN (o->>'tipo')::int = 3 THEN 'Pedido por delivery' ELSE NULL END
        );

        FOR it IN SELECT * FROM jsonb_array_elements(o->'items') LOOP
            PERFORM sp_agregar_detalle_pedido(
                v_pedido, (it->>0)::int, (it->>1)::numeric, it->>2);
        END LOOP;

        IF o ? 'descuento' THEN
            UPDATE PEDIDO SET Descuento = (o->>'descuento')::numeric WHERE ID_Pedido = v_pedido;
            PERFORM sp_recalcular_pedido(v_pedido);
        END IF;

        SELECT id_venta_out, total_out INTO v_venta, v_total
        FROM sp_facturar_pedido(
            v_pedido,
            CASE WHEN v_doc = '01' THEN 1 ELSE 2 END,
            (SELECT ID_AperturaCaja FROM APERTURA_CAJA WHERE ID_Caja = 1 AND Situacion = 'A'),
            v_doc,
            (o->>'cliente')::int,
            (o->>'metodo')::int,
            (o->>'recibido')::numeric,
            o->>'ref'
        );

        /* Fechas coherentes con la operación del día */
        UPDATE PEDIDO
           SET F_Pedido = v_fecha,
               F_Cierre = v_fecha + interval '50 minutes',
               FECCRE   = v_fecha
         WHERE ID_Pedido = v_pedido;

        UPDATE DETALLE_PEDIDO
           SET Estado_Preparacion = 'S',
               F_Solicitud = v_fecha,
               F_Atencion  = v_fecha + interval '30 minutes'
         WHERE ID_Pedido = v_pedido;

        UPDATE VENTA
           SET F_Venta = v_fecha + interval '50 minutes',
               FECCRE  = v_fecha + interval '50 minutes'
         WHERE ID_Venta = v_venta;

        UPDATE BOLETA
           SET F_Emision = v_fecha + interval '50 minutes',
               Estado_SUNAT = 'ACEPTADO'
         WHERE ID_Venta = v_venta;

        UPDATE FACTURA
           SET F_Emision = v_fecha + interval '50 minutes',
               Estado_SUNAT = 'ACEPTADO'
         WHERE ID_Venta = v_venta;

        UPDATE PAGO_VENTA
           SET F_Pago = v_fecha + interval '50 minutes',
               FECCRE = v_fecha + interval '50 minutes'
         WHERE ID_Venta = v_venta;

        UPDATE MOVIMIENTO_CAJA
           SET F_Movimiento = v_fecha + interval '50 minutes',
               FECCRE       = v_fecha + interval '50 minutes'
         WHERE ID_Venta = v_venta;

        UPDATE TRANSACCION_PUNTOS
           SET FECCRE = v_fecha + interval '50 minutes'
         WHERE ID_Venta = v_venta;

        IF o ? 'canje' THEN
            PERFORM sp_canjear_puntos((o->>'cliente')::int, v_venta, (o->>'canje')::int);
        END IF;

        IF (o->>'tipo')::int = 3 THEN
            INSERT INTO PEDIDO_DELIVERY (
                ID_Pedido, ID_Distrito, ID_Empleado, Direccion_Entrega, Referencia,
                Telefono_Contacto, Costo_Envio, F_Salida, F_Entrega, Situacion)
            VALUES (
                v_pedido, (o->>'distrito')::int, (o->>'empleado')::int,
                o->>'direccion', o->>'referencia', o->>'telefono', 6.00,
                v_fecha + interval '55 minutes', v_fecha + interval '80 minutes', 'E');
        END IF;
    END LOOP;

    /* Comanda abierta (aún no facturada) para el mapa de mesas y la cocina */
    SELECT id_pedido_out INTO v_pedido
    FROM sp_abrir_pedido(1, 3, 5, 3, 4, 4, 'Mesa junto a la ventana, cumpleaños');

    PERFORM sp_agregar_detalle_pedido(v_pedido, 9, 1, 'Sin ají');
    PERFORM sp_agregar_detalle_pedido(v_pedido, 25, 1, NULL);
    PERFORM sp_recalcular_pedido(v_pedido);

    UPDATE PEDIDO SET ID_EstadoPedido = 2 WHERE ID_Pedido = v_pedido;
    UPDATE DETALLE_PEDIDO SET Estado_Preparacion = 'E' WHERE ID_Pedido = v_pedido;
END $$;

/* ==================================================================================
   08. RESERVAS
   ================================================================================== */
INSERT INTO RESERVA (ID_Cliente, ID_Mesa, ID_Usuario, F_Reserva, N_Personas, Adelanto, Situacion, Observacion) VALUES
 (2, 11, 3, (date_trunc('day', timezone('America/Lima', now())) + interval '2 days 20 hours') AT TIME ZONE 'America/Lima',
  8, 100.00, 'C', 'Cumpleaños de la señora Quispe'),
 (3, 4, 3, (date_trunc('day', timezone('America/Lima', now())) + interval '3 days 19 hours 30 minutes') AT TIME ZONE 'America/Lima',
  6, 0.00, 'P', 'Reunión de trabajo'),
 (7, 8, 3, (date_trunc('day', timezone('America/Lima', now())) + interval '5 days 13 hours') AT TIME ZONE 'America/Lima',
  8, 50.00, 'C', 'Almuerzo familiar'),
 (9, 5, 3, (date_trunc('day', timezone('America/Lima', now())) + interval '1 day 20 hours 30 minutes') AT TIME ZONE 'America/Lima',
  6, 30.00, 'C', 'Reserva con adelanto por Yape');

/* ==================================================================================
   09. INVENTARIO: MOVIMIENTOS Y RECETAS
   ================================================================================== */
INSERT INTO MOVIMIENTO_INVENTARIO (ID_Producto, ID_Usuario, Tipo_Movimiento, Cantidad, Stock_Anterior,
                                   Stock_Nuevo, Costo_Unitario, Documento, Observacion, F_Movimiento) VALUES
 (57, 5, 'E',  80.000,  40.000, 120.000, 12.00, 'FAC-001-4587', 'Compra de pollos frescos', now() - interval '9 hours'),
 (58, 5, 'E', 120.000,  80.000, 200.000,  4.50, 'FAC-001-4588', 'Compra de papa amarilla', now() - interval '9 hours'),
 (59, 5, 'E',  50.000,  30.000,  80.000,  3.50, 'FAC-001-4589', 'Compra de carbón vegetal', now() - interval '8 hours'),
 (60, 5, 'E',  20.000,  10.000,  30.000,  6.00, 'FAC-001-4590', 'Compra de maíz morado', now() - interval '8 hours'),
 (62, 5, 'E',  30.000,  20.000,  50.000,  7.00, 'FAC-001-4591', 'Compra de aceite vegetal', now() - interval '8 hours'),
 (57, 4, 'M',   5.000, 125.000, 120.000, 12.00, NULL, 'Merma por corte y limpieza', now() - interval '6 hours');

INSERT INTO RECETA (ID_Producto, ID_Insumo, Cantidad) VALUES
 (1, 57, 1.200), (1, 58, 0.800), (1, 59, 0.600),
 (2, 57, 0.600), (2, 58, 0.400), (2, 59, 0.300),
 (3, 57, 0.300), (3, 58, 0.200), (3, 59, 0.150),
 (35, 60, 0.150),
 (36, 60, 0.280),
 (34, 60, 0.050),
 (29, 61, 0.250),
 (53, 58, 0.300);

/* ==================================================================================
   10. AJUSTE DE SECUENCIAS DE IDENTITY
   ----------------------------------------------------------------------------------
   Los datos de ejemplo usan IDs explícitos; se sincronizan las secuencias para que
   los próximos INSERT generen IDs correctos.
   ================================================================================== */
DO $$
DECLARE
    r     record;
    v_max bigint;
    v_seq text;
BEGIN
    FOR r IN
        SELECT c.table_name, c.column_name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.is_identity = 'YES'
    LOOP
        v_seq := pg_get_serial_sequence(format('public.%I', r.table_name), r.column_name);

        IF v_seq IS NOT NULL THEN
            EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM public.%I', r.column_name, r.table_name)
               INTO v_max;

            IF v_max = 0 THEN
                PERFORM setval(v_seq, 1, false);
            ELSE
                PERFORM setval(v_seq, v_max, true);
            END IF;
        END IF;
    END LOOP;
END $$;
