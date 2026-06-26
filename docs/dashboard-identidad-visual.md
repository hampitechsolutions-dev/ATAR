# Dashboard Identity Visual

## Objetivo

Este documento deja trazabilidad del criterio visual aplicado a los paneles de comprador y proveedor para mantener coherencia con la identidad publica de ATAR.

## Referencias tomadas

- Landing principal de ATAR
- Vista publica de proveedores
- Referencias visuales adjuntas para paneles y secciones comerciales

## Sistema visual aplicado

### Paleta

- Base clara: `white`, `slate-50`, `slate-100`, `slate-200`
- Texto principal: `slate-950`
- Texto secundario: `slate-600`, `slate-500`
- Acento principal: `indigo-600`
- Acentos secundarios: `violet`, `sky`, `emerald`, `amber`, `rose`
- Superficies oscuras destacadas: gradientes entre `#07111f`, `slate-950`, `indigo-900`

### Tipografia

- Fuente base: `Inter`
- Jerarquia:
  - heroes de dashboard: `text-3xl` a `text-4xl`
  - titulos de seccion: `text-xl`
  - eyebrow labels: uppercase con tracking amplio
  - texto de apoyo: `text-sm` con `leading-7`

### Espaciado y radios

- Layout general: `max-w-7xl`
- Contenedores principales: `rounded-[2rem]`
- Tarjetas internas: `rounded-[1.5rem]`
- Controles y botones: `rounded-full` o `rounded-[1.25rem]`
- Separacion vertical estandar: `space-y-6`

### Botones

- Primario: fondo `indigo-600`, texto blanco, radio completo
- Secundario: borde `slate-300`, fondo blanco
- Terciario destacado: borde/acento `indigo-200` con fondo `indigo-50`

### Tarjetas y sombras

- Tarjeta base: borde claro + fondo blanco + sombra suave
- Tarjeta oscura: gradiente oscuro con brillo radial superior
- Tarjeta estadistica: superficie clara con metrica principal y helper en indigo

## Responsividad

- Sidebar apilada arriba en mobile y sticky en desktop
- Grid principal: `1 columna` en mobile, `2-4 columnas` segun contenido desde `md/xl`
- Heroes con acciones en columna para mobile y fila desde `sm/lg`
- Tarjetas operativas con bloques apilados en mobile para evitar overflow horizontal

## Compatibilidad

- Se usan utilidades estables de Tailwind y CSS moderno compatible con Chrome, Edge, Firefox y Safari actuales
- No se incorporaron dependencias visuales con APIs experimentales
- La validacion tecnica se apoya en diagnosticos del editor y build/tipos del proyecto

## Componentes base creados

- `apps/web/src/components/dashboard/dashboard-ui.tsx`
- `apps/web/src/components/dashboard/dashboard-sidebar.tsx`

## Criterio de uso

- Todo nuevo modulo de dashboard debe construirse a partir de `DashboardShell`, `DashboardHero`, `DashboardCard`, `DashboardStatCard` y los estilos de botones/inputs compartidos
- Evitar clases aisladas que rompan la identidad general
