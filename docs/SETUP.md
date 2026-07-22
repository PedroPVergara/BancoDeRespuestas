# Setup inicial

## 1. Crear proyecto en Supabase

1. Ir a https://supabase.com → Sign up (con GitHub)
2. **New project**:
   - Organization: la que tengas (ej: PPV)
   - Name: `banco-respuestas`
   - Database Password: generá una fuerte y **guardala aparte** (no la vamos a usar directo)
   - Region: **South America (São Paulo)**
   - Plan: Free
3. Esperar ~2 min a que aprovisione

## 2. Correr el SQL

En el dashboard de Supabase → **SQL Editor** → **New query**:

```bash
# Copiar contenido de lib/SETUP_COMPLETO.sql y correr
```

Click **Run**. Debe decir "Success".

## 3. Configurar Auth

En el dashboard → **Authentication** → **Sign In/Up** → **Email**:
- ✅ Email provider habilitado (viene por defecto)
- ❌ **"Confirm email"** desmarcado (importante: así no hay que verificar mail)
- Click **Save changes**

## 4. Obtener credenciales

En el dashboard → ⚙️ **Project Settings** → **API**:

Copiar:
- **Project URL** → `https://xxxxx.supabase.co`
- **anon public key** → el JWT largo que empieza con `eyJ...`

## 5. Pegar en config.js

Editar `config.js`:

```js
window.SUPABASE_CONFIG = {
  url: 'https://TU-PROYECTO.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIs...'
};
```

## 6. Cargar extensión en Chrome

1. Abrir `chrome://extensions/`
2. Activar **"Modo desarrollador"** (arriba derecha)
3. Click **"Cargar extensión sin empaquetar"**
4. Seleccionar la carpeta del proyecto

## 7. Crear cuenta y hacerse admin

1. Click en el icono 💬 de la extensión → pestaña **"Crear cuenta"**
2. Email + contraseña + nombre
3. Loguearse

Ahora en Supabase → SQL Editor, ejecutar:

```sql
update public.profiles 
set role = 'admin' 
where id = (select id from auth.users where email = 'TU_EMAIL@gmail.com');
```

Volvé a la extensión, cerrá sesión y re-entrá. Ya sos admin.

## 8. Refrescar banco de respuestas

1. Avatar → Configuración → **♻️ Refrescar banco seed**
2. Aceptar → "✅ X respuestas + Y palabras insertadas"

Ya tenés el banco cargado.

## Resetear todo (si algo se rompe)

```bash
# En Supabase SQL Editor, correr lib/RESET_TODO.sql
delete from public.responses;
delete from public.words;
```

Después refrescar seed de nuevo.