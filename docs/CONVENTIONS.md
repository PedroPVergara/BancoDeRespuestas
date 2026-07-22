# Convenciones

## Reglas de las respuestas (CRÍTICAS)

Estas son las reglas de negocio que DEBEN respetarse siempre:

### 1. Referencia al cliente: SIEMPRE masculino o neutro

| ✅ OK | ❌ NUNCA |
|------|----------|
| amor, mor, cariño, bebe, nene, papi, bb | mami, linda, nena, reina, guapa |
| guapo, hermoso, lindo, corazón, cielo, rey | |
| Terminos neutros: bb, cielo, corazón | |

### 2. NO comercial, NO precios, NO plataformas externas

**NUNCA** mencionar:
- Precios: "cuánto cobras", "cuánto mide"
- Pagos: "aceptas cripto", "aceptas transferencia", "trato"
- Promos: "promo", "descuento", "suscripción"
- Packs: "tienes pack"
- Plataformas externas: "telegram", "whatsapp", "videollamada", "onlyfans"
- Envío: "envías a mi país", "cuándo entregas", "es mensual"

**SÍ** mencionar (todo dentro de Instagram):
- Bio, link en bio
- Destacadas / highlights / stories
- DM (mensaje directo de Instagram)
- Lives, fotos, videos

### 3. La modelo NO se pregunta cosas a sí misma

Ella ya sabe si sube contenido, hace lives, etc. NO preguntar:
- "¿subes contenido seguido?"
- "¿haces videos?"
- "¿tienes fotos?"
- "¿atiendes?"
- "¿es nuevo?"
- "¿es seguro?"

SÍ puede preguntar al cliente **sobre él**:
- "¿Y tú?"
- "¿Muéstrame?"
- "¿Dime más?"
- "¿Te gustó?"
- "¿Vas a volver?"

### 4. Redirecciones vs preguntas

**Redirecciones** (comandos, SIN "?"):
- "Pasa por mi bio amor"
- "Mira las destacadas"
- "Bio + destacadas mor"
- "Link en bio"
- "Te espero en bio"
- "Pasa bio papi"
- "Pasa por destacadas cariño"

**Preguntas** (llevan "?" al final):
- "Y tú?"
- "Muéstrame"
- "Ayy serio mor?"
- "¿Tú también piensas eso?"
- "En serio me dices eso?"
- "Te gustó?"
- "Algo más?"

### 5. Conectores naturales en redirecciones

Preferir formas con "por", "las", "y":
- ❌ "Pasa destacadas"
- ✅ "Pasa por destacadas" / "Pasa por mis destacadas amor"

### 6. Longitud

- 70-75% con **max 3 palabras**
- 25-30% con 4-5 palabras
- Sin "?" al inicio de las preguntas (solo al final)

### 7. Emojis

- **1 o 2 emojis por respuesta**
- Sin repetir el mismo emoji
- Pool válido:
  ```
  💕 😏 🥺 🙈 😈 🔥 👀 😩 🥰 😍 💋 ✨ 💖 💯 🥳 😘 🤭 😻 ❤️
  ```

### 8. Sin "¿" al inicio

Todas las preguntas modernas en chat usan solo "?" al final:
- ❌ "¿Tienes pack?"
- ✅ "Tienes pack?"

## Convenciones de código

### JavaScript
- Vanilla JS, sin frameworks
- Sin TypeScript (por simplicidad)
- IIFE para encapsular: `(function() { ... })()`
- Nombres descriptivos en español para el dominio, inglés para funciones técnicas
- Comentarios solo donde la lógica no es obvia (NO comentar lo obvio)

### CSS
- Variables CSS en `:root` para tema
- Soporte para dark mode con `@media (prefers-color-scheme: dark)`
- Mobile-first responsive (aunque por ahora solo popup)
- BEM-like naming: `.br-component__element--modifier`

### SQL
- Idempotente: usar `if not exists`, `drop policy if exists`
- Triggers con `create or replace function`
- RLS policies con nombres descriptivos

### Archivos
- Todos los archivos en UTF-8
- LF line endings (no CRLF)
- Sin trailing whitespace

## Reglas para agregar nuevas features

1. **Antes de implementar**, actualizar `CHANGELOG.md` con la fecha y plan
2. **Después de implementar**, agregar entrada en `CHANGELOG.md` con qué cambió
3. **Si es SQL**, agregar al final de `SETUP_COMPLETO.sql` (idempotente)
4. **Si afecta UI**, actualizar capturas/screenshots en `docs/`
5. **Si cambia business rules**, actualizar este archivo `CONVENTIONS.md`

## Naming conventions

- **Variables JS**: `state.something`, camelCase
- **CSS classes**: `.br-something`, kebab-case
- **IDs HTML**: `br-something-id` (kebab-case)
- **SQL columns**: snake_case
- **SQL tables**: plural snake_case (`responses`, `favorites`)
- **Funciones SQL**: snake_case (`cleanup_user_responses`)

## Versionado

Por ahora sin versioning formal (todo es 0.1.0). Cuando se haga 1.0:
- Cambios breaking → bump major
- Features nuevas → bump minor
- Bug fixes → bump patch