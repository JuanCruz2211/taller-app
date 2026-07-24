<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# taller-app — Sistema de Gestión para Talleres Mecánicos

App web para que talleres mecánicos argentinos administren clientes, vehículos, servicios, y recordatorios de vencimientos. Multi-tenant (cada taller ve solo sus datos).

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript (strict) |
| Base de datos | PostgreSQL via Neon (serverless) |
| ORM | Drizzle ORM |
| Autenticación | Better Auth |
| Testing | Vitest + @testing-library/react |
| Estilos | Tailwind CSS |
| PDF | @react-pdf/renderer |

## Arquitectura

### Patrón
- **API Routes**: `src/app/api/{recurso}/route.ts` — handlers HTTP puros, sin RSC
- **Server Components**: `src/app/dashboard/*/page.tsx` — fetching de datos en el server
- **Client Components**: `src/features/{dominio}/components/` — forms, listas, cards
- **DB queries**: Drizzle ORM en server components y API routes
- **Auth**: Better Auth con nanostores (no requiere AuthProvider)

### Multi-tenant
Cada usuario tiene un `workshopId` asociado. Todas las queries filtran por `workshopId`. El helper `getWorkshopId(headers())` obtiene el taller del usuario autenticado.

### Decisiones técnicas clave

| Decisión | Por qué |
|---|---|
| **Better Auth en vez de NextAuth** | Mejor DX con TypeScript, nanostores (sin providers), built-in email/password |
| **Neon (PostgreSQL) en vez de SQLite** | Serverless, escalable, mismo SQL que producción |
| **Drizzle en vez de Prisma** | Bundle más chico, SQL explícito, mejor performance en serverless |
| **Sin `db.transaction`** | El driver HTTP de Neon no soporta BEGIN/COMMIT. Usar queries secuenciales |
| **`getWorkshopId()` en vez de `Number(session.user.id)`** | Better Auth usa IDs string, no numéricos |
| **Fuente Helvetica built-in en PDFs** | @react-pdf no soporta variable fonts, y las fuentes estáticas de Google Fonts cambian URLs sin aviso |
| **@react-pdf en serverExternalPackages** | Necesario porque v4 usa React APIs que el RSC compiler de Next.js elimina |
| **Sin jest-dom** | Node 20 < v22 no soporta la sintaxis que necesita. Usamos propiedades directas del DOM |

## Features implementadas

### API (CRUD completo)
| Ruta | Operaciones |
|---|---|
| `/api/customers` + `/[id]` | GET listar/buscar, POST crear, PUT actualizar, DELETE eliminar |
| `/api/vehicles` + `/[id]` | GET listar/buscar, POST crear, PUT actualizar, DELETE eliminar |
| `/api/services` + `/[id]` | GET listar, POST crear, PUT actualizar, DELETE eliminar |
| `/api/services/[id]/finalize` | POST finalizar servicio (fecha, km, monto) |
| `/api/workshops` | GET leer settings, PUT actualizar |
| `/api/signup` | GET listar interesados, POST registro público |
| `/api/signup/workshop` | POST crear taller post-registro |
| `/api/reports/[id]` | GET reporte PDF de servicio |

### Dashboard
| Ruta | Funcionalidad |
|---|---|
| `/dashboard` | Próximos vencimientos (km y fecha), color-coded rojo/ámbar/verde |
| `/dashboard/clientes` | Lista con buscador + paginación, crear/editar/eliminar |
| `/dashboard/vehiculos` | Lista con buscador por patente, crear/editar (con selector de cliente) |
| `/dashboard/servicios` | Lista de servicios activos, crear/editar/finalizar/eliminar |
| `/dashboard/historial` | Servicios finalizados con reportes PDF |
| `/dashboard/interesados` | Presale signups (platform-wide, no per-workshop) |
| `/dashboard/configuracion` | Settings del taller: nombre, CUIT, teléfono, dirección |

### Auth
- Registro con nombre del taller, email, teléfono, contraseña
- Login con email + contraseña
- Better Auth maneja sesiones, el helper `getWorkshopId()` se usa en todas las rutas protegidas

## Tests — 201 tests, 18 archivos, 0 fallos

```
src/
├── app/api/
│   ├── customers/__tests__/          # 8 tests (GET, POST)
│   ├── customers/[id]/__tests__/     # 17 tests (GET, PUT, DELETE)
│   ├── vehicles/__tests__/           # 12 tests (GET, POST)
│   ├── vehicles/[id]/__tests__/      # 13 tests (GET, PUT, DELETE)
│   ├── services/__tests__/           # 11 tests (GET, POST)
│   ├── services/[id]/__tests__/      # 13 tests (GET, PUT, DELETE)
│   ├── services/[id]/finalize/__tests__/  # 5 tests
│   ├── workshops/__tests__/          # 11 tests (GET, PUT)
│   ├── signup/__tests__/             # 7 tests (GET, POST)
│   └── signup/workshop/__tests__/    # 4 tests (POST)
├── app/dashboard/__tests__/          # 17 tests (buildReminderList)
├── features/
│   ├── auth/components/__tests__/    # 21 tests (LoginForm, RegisterForm)
│   ├── customers/components/__tests__/  # 13 tests (CustomerForm)
│   ├── vehicles/components/__tests__/   # 17 tests (VehicleForm)
│   └── workshops/components/__tests__/  # 17 tests (WorkshopForm)
├── test/                             # 9 tests (phone utility)
```

### Patrones de testing
- **API routes**: mockear Drizzle ORM completo (`vi.mock("@/lib/db")`), probar status codes y bodies
- **Frontend forms**: mockear fetch global con routing por URL, next/navigation, authClient, toast
- **Client components sin DB**: funciones puras extraídas a `src/lib/` (ej: `buildReminderList`)

### Convenciones de testing
- `vi.hoisted(() => vi.fn())` para variables dentro de `vi.mock` factories (Vitest hoisting)
- Sin jest-dom — usar `(element as HTMLInputElement).value`
- Fetch mock: implementación por URL en vez de `mockResolvedValue + mockClear`
- `vi.stubGlobal("fetch", mock)` + `vi.unstubAllGlobals()` en cada test

## Estructura del proyecto

```
taller-app/
├── src/
│   ├── app/
│   │   ├── api/           # API routes (Next.js App Router)
│   │   ├── dashboard/     # Dashboard pages (Server Components)
│   │   ├── (auth)/        # Login/Register pages
│   │   └── layout.tsx     # Root layout
│   ├── db/
│   │   └── schema.ts      # Drizzle schema (6 tablas + relaciones)
│   ├── features/          # Feature modules
│   │   ├── auth/          # LoginForm, RegisterForm
│   │   ├── customers/     # CustomerForm, CustomerList, CustomerCard
│   │   ├── vehicles/      # VehicleForm
│   │   ├── services/      # ServiceForm, ServiceList
│   │   ├── signups/       # SignupList (interesados)
│   │   └── workshops/     # WorkshopForm
│   └── lib/               # Utilities
│       ├── db.ts          # Drizzle client (Neon HTTP)
│       ├── auth-client.ts # Better Auth client
│       ├── auth-server.ts # Better Auth server config
│       ├── phone.ts       # normalizePhone
│       ├── reminders.ts   # buildReminderList + tipos
│       ├── toast.ts       # showToast
│       ├── pdf.tsx         # Reporte PDF
│       └── workshop.ts    # getWorkshopId helper
├── drizzle/               # Drizzle migrations
└── vitest.config.ts
```

## Roadmap / Próximos pasos

### Prioridad alta
1. **Deploy a Vercel + Neon** — hosting básico, variables de entorno, dominio
2. **Emails transaccionales** — conectar Resend/SendGrid para que Better Auth pueda enviar verificación y reset de password
3. **Tests de CustomerList, ServiceList** — componentes con buscador, paginación, estados vacío/carga/error

### Prioridad media
4. **Tests de integración crítica** — buildReminderList y finalize service contra DB real (no mockeada)
5. **CI/CD** — GitHub Actions que corran tests antes de mergear
6. **Error monitoring** — Sentry o similar para producción

### Prioridad baja
7. **Tests E2E** — Playwright o Cypress para flujos completos
8. **Modo oscuro persistente** — guardar preferencia del usuario
9. **Exportar reportes** — PDF descargable, email automático al cliente

## Cómo correr

```bash
# Development
npm run dev          # http://localhost:3000

# Tests
npx vitest run       # Suite completa (201 tests)
npx vitest           # Watch mode

# Database
npm run db:generate  # Generar migración Drizzle
npm run db:migrate   # Aplicar migración
npm run db:studio    # Drizzle Studio (GUI DB)

# Build
npm run build
```

## Variables de entorno

Ver `.env.example`. Necesarias:
- `DATABASE_URL` — conexión a Neon PostgreSQL
- `BETTER_AUTH_URL` — base URL de la app (ej: `http://localhost:3000`)
- `BETTER_AUTH_SECRET` — secret para Better Auth
