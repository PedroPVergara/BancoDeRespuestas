# Banco de Respuestas — Extensión Chrome

Extensión Chrome/Chromium que se abre como **Side Panel** (panel lateral fijo) para responder comentarios en Instagram con respuestas coquetas listas para copiar y pegar. Pensada para personas que administran varias cuentas de modelos.

## Quick start

1. **Setup Supabase** (solo una vez, ver [`docs/SETUP.md`](docs/SETUP.md))
2. **Configurar `config.js`** con tu URL y anon key
3. **Cargar extensión** en `chrome://extensions/` (modo desarrollador)
4. **Crear cuenta** y hacerte admin via SQL

## Compatibilidad

- ✅ **Chrome 114+** (mayo 2023) — recomendado
- ✅ Edge 114+, Brave, Opera, Vivaldi, Arc (todos Chromium-based)
- ❌ Firefox (no tiene Side Panel API)
- ❌ Safari (soporte limitado)

## Estructura

```
├── manifest.json              Permisos MV3 (incluye side_panel)
├── background.js              Service worker (openPanelOnActionClick)
├── config.js                  Credenciales Supabase
├── popup.html / .css / .js    UI principal (cargada en side panel)
├── options.html / .css / .js  Configuración (admin)
├── lib/
│   ├── supabase.min.js        SDK Supabase bundled
│   ├── emojis.js              Picker emojis custom (351 emojis)
│   ├── ui.js                  Helpers (toast, copy, escape)
│   ├── store.js               CRUD + auth + admin
│   ├── SETUP_COMPLETO.sql     Schema inicial (idempotente)
│   └── RESET_TODO.sql         Wipear todo
├── icons/                     16/32/48/128
├── build.ps1                  Script para generar .zip de distribución
├── docs/                      Documentación completa
└── dist/                      (gitignored) zips de distribución
```

## Documentación

Empezá por [`docs/README.md`](docs/README.md) para el overview general.

Después:
- [`docs/SETUP.md`](docs/SETUP.md) para instalar
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para entender el código
- [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) para las reglas de las respuestas
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) para distribuir y actualizar

## Reglas críticas

**Las respuestas DEBEN**:
- Referirse al cliente en masculino o neutro (nunca mami, linda, nena)
- No mencionar precios, promos, packs, plataformas externas
- No preguntar cosas sobre la modelo a sí misma
- Solo cosas que pasan en Instagram
- Redirecciones SIN "?", preguntas CON "?"
- 70-75% con max 3 palabras
- 1-2 emojis por respuesta

Ver [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) para detalle completo.

## Build

```powershell
.\build.ps1 -Version "v0.2.0"
# Genera dist\BancoDeRespuestas-v0.2.0.zip
```

El zip queda en `dist/`, listo para subir a GitHub Releases.

## Distribución

Cada user:
1. Descarga el .zip del release
2. Descomprime en una carpeta
3. Va a `chrome://extensions/`
4. Activa "Modo desarrollador"
5. Click "Cargar extensión sin empaquetar"
6. Selecciona la carpeta descomprimida
7. Click en el icono 💬 → abre el side panel al costado

Actualizaciones: cada user descarga el nuevo .zip, reemplaza archivos, click en 🔄 Recargar en `chrome://extensions/`.