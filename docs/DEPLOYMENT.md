# Deployment

## Estado actual

- **Repo**: `PedroPvergara/BancoDeRespuestas` (GitHub)
- **Distribución**: manual via .zip por WhatsApp/mail
- **Updates**: el dev (vos) tiene que enviar el nuevo .zip manualmente

## Repo strategy

**Recomendación: usar el mismo repo** (`PedroPvergara/BancoDeRespuestas`).

Razones:
- Ya está vinculado a GitHub
- Es chico, no se va a confundir con cosas de Supabase
- SQL migrations en el repo te dan versionado de schema
- `docs/` queda todo junto

### Estructura del repo

```
BancoDeRespuestas/                    ← Repo raíz (todo al mismo nivel)
├── .git/                              ← Histórico git
├── .gitignore                         ← Ignora dist/ y *.zip
├── build.ps1                          ← Script para generar .zip
├── README.md                          ← Overview corto
├── manifest.json                      ← Config MV3 (incluye side_panel)
├── config.js                          ← Credenciales Supabase
├── background.js                      ← Service worker para side panel
├── popup.html / .css / .js           ← UI principal (side panel content)
├── options.html / .css / .js         ← Configuración (admin)
├── lib/
│   ├── supabase.min.js
│   ├── emojis.js                      ← Picker emojis custom (351 emojis)
│   ├── ui.js                          ← Helpers (toast, copy, escape)
│   ├── store.js                       ← CRUD + auth + admin
│   ├── SETUP_COMPLETO.sql             ← Para correr 1 vez en Supabase nuevo
│   └── RESET_TODO.sql                 ← Para wipear todo
├── icons/
├── docs/                              ← Documentación
│   ├── README.md
│   ├── SETUP.md
│   ├── ARCHITECTURE.md
│   ├── CONVENTIONS.md
│   ├── DEPLOYMENT.md                  ← Este archivo
│   └── CHANGELOG.md
└── dist/                              ← (gitignored) zips de distribución
```

## Chrome Side Panel (v0.2.0+)

Desde v0.2.0, la extensión usa **Chrome Side Panel API** en lugar del popup clásico. Esto significa:

- Click en el icono 💬 → abre un **panel lateral fijo** (no un popup)
- El panel **queda visible** mientras navegás Instagram
- **No se cierra** al hacer click fuera (solo con la X del panel)
- Mantiene foco en las burbujas

### Compatibilidad de navegadores

| Navegador | Soporta Side Panel |
|-----------|-------------------|
| Chrome 114+ (mayo 2023) | ✅ |
| Edge 114+ | ✅ |
| Brave, Opera, Vivaldi, Arc | ✅ (todos Chromium-based) |
| Firefox | ❌ (no tiene Side Panel API) |
| Safari | ❌ (soporte limitado) |

**Distribución aproximada**: ~98% de users de Chrome tienen versión 114+ (a 2026).

### Verificar versión

En `chrome://version/` → si dice 114 o más, está OK.
│       ├── ARCHITECTURE.md
│       ├── CONVENTIONS.md
│       ├── DEPLOYMENT.md              ← Este archivo
│       └── CHANGELOG.md
└── supabase/                          ← SQL migrations versionadas
    ├── SETUP_COMPLETO.sql
    ├── RESET_TODO.sql
    └── migrations/                    ← Si querés llevar histórico
        ├── 001_initial.sql
        ├── 002_add_status.sql
        └── ...
```

## ¿Se puede vincular al mismo proyecto Supabase?

**Sí, no hay problema.** El proyecto Supabase es independiente del repo de GitHub. El repo solo guarda el código de la extensión.

El **GitHub integration de Supabase** (que te aparece en el dashboard de Supabase) puede leer de un repo y deployar migrations automáticamente, pero **es opcional**. Si lo querés usar:
- Cada vez que commiteás un archivo `.sql` en `supabase/`, Supabase lo corre automáticamente
- Útil para tener el schema versionado en Git

Si no querés complicarte, no hace falta. Podés seguir corriendo SQL manualmente desde el SQL Editor.

## Auto-update: ¿funciona desde GitHub?

**Respuesta corta: NO**, no por sí solo. Chrome extensions NO auto-actualizan desde GitHub.

### Opciones para auto-update

| Opción | Costo | Dificultad | Cómo funciona |
|--------|-------|-----------|---------------|
| **Chrome Web Store** | $5 único registro | Media | Subís el .zip, Google lo hostea, Chrome actualiza solo |
| **Self-hosted CRX** | Gratis | Alta | Hosteás un .crx + update.xml en un servidor con HTTPS |
| **GitHub Releases + manual** | Gratis | Baja | Cada nueva versión → Release en GitHub → amigas bajan manualmente |

### Recomendación para tu caso (equipo chico)

**Opción 3: GitHub Releases + manual**. Es lo más simple.

### Flujo de actualización con GitHub Releases

1. **Vos** hacés cambios, los testeás localmente
2. Commit + push al repo `PedroPvergara/BancoDeRespuestas`
3. Creás un **Release** en GitHub:
   - Tag: `v0.2.0` (o el número que quieras)
   - Título: "v0.2.0 - Nuevas preguntas coquetas"
   - Adjuntás el `.zip` de la carpeta `BancoDeRespuestas/` (sin `.git`)
4. Enviás el link del release a tus amigas por WhatsApp: *"Nueva versión, bajala de acá"*
5. Cada amiga:
   - Descarga el .zip
   - Reemplaza los archivos en su carpeta de la extensión
   - Va a `chrome://extensions/`
   - Click en el ícono de "recargar" (🔄) en la extensión

### ¿Y la config.js?

Cada amiga tiene su propio `config.js` con sus credenciales Supabase (que son las mismas del proyecto compartido). Cuando ellas actualizan el .zip:
- **NO incluyen el config.js** en el .zip que vos distribuís
- Cada amiga ya tiene su config.js configurado

O alternativamente, incluís el config.js en el .zip (ya que las credenciales son las mismas para todos los users del mismo proyecto Supabase).

**Recomendación: incluir el config.js en el .zip**. Las credenciales son públicas (anon key) y son las mismas para todos. Así evitamos que cada amiga tenga que configurar manualmente.

## Script para crear el .zip de distribución

El repo incluye `build.ps1` (PowerShell) que genera el .zip correctamente con la estructura de carpetas preservada:

```powershell
.\build.ps1 -Version "v0.2.0"
# Genera dist\BancoDeRespuestas-v0.2.0.zip
```

**Para Windows**, abrí PowerShell en la carpeta del proyecto y corré el comando.

**Para Mac/Linux**, se puede adaptar a un script bash equivalente usando `zip -r` excluyendo `.git/`, `docs/`, `dist/` y `*.zip`.

### Manual (lo más simple)

Si no querés usar el script, en Windows:
1. Click derecho en la carpeta del proyecto (sin `.git/`, `docs/`, `dist/`)
2. "Enviar a" → "Carpeta comprimida"
3. Renombrar a `BancoDeRespuestas-v0.X.X.zip`
4. Subir a GitHub Releases

⚠️ **Importante**: si comprimís manualmente la carpeta `BancoDeRespuestas/`, el zip va a tener un nivel extra de carpeta. Chrome puede manejar esto pero es mejor usar `build.ps1` para que el zip tenga los archivos en la raíz.

### `.gitignore` sugerido

```gitignore
.DS_Store
Thumbs.db
*.log
node_modules/
.idea/
.vscode/
```

## Si querés Chrome Web Store (auto-update real)

1. Pagar $5 de registro en https://chrome.google.com/webstore/devconsole/
2. Empaquetar la extensión: `chrome://extensions/` → "Empaquetar extensión"
3. Subir el .zip generado
4. Una vez aprobado, los users pueden instalar desde la tienda
5. Chrome actualiza automáticamente cuando subís nueva versión

**Pros**: auto-update real, distribución fácil (link de la tienda)
**Contras**: revisión de Google (puede tardar días), $5, proceso más burocrático

## Resumen

| Tu pregunta | Respuesta |
|-------------|-----------|
| ¿Mismo repo que Supabase? | Sí, no hay conflicto. Usá `PedroPvergara/BancoDeRespuestas`. |
| ¿Auto-update desde GitHub? | No, a menos que uses Chrome Web Store o hosting propio. |
| ¿Para mis amigas? | Manual: les pasás el .zip nuevo, reemplazan archivos, hacen click en "Recargar" en chrome://extensions. |