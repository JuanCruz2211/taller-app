# taller-app — Sistema de Gestión para Talleres Mecánicos

App web multi-tenant diseñada para que los talleres mecánicos administren clientes, vehículos, servicios y recordatorios de vencimientos. Cada taller visualiza y gestiona únicamente sus propios datos.

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Lenguaje** | TypeScript (estricto) |
| **Base de datos** | PostgreSQL via Neon (serverless) |
| **ORM** | Drizzle ORM |
| **Autenticación** | Better Auth |
| **Testing** | Vitest + @testing-library/react |
| **Estilos** | Tailwind CSS |
| **Reportes (PDF)** | @react-pdf/renderer |

## Arquitectura y Decisiones Técnicas

El proyecto sigue una arquitectura clara separando responsabilidades:
- **API Routes** (`src/app/api/`): Manejadores HTTP puros.
- **Server Components** (`src/app/dashboard/`): Fetching de datos del lado del servidor.
- **Client Components** (`src/features/`): Formularios, listas, tarjetas y lógica de interfaz.
- **Multi-tenant**: Cada usuario tiene un `workshopId` asociado. Todas las consultas filtran obligatoriamente por este ID, obtenido mediante el helper `getWorkshopId()`.

### Decisiones Clave
- **Better Auth**: Elegido por su excelente DX con TypeScript y soporte nativo para email/contraseña sin necesidad de providers globales.
- **Neon + Drizzle**: Escalabilidad serverless y un ORM de bajo peso que ofrece un control SQL explícito y gran rendimiento.

## Entorno Local

### Prerrequisitos
Configurar las siguientes variables de entorno en un archivo `.env` (basado en `.env.example`):
- `DATABASE_URL` — Cadena de conexión a Neon PostgreSQL.
- `BETTER_AUTH_URL` — Base URL de la aplicación (ej: `http://localhost:3000`).
- `BETTER_AUTH_SECRET` — Secreto utilizado por Better Auth.

### Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (http://localhost:3000)
npm run dev

# Base de datos (Drizzle)
npm run db:generate  # Generar migraciones
npm run db:migrate   # Aplicar migraciones
npm run db:studio    # Iniciar Drizzle Studio (GUI)

# Ejecutar tests (Vitest)
npx vitest run       # Suite completa
npx vitest           # Modo observación (watch)
```
