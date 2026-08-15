# Subscription Admin Web

Frontend admin para la plataforma de suscripciones `subscription-platform`.

## Tecnologias

- React 19
- Vite
- TypeScript
- React Router DOM
- Axios

## Scripts

- `npm run dev` — Servidor de desarrollo en puerto 5173
- `npm run build` — Build de produccion
- `npm run preview` — Preview del build

## Estructura

```
src/
  components/  # Componentes reutilizables (Layout)
  hooks/       # Custom hooks
  pages/       # Pagas por modulo
  services/    # Llamadas API (axios)
  styles/      # Estilos globales
  utils/       # Utilidades
```

## Paginas

- `/dashboard` — Dashboard resumen
- `/customers` — Lista de clientes
- `/applications` — Gestion de aplicaciones
- `/plans` — Gestion de planes
- `/subscriptions` — Lista de suscripciones
- `/invoices` — Lista de facturas
- `/payments` — Lista de pagos
- `/penalties` — Lista de multas
- `/extensions` — Lista de prorrogas
- `/entitlements` — Validacion de acceso
- `/service-tokens` — Gestion de tokens para integraciones

## Service tokens

Los service tokens se crean desde `/service-tokens`. El token plano se muestra una sola vez y debe guardarse en el `.env` del backend que va a consumir `POST /api/v1/entitlements/validate`.

## Configuracion

La API base se configura con la variable de entorno `VITE_API_URL`.

```env
VITE_API_URL=https://subscription-platform-api.onrender.com/api/v1
```

En local, si no se define, usa `http://localhost:3000/api/v1`.
El token de autenticacion se almacena en `localStorage` con clave `token`.
