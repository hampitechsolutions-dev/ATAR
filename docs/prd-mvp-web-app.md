# PRD MVP - ATAR Web + App

## 1. Objetivo Del Documento

Definir el alcance del MVP de ATAR considerando desde el inicio dos experiencias de uso:

- plataforma web,
- aplicacion mobile.

El MVP debe validar si compradores, proveedores y vendedores utilizan el flujo central de demanda, cotizacion y adjudicacion en un entorno industrial real.

## 2. Vision Del MVP

ATAR MVP debe permitir que una empresa compradora publique una necesidad, que proveedores respondan con cotizaciones privadas y que el cliente compare y adjudique, con trazabilidad comercial y operativa basica.

La web y la app no deben ser productos distintos. Deben compartir:

- cuentas,
- empresas,
- roles,
- datos,
- reglas de negocio,
- historial operativo.

## 3. Objetivo De Negocio

Validar tres hipotesis principales:

1. que los compradores industriales publican necesidades reales en una plataforma digital;
2. que los proveedores responden cotizaciones privadas dentro de tiempos utiles;
3. que existe valor suficiente para generar recurrencia y futura monetizacion.

## 4. Objetivo De Producto

Construir un flujo minimo pero completo para:

- captar demanda,
- organizar oferta,
- comparar propuestas,
- registrar adjudicaciones,
- dar visibilidad a vendedores y administradores.

## 5. Usuarios Del MVP

### 5.1 Comprador

Puede:

- registrarse,
- cargar empresa,
- publicar pedido,
- adjuntar archivo,
- invitar proveedores,
- recibir propuestas,
- comparar,
- adjudicar.

### 5.2 Proveedor

Puede:

- registrarse,
- cargar empresa,
- completar perfil comercial,
- cargar catalogo simple,
- recibir pedidos,
- enviar cotizaciones privadas,
- consultar historial.

### 5.3 Vendedor

Puede:

- registrarse,
- asociarse a empresa o proveedor,
- ver oportunidades asignadas,
- dar seguimiento,
- registrar actividad comercial,
- consultar su cartera basica.

### 5.4 Administrador

Puede:

- aprobar usuarios,
- gestionar incidencias basicas,
- auditar pedidos y cotizaciones,
- intervenir en validaciones,
- ver metricas iniciales.

## 6. Plataformas Del MVP

### Web

Debe ser la plataforma mas completa en el MVP porque concentra:

- alta administrativa,
- gestion detallada de pedidos,
- carga documental,
- comparacion avanzada,
- panel admin.

### App Mobile

Debe enfocarse en los flujos de mayor frecuencia y urgencia:

- login,
- notificaciones,
- ver pedidos,
- responder cotizaciones,
- seguimiento de oportunidades,
- consultar estado de adjudicaciones,
- actividad del vendedor.

Recomendacion:

- priorizar experiencia mobile para consulta, respuesta rapida y seguimiento;
- priorizar experiencia web para configuracion, carga extensa y administracion.

## 7. Problemas Que Resuelve El MVP

- dependencia de telefono, WhatsApp y Excel;
- falta de trazabilidad comercial;
- dificultad para comparar proveedores;
- tiempos de respuesta desordenados;
- baja visibilidad del origen comercial de una operacion.

## 8. Propuesta De Valor Del MVP

Para compradores:

- publican una necesidad una sola vez,
- reciben multiples propuestas privadas,
- comparan con mas contexto.

Para proveedores:

- acceden a pedidos concretos,
- responden de forma ordenada,
- mejoran su visibilidad comercial.

Para vendedores:

- registran seguimiento,
- protegen cartera,
- dejan trazabilidad de su intervencion.

## 9. Alcance Funcional Del MVP

### 9.1 Autenticacion Y Acceso

- registro por email y password;
- recuperacion de acceso;
- roles basicos;
- asociacion a empresa;
- aprobacion inicial por administrador.

### 9.2 Perfil De Empresa

- razon social;
- CUIT o equivalente;
- pais;
- provincia/ciudad;
- rubro;
- datos de contacto;
- tipo de actor.

### 9.3 Publicacion De Pedido

- titulo;
- descripcion;
- categoria;
- fecha limite;
- adjuntos;
- modalidad abierta o privada;
- opcion de invitar proveedores.

### 9.4 Catalogo Basico De Proveedor

- productos;
- categoria;
- descripcion tecnica;
- ficha tecnica adjunta;
- plazo de entrega;
- minimo de compra;
- zona de cobertura;
- financiacion opcional.

### 9.5 Cotizacion Privada

- precio opcional si el caso requiere solo alternativa;
- plazo;
- condiciones de pago;
- comentario tecnico;
- adjuntos;
- estado de envio.

### 9.6 Comparador De Propuestas

El comprador debe poder ver:

- proveedor;
- importe;
- plazo;
- condiciones;
- observaciones;
- adjuntos;
- estado.

### 9.7 Adjudicacion

- seleccion de proveedor;
- confirmacion;
- registro de fecha y usuario;
- cambio de estado del pedido.

### 9.8 CRM Basico Del Vendedor

- oportunidades asignadas;
- estado de seguimiento;
- notas;
- proxima accion;
- historial resumido.

### 9.9 Panel Administrativo

- aprobacion de usuarios;
- visualizacion de pedidos;
- visualizacion de cotizaciones;
- auditoria basica;
- metricas iniciales.

## 10. Fuera De Alcance Del MVP

- pagos integrados;
- logistica integrada;
- firma digital avanzada;
- IA de recomendacion compleja;
- reputacion completa;
- factorizacion, seguros o financiacion operativa;
- comisiones automaticas liquidadas dentro de la plataforma.

## 11. Flujos Principales

### Flujo 1 - Comprador Publica Pedido

1. usuario comprador inicia sesion;
2. completa o valida perfil de empresa;
3. crea pedido;
4. adjunta informacion;
5. publica o invita proveedores;
6. recibe confirmacion.

### Flujo 2 - Proveedor Cotiza

1. proveedor recibe aviso;
2. abre pedido en web o app;
3. revisa detalle;
4. carga cotizacion privada;
5. envia propuesta;
6. consulta estado.

### Flujo 3 - Comprador Compara Y Adjudica

1. comprador revisa propuestas;
2. compara variables;
3. selecciona adjudicatario;
4. confirma;
5. queda trazabilidad de la accion.

### Flujo 4 - Vendedor Hace Seguimiento

1. vendedor visualiza oportunidad;
2. registra contacto o avance;
3. deja nota;
4. sistema mantiene historial.

## 12. Historias De Usuario Clave

### Comprador

- Como comprador quiero publicar un pedido para recibir propuestas de distintos proveedores.
- Como comprador quiero comparar cotizaciones sin que los proveedores vean las ofertas de otros.
- Como comprador quiero adjudicar una propuesta y dejar constancia del resultado.

### Proveedor

- Como proveedor quiero recibir pedidos relevantes para cotizar de forma ordenada.
- Como proveedor quiero responder desde web o app para no perder oportunidades.
- Como proveedor quiero adjuntar documentacion tecnica a mi propuesta.

### Vendedor

- Como vendedor quiero ver mis oportunidades y registrar seguimiento.
- Como vendedor quiero mantener trazabilidad de las cuentas que trabajo.

### Administrador

- Como administrador quiero aprobar usuarios y empresas antes de habilitar operacion plena.
- Como administrador quiero auditar pedidos y cotizaciones ante reclamos basicos.

## 13. Criterios De Aceptacion Base

### Pedido

- un comprador autenticado puede crear pedido;
- el sistema valida campos obligatorios;
- el pedido queda visible para el comprador;
- si es privado, solo ven el pedido los invitados y administradores.

### Cotizacion

- un proveedor habilitado puede cotizar un pedido visible para el;
- la propuesta queda asociada al pedido;
- otros proveedores no visualizan su contenido;
- el comprador puede abrirla y compararla.

### Adjudicacion

- solo el comprador creador o usuario autorizado puede adjudicar;
- la adjudicacion cambia el estado del pedido;
- el sistema registra fecha, usuario y proveedor seleccionado.

### Seguimiento Del Vendedor

- un vendedor puede registrar una nota en una oportunidad asignada;
- la nota queda asociada al historial;
- la actividad se muestra en orden cronologico.

## 14. Requerimientos No Funcionales

- experiencia responsive en web;
- tiempos de carga razonables en conexiones medias;
- seguridad de acceso por rol;
- logs basicos de auditoria;
- almacenamiento seguro de adjuntos;
- base preparada para escalar a multiples paises.

## 15. Metricas Del MVP

- cantidad de empresas registradas;
- cantidad de pedidos publicados;
- porcentaje de pedidos con cotizacion;
- tiempo medio de primera respuesta;
- cantidad de adjudicaciones;
- frecuencia de uso web vs app;
- cantidad de seguimientos registrados por vendedores.

## 16. Riesgos Del MVP

- querer dar paridad completa entre web y app demasiado pronto;
- construir demasiadas opciones administrativas antes de validar demanda;
- sobrecargar al proveedor con formularios largos;
- falta de definicion legal sobre responsabilidades.

## 17. Recomendacion De Priorizacion

Orden recomendado de construccion:

1. backend comun y modelo de roles;
2. web de comprador, proveedor y admin;
3. app mobile para consulta, notificaciones y respuesta;
4. CRM del vendedor;
5. reportes y optimizacion.
