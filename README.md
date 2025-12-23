# Colmado Digital SPA

Aplicación de una sola página con catálogo, carrito y panel Admin para un colmado. No requiere instalación de dependencias: solo sirve los archivos estáticos desde la carpeta `app/`.

## Cómo ejecutar

1. Desde la raíz del repositorio, inicia un servidor estático apuntando a `app/` (ejemplos):
   - `python -m http.server 4173 --directory app`
   - o abre `app/index.html` directamente en tu navegador.
2. Visita `http://localhost:4173` en tu navegador.
3. Usa el botón flotante o las secciones para navegar.

## Acceso al panel Admin

- PIN por defecto: **1234**.
- Desde la sección “Panel Admin” ingresa el PIN para desbloquear.
- Configura:
  - Datos generales (nombre del negocio, WhatsApp, dirección, mapa, horarios, mensaje del hero, tema y PIN).
  - CRUD de productos (precio, stock, etiquetas, disponibilidad, imagen, categoría).
  - Editor rápido de precios y stock.
  - Ofertas del día y combos con duración opcional y activación.
  - Botón "Generar/Recargar catálogo automático" para cargar 100 productos de ejemplo.

## Funcionalidades destacadas

- Modo claro/oscuro y tipografía profesional (Inter).
- Catálogo virtualizado (react-window) con 80–150 productos precargados, imágenes, etiquetas, precio en RD$, stock y disponibilidad.
- Filtros y ordenamiento por popularidad o precio, búsqueda en vivo.
- Ofertas del día y combos con temporizador.
- Carrito con cantidades, nota y dirección; genera mensaje formateado listo para WhatsApp.
- Persistencia en `localStorage` para configuración, catálogo, ofertas, combos y carrito.
- Secciones de contacto y ubicación con enlace a Google Maps y un ícono flotante de soporte.
