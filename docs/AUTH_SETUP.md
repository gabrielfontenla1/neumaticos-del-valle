# Configuración de Autenticación con Google

## Pasos para configurar Google OAuth

### 1. Generar NEXTAUTH_SECRET

Ejecuta este comando en tu terminal para generar un secret seguro:

```bash
openssl rand -base64 32
```

Copia el resultado y pégalo en `.env.local` en la variable `NEXTAUTH_SECRET`.

### 2. Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** → **Credentials**
4. Click en **Create Credentials** → **OAuth client ID**
5. Si es la primera vez, configura la pantalla de consentimiento:
   - Selecciona **External**
   - Llena la información básica (nombre de app, email de soporte)
   - En **Scopes**, agrega: `email` y `profile`
   - Agrega usuarios de prueba si está en modo testing

6. Vuelve a **Credentials** y crea el OAuth client ID:
   - **Application type**: Web application
   - **Name**: Neumáticos del Valle (o el que prefieras)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (desarrollo)
     - Tu dominio de producción cuando lo tengas
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (desarrollo)
     - `https://tu-dominio.com/api/auth/callback/google` (producción)

7. Copia el **Client ID** y **Client Secret** generados
8. Pégalos en `.env.local`:
   ```
   GOOGLE_CLIENT_ID=tu-client-id-aqui
   GOOGLE_CLIENT_SECRET=tu-client-secret-aqui
   ```

### 3. Configuración para Producción

Para producción, actualiza:
- `NEXTAUTH_URL` con tu dominio real
- Agrega tu dominio a los **Authorized JavaScript origins** y **Authorized redirect URIs** en Google Cloud Console

### 4. Probar la Autenticación

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a `/auth/login` o haz click en "Iniciar Sesión" en el navbar

3. Haz click en "Continuar con Google" y sigue el flujo de autenticación

## Características Implementadas

- ✅ Login/Registro con Google
- ✅ Sesión persistente
- ✅ Logout
- ✅ Protección de rutas (middleware)
- ✅ Componente UserButton con menú desplegable
- ✅ Páginas de login y error personalizadas

## Rutas Protegidas

Las siguientes rutas requieren autenticación:
- `/dashboard`
- `/admin`
- `/profile`

Puedes modificar las rutas protegidas en `src/middleware.ts`.

## Personalización

### Agregar más providers

Para agregar otros providers (GitHub, Facebook, etc.), edita `src/auth/auth.config.ts`:

```typescript
import GitHub from "next-auth/providers/github"

providers: [
  Google({...}),
  GitHub({
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
  })
]
```

### Guardar usuarios en base de datos

Si quieres guardar los usuarios en Supabase, puedes agregar callbacks en `src/auth/auth.config.ts`:

```typescript
callbacks: {
  async signIn({ user, account, profile }) {
    // Aquí puedes guardar el usuario en Supabase
    // usando el Supabase client
    return true
  }
}
```