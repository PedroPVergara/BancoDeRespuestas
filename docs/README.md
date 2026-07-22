# Banco de Respuestas — Documentación

Extensión Chrome/Chromium para responder comentarios en Instagram de manera rápida. Pensada para personas que administran varias cuentas de modelos y necesitan tener un banco de respuestas coquetas listas para copiar y pegar.

## Estado actual

**Versión**: 0.1.0 (en desarrollo activo)

**Stack**:
- Chrome Extension Manifest V3
- Supabase (Postgres + Auth + RLS) — free tier
- Vanilla JavaScript (sin build step)
- Picmo desinstalado, emoji picker custom hecho a mano
- Almacenamiento de sesión: `chrome.storage.local`

**Usuario admin**: `pedro.poncevergara@gmail.com` (único actualmente, puede crear más)

## Funcionalidades

| Feature | Estado |
|---------|--------|
| Auth con email/password | ✅ |
| Login persistente (no se ve al reabrir) | ✅ |
| Banco de respuestas coquetas (seed curado, mayoría preguntas) | ✅ |
| Filtro por tab: Global / Favoritos | ✅ |
| Drag & drop entre tabs | ✅ |
| Estrella en cada burbuja para toggle fav | ✅ |
| Auto-fav al agregar respuestas manuales | ✅ |
| Scroll en contenedor de burbujas | ✅ |
| Burbujas que caben en viewport, sin overflow | ✅ |
| Botón 🎲 genera 50% DB + 50% random | ✅ |
| Emoji picker custom estilo WhatsApp (max 4 por respuesta) | ✅ |
| Modal agregar con texto o solo emojis | ✅ |
| Multi-emojis (concatenados en el campo emoji) | ✅ |
| Categorías: Todo / ? / Bio / Dest / Emoji (con conteo) | ❌ (quité los counts) |
| Admin puede gestionar usuarios (suspender, role) | ✅ |
| Refresh seed automático limpia términos prohibidos | ✅ |
| Auto-cleanup DB: 15 días o 50k respuestas | ✅ |
| Generador IA (MiniMax, OpenAI, Anthropic) | ✅ (opcional) |
| Teams (Nexafans, etc.) | ❌ Removido |
| Admin solo: panel de favoritos de usuarios | ✅ |

## Reglas de negocio (CRÍTICAS)

Las respuestas DEBEN cumplir:

1. **Siempre en masculino o neutro**. NUNCA femenino.
   - ✅ OK: amor, mor, cariño, bebe, nene, papi, bb, guapo, lindo, cielo, corazón, rey
   - ❌ NUNCA: mami, linda, nena, reina, guapa
2. **Nada de precios, pagos, promos, packs, suscripciones**
3. **Nada de plataformas externas**: NO telegram, NO whatsapp, NO onlyfans
4. **NO videollamadas, transferencias, cripto**
5. **NO "tratos" comerciales, NO país/envío físico**
6. **La modelo NO le pregunta al cliente cosas sobre ella misma**. No: "¿subes contenido seguido?", "¿haces videos?", "¿tienes fotos?". Ella ya sabe.
7. **Solo lo que pasa en Instagram**: bio, destacadas, replies, lives, fotos, videos
8. **Redirecciones SIN "?"** (son comandos, no preguntas). Con conectores naturales: "Pasa **por** mi bio amor", "Mira **las** destacadas"
9. **Preguntas al cliente SÍ llevan "?"** al final
10. **70-75% de las respuestas tienen max 3 palabras**, 25-30% tienen 4-5
11. **1-2 emojis por respuesta** (sin repetir)

## Schema de Supabase

### Tablas

- `profiles` (id, display_name, email, role, status, ai_provider, ai_token)
- `responses` (id, user_id, text, emoji, source, use_count, created_at)
- `words` (id, user_id, word, kind) — banco para generación con dado
- `favorites` (user_id, response_id, created_at) — PK compuesta

### RLS

- Cada user solo ve/edita sus propias `responses`, `words`, `favorites`
- Cada user solo ve/edit su propio `profile`
- Admin (role='admin') puede ver todos los profiles
- Admin puede ver (no editar) todos los favorites

### Triggers

- `on_auth_user_created`: crea perfil automáticamente al registrarse

### RPC

- `cleanup_user_responses(uuid)`: borra respuestas > 15 días, o si > 50k, deja solo 49k

## Archivos clave

```
BancoDeRespuestas/
├── manifest.json              ← Permisos Chrome MV3
├── config.js                  ← URL y anon key de Supabase
├── popup.html/css/js          ← Interfaz principal (auth + bubbles)
├── options.html/css/js        ← Configuración (admin)
├── lib/
│   ├── supabase.min.js        ← SDK Supabase (bundled, 208KB)
│   ├── emojis.js              ← Banco de emojis curados + picker custom
│   ├── ui.js                  ← Helpers (toast, copy, escape, fillTemplate)
│   ├── store.js               ← CRUD + auth + admin
│   ├── SETUP_COMPLETO.sql     ← SQL para correr 1 vez en Supabase nuevo
│   └── RESET_TODO.sql         ← SQL para wipear todo
├── icons/                     ← icon16/32/48/128
└── docs/                      ← Esta documentación
```

## Cómo empezar

1. Crear proyecto Supabase → https://supabase.com
2. Correr `lib/SETUP_COMPLETO.sql` en SQL Editor
3. Configurar Auth: Email provider ON, "Confirm email" OFF
4. Copiar `Project URL` + `anon public key` de Supabase
5. Pegar en `config.js`
6. Cargar la extensión en Chrome (modo desarrollador)
7. Crear cuenta, hacer admin con SQL:
   ```sql
   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'TU_EMAIL');
   ```
8. Refrescar banco seed desde opciones

Ver [SETUP.md](SETUP.md) para más detalles.

## Distribución a otras personas

1. Comprimir carpeta como .zip (excluir .git, README.md innecesario)
2. Enviar por WhatsApp/mail
3. Cada persona:
   - Carga el .zip en `chrome://extensions` (modo desarrollador)
   - Crea cuenta propia
4. **Actualizaciones**: el dev (vos) pushea cambios a GitHub. Cada amiga descarga el nuevo .zip y reemplaza los archivos. Hay que hacer click en "Recargar" en `chrome://extensions`.

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para detalles.

## Limitaciones conocidas

- No hay auto-update desde GitHub (requiere Chrome Web Store o hosting propio de CRX)
- Emoji picker no soporta búsqueda por nombre todavía
- El dado es pseudo-aleatorio (no usa crypto.randomBytes)
- Sin tests automatizados
- Sin CI/CD