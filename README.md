# Banco de Respuestas — Extensión Chrome

Extensión Chrome/Chromium para responder comentarios en Instagram con respuestas coquetas listas para copiar y pegar. Pensada para personas que administran varias cuentas de modelos.

## Quick start

1. **Setup Supabase** (solo una vez, ver [`docs/SETUP.md`](docs/SETUP.md))
2. **Configurar `config.js`** con tu URL y anon key
3. **Cargar extensión** en `chrome://extensions/` (modo desarrollador)
4. **Crear cuenta** y hacerte admin via SQL

## Estructura

```
├── manifest.json              Permisos y config MV3
├── config.js                  Credenciales Supabase
├── popup.html/css/js          Interfaz principal
├── options.html/css/js        Configuración (admin)
├── lib/
│   ├── supabase.min.js        SDK Supabase bundled
│   ├── emojis.js              Picker emojis custom (351 emojis)
│   ├── ui.js                  Helpers (toast, copy, escape)
│   ├── store.js               CRUD + auth + admin
│   ├── SETUP_COMPLETO.sql     Schema inicial (idempotente)
│   └── RESET_TODO.sql         Wipear todo
├── icons/                     16/32/48/128
└── docs/
    ├── README.md              Overview, features, reglas de negocio
    ├── SETUP.md               Pasos iniciales
    ├── ARCHITECTURE.md        Estructura técnica, flujos
    ├── CONVENTIONS.md         Reglas de respuestas + código
    ├── DEPLOYMENT.md          Distribución + actualizaciones
    └── CHANGELOG.md           Histórico de cambios
```

## Documentación

Empezá por [`docs/README.md`](docs/README.md) para el overview general.

Después:
- [`docs/SETUP.md`](docs/SETUP.md) para instalar
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para entender el código
- [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) para las reglas de las respuestas
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) para distribuir

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