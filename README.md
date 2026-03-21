# ZephyrHUB

Sistema operativo interno y externo de ZephyrStudio para la gestión de expedientes del Kit Digital (ERP y Portal B2B).

## Stack

- **Core:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend / DB / Auth:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **UI:** shadcn-style components (Tailwind), estado con Zustand, datos con TanStack Query
- **Formularios:** React Hook Form + Zod
- **Motor de estados:** XState v5 (solo servidor)
- **PDF:** @react-pdf/renderer (acuerdos), react-pdf (visor)

## Requisitos

- Node 18+
- Cuenta Supabase

## Configuración

1. Clonar / abrir el proyecto y instalar dependencias:

   ```bash
   cd zephyros && npm install
   ```

2. Copiar variables de entorno:

   ```bash
   cp .env.local.example .env.local
   ```

3. Rellenar en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Opcional: `SUPABASE_SERVICE_ROLE_KEY` (server actions que bypaseen RLS)
   - Opcional: `LOOPS_WEBHOOK_URL` (webhook Loops en cambios de estado)

4. Aplicar migraciones en Supabase (Dashboard → SQL Editor o `supabase db push`):
   - `supabase/migrations/00001_initial_schema.sql`
   - `00002_rls_policies.sql`
   - `00003_storage.sql`
   - `00004_academy_support.sql`

5. Activar Realtime para la tabla `clients` en Dashboard → Database → Replication.

6. Crear al menos un usuario (Auth → Users) y asignar rol en `profiles` (por ejemplo admin):

   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'tu@email.com';
   ```

## Scripts

- `npm run dev` — Desarrollo
- `npm run build` — Build producción
- `npm run start` — Servidor producción
- `npm run lint` — Lint

## Estructura

- `src/app/` — Rutas App Router: `/` (landing), `/login`, `/portal/*` (beneficiario), `/backoffice/*` (consultor/técnico), `/admin/*` (admin)
- `src/app/actions/` — Server actions (transiciones de estado, documentos, interacciones, acuerdos)
- `src/lib/` — Supabase (server/client/middleware), state-machine, service-config, auth
- `src/components/` — UI y providers
- `supabase/migrations/` — SQL esquema y RLS
- `supabase/functions/` — Edge Function `package-evidencias` (ZIP de evidencias)

## Kanban con Drag & Drop (opcional)

Para habilitar la vista Kanban con arrastrar y soltar en el pipeline:

```bash
npm install @dnd-kit/core @dnd-kit/utilities
```

Luego implementar el componente usando `transitionClientState` al soltar en otra fase (ver plan PRD Fase 4). La vista actual usa solo dropdown por tarjeta.

## Edge Function ZIP

La función `package-evidencias` en `supabase/functions/package-evidencias` está preparada para recibir `client_id` y devolver una URL de descarga del ZIP. Falta implementar la lógica de descarga de archivos, renombrado según Red.es y compresión. Desplegar con:

```bash
supabase functions deploy package-evidencias
```

## Referencia

Ver documento maestro de producto (PRD) y plan de implementación en `.cursor/plans/` para alcance completo y fases.
