# Arquitectura

## Flujo de datos

```
┌─────────────────────────────────────────────────────────┐
│  Chrome Extension Popup (380x600)                        │
│                                                          │
│  ┌──────────┐  ┌────────────────────────┐               │
│  │ Header   │  │ 🔗 Bio | ✨ Dest | 😀 Emoji │  ← chips  │
│  │ + avatar │  └────────────────────────┘               │
│  └──────────┘                                            │
│                                                          │
│  ┌──────────────────────────────────────┐               │
│  │ [bubble] [bubble] [bubble]           │  ← scroll    │
│  │ [bubble] [bubble]                    │               │
│  │ [bubble] [bubble] [bubble]           │               │
│  │              [bubble]                │               │
│  └──────────────────────────────────────┘               │
│                                                          │
│  [+] Agregar                            [🎲] Generar    │
└─────────────────────────────────────────────────────────┘
          │
          ▼ chrome.runtime
          │
┌─────────────────────────────────────────────────────────┐
│  Service Worker (background)                              │
│  - Maneja chrome.runtime.openOptionsPage()                │
│  - Sin lógica de negocio                                 │
└─────────────────────────────────────────────────────────┘
          │
          ▼ supabase-js (REST + Realtime)
          │
┌─────────────────────────────────────────────────────────┐
│  Supabase (free tier)                                    │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐      │
│  │  profiles   │  │  responses  │  │  favorites   │      │
│  │  - id       │  │  - id       │  │  - user_id   │      │
│  │  - role     │  │  - user_id  │  │  - resp_id   │      │
│  │  - status   │  │  - text     │  │  - created   │      │
│  │  - ai_*     │  │  - emoji    │  └──────────────┘      │
│  └─────────────┘  │  - source   │                        │
│                   │  - use_ct   │  ┌──────────────┐      │
│  ┌─────────────┐  └─────────────┘  │    words      │      │
│  │    words    │                   │  - user_id   │      │
│  │  - word     │                   │  - word      │      │
│  │  - kind     │                   │  - kind      │      │
│  └─────────────┘                   └──────────────┘      │
│                                                          │
│  RLS: cada user solo ve sus datos                        │
│  Admin: ve profiles + favorites de todos                 │
└─────────────────────────────────────────────────────────┘
```

## Estructura de archivos

```
BancoDeRespuestas/
├── manifest.json              ← MV3, permisos: storage + clipboardWrite
├── config.js                  ← URL + anon key (cada uno tiene el suyo)
│
├── popup.html                 ← Interfaz principal
├── popup.css                  ← Estilos (variables CSS, dark mode)
├── popup.js                   ← Lógica: auth, render, dado, drag&drop, favs
│
├── options.html               ← Configuración (admin-only en gran parte)
├── options.css                ← Estilos opciones
├── options.js                 ← Lógica opciones (admin, IA, favoritos)
│
├── lib/
│   ├── supabase.min.js        ← SDK Supabase (208KB, bundled local)
│   ├── emojis.js              ← 351 emojis curados + 9 categorías
│   ├── ui.js                  ← Toast, copy, escape, fillTemplate
│   ├── store.js               ← CRUD: auth, responses, favs, admin
│   ├── SETUP_COMPLETO.sql     ← Para correr 1 vez en Supabase nuevo
│   └── RESET_TODO.sql         ← Para wipear todo
│
├── icons/icon{16,32,48,128}.png
│
└── docs/
    ├── README.md              ← Overview
    ├── SETUP.md               ← Pasos iniciales
    ├── ARCHITECTURE.md         ← Este archivo
    ├── CONVENTIONS.md         ← Reglas de código y respuestas
    ├── DEPLOYMENT.md          ← Cómo distribuir y actualizar
    └── CHANGELOG.md           ← Histórico de cambios
```

## Estado por archivo

### popup.js (~17KB)
- **State global**: `state.responses`, `state.words`, `state.shown`, `state.favoriteIds`, `state.activeTab`, `state.activeCategory`
- **Funciones principales**:
  - `init()` — chequea sesión, muestra loading
  - `loadProfileAndData()` — carga todo
  - `loadResponses()`, `loadWords()`, `loadFavorites()`
  - `renderTeamsCarousel()` — REMOVIDO
  - `renderBubbles()` — genera DOM de burbujas con estrella
  - `renderCategoryChips()` — chips de categorías (sin counts)
  - `renderEmojiGrid()` — picker custom WhatsApp-style
  - `onBubbleClick()` — copia al portapapeles + toast
  - `onDiceClick()` — 50% DB + 50% random
  - `toggleFavorite()` — star click
  - `setupTabs()` — tabs + drag&drop

### store.js (~16KB)
- **Cliente Supabase**: configurado con `chrome.storage.local` para persistir sesión
- **Auth**: `signUp`, `signIn` (chequea suspensión), `signOut`, `getSession`
- **Profile**: `getProfile`, `updateProfile`, `isAdmin`
- **Responses**: `listResponses`, `addResponse`, `addResponsesBatch` (auto-fav en manual)
- **Favorites**: `listFavoriteIds`, `addFavorite`, `removeFavorite`, `listUserFavorites`
- **Admin**: `listAllUsers`, `setUserRole`, `setUserStatus`
- **Cleanup**: `ensureCapacity` (llama RPC), `refreshSeed`

### options.js (~13KB)
- Solo admins pueden ver la mayoría
- Carga perfil, equipos (REMOVIDO), usuarios, favoritos
- Generador IA con MiniMax/OpenAI/Anthropic

## Flujos clave

### Login y persistencia

```
Popup abre → init() → loading spinner
  ↓
getSession() desde chrome.storage.local (síncrono en disco)
  ↓
Tiene sesión? → main view → loadProfileAndData() → renderBubbles()
No tiene? → auth view → login/signup form
```

### Click en burbuja

```
onBubbleClick(btn, item)
  ↓
copyToClipboard(text + emoji)
  ↓
btn.classList.add('br-bubble--copied') (amarillo + texto blanco)
Toast.show('¡Copiado!')
  ↓
Store.incrementUseCount(item.id)
  ↓
setTimeout(1400ms) → quitar clase copied
```

### Toggle favorito

```
Click en estrella
  ↓
toggleFavorite(item.id, starBtn, btn)
  ↓
Store.addFavorite o Store.removeFavorite
  ↓
state.favoriteIds.add/delete
updateFavCount() — actualiza el badge "Favoritos N"
Renderiza la estrella con ⭐ o ☆
```

### Dado (generación)

```
Click 🎲
  ↓
9 random del pool + 9 random generados
  ↓
Store.addResponsesBatch(generated) — guarda en DB
  ↓
state.responses = [saved, ...state.responses]
Render mix de 18 burbujas
```

### Auto-cleanup

```
Antes de cada add (manual o batch):
  ensureCapacity() → RPC cleanup_user_responses(user_id)
  ↓
  1. Borra respuestas > 15 días
  2. Si > 50k, deja solo 49k (borra oldest)
```

## Decisiones técnicas

- **Vanilla JS**: cero build step, archivo .js listo para cargar
- **chrome.storage.local** en vez de localStorage: persiste sesión aunque limpien cookies
- **Supabase JS bundled local**: evita problemas de CSP en Manifest V3
- **Emoji picker custom**: 351 emojis curados + búsqueda, vs librería pesada
- **Sin frameworks**: la app es chica, no justifica React/Vue
- **Sin tests**: por simplicidad. Sería bueno agregar pero es secundario

## Lo que NO incluimos (y por qué)

- **Teams**: complejidad de RLS no compensaba el valor para el caso de uso
- **Infinite scroll**: con ~60 respuestas y 18 visibles, no aporta
- **Service worker**: no hay lógica background que lo justifique
- **Auto-update desde GitHub**: requiere Chrome Web Store o hosting CRX
- **Tests automatizados**: cero por ahora, prioridad baja
- **CI/CD**: manual por ahora
- **Internacionalización**: solo español
- **Sincronización offline**: las respuestas se cargan al inicio, no hay sync